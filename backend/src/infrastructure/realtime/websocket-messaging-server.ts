import randomUUID from "node:crypto";
import type { WebSocket } from "ws";
import type {
  Message,
  RealtimeEvent,
  WsClientAction,
} from "@platform/shared-types";
import type { AccessTokenService } from "../../application/interfaces/auth.js";
import type { MessagingRepository } from "../../application/interfaces/messaging.js";
import type { RealtimePublisher } from "../../application/interfaces/realtime.js";

interface ConnectedClient {
  socket: WebSocket;
  userId: string;
  subscriptions: Set<string>; // set of conversationIds
}

export class WebSocketMessagingServer implements RealtimePublisher {
  private readonly clients = new Set<ConnectedClient>();

  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly messagingRepo: MessagingRepository,
  ) {}

  async handleConnection(socket: WebSocket, token: string): Promise<void> {
    let payload;
    try {
      payload = await this.accessTokens.verify(token);
    } catch {
      socket.close(1008, "Unauthorized");
      return;
    }

    const client: ConnectedClient = {
      socket,
      userId: payload.userId,
      subscriptions: new Set<string>(),
    };

    this.clients.add(client);

    socket.on("message", async (data) => {
      try {
        const raw = data.toString();
        const action = JSON.parse(raw) as WsClientAction;
        await this.handleClientAction(client, action);
      } catch (err) {
        socket.send(
          JSON.stringify({
            error: "BAD_REQUEST",
            message: err instanceof Error ? err.message : "Invalid message format",
          }),
        );
      }
    });

    socket.on("close", () => {
      this.clients.delete(client);
    });

    socket.on("error", () => {
      this.clients.delete(client);
    });

    socket.send(
      JSON.stringify({
        type: "authenticated",
        userId: client.userId,
      }),
    );
  }

  private async handleClientAction(
    client: ConnectedClient,
    action: WsClientAction,
  ): Promise<void> {
    if (action.action === "subscribe") {
      const participant = await this.messagingRepo.getParticipant(
        action.conversationId,
        client.userId,
      );

      if (!participant || participant.leftAt !== null) {
        client.socket.send(
          JSON.stringify({
            error: "FORBIDDEN",
            message: "You are not a participant in this conversation",
            conversationId: action.conversationId,
          }),
        );
        return;
      }

      client.subscriptions.add(action.conversationId);
      client.socket.send(
        JSON.stringify({
          type: "subscribed",
          conversationId: action.conversationId,
        }),
      );
    } else if (action.action === "unsubscribe") {
      client.subscriptions.delete(action.conversationId);
      client.socket.send(
        JSON.stringify({
          type: "unsubscribed",
          conversationId: action.conversationId,
        }),
      );
    } else if (action.action === "typing") {
      if (!client.subscriptions.has(action.conversationId)) {
        client.socket.send(
          JSON.stringify({
            error: "FORBIDDEN",
            message: "Must subscribe to conversation before sending typing status",
          }),
        );
        return;
      }

      this.publishTypingIndicator(
        action.conversationId,
        client.userId,
        action.isTyping,
        client.userId, // skip self
      );
    }
  }

  publishMessageCreated(conversationId: string, message: Message): void {
    const event: RealtimeEvent<Message> = {
      eventId: randomUUID.randomUUID(),
      eventType: "message.created",
      conversationId,
      payload: message,
      version: "1.0",
      timestamp: new Date().toISOString(),
    };

    this.broadcastToRoom(conversationId, event);
  }

  publishMessageUpdated(conversationId: string, message: Message): void {
    const event: RealtimeEvent<Message> = {
      eventId: randomUUID.randomUUID(),
      eventType: "message.updated",
      conversationId,
      payload: message,
      version: "1.0",
      timestamp: new Date().toISOString(),
    };

    this.broadcastToRoom(conversationId, event);
  }

  publishMessageDeleted(conversationId: string, message: Message): void {
    const event: RealtimeEvent<Message> = {
      eventId: randomUUID.randomUUID(),
      eventType: "message.deleted",
      conversationId,
      payload: message,
      version: "1.0",
      timestamp: new Date().toISOString(),
    };

    this.broadcastToRoom(conversationId, event);
  }

  publishTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean,
    skipUserId?: string,
  ): void {
    const event: RealtimeEvent<{ userId: string; isTyping: boolean }> = {
      eventId: randomUUID.randomUUID(),
      eventType: "typing.indicator",
      conversationId,
      payload: { userId, isTyping },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToRoom(conversationId, event, skipUserId);
  }

  private broadcastToRoom(
    conversationId: string,
    event: RealtimeEvent<unknown>,
    skipUserId?: string,
  ): void {
    const payload = JSON.stringify(event);

    for (const client of this.clients) {
      if (
        client.subscriptions.has(conversationId) &&
        client.socket.readyState === 1 && // OPEN
        client.userId !== skipUserId
      ) {
        client.socket.send(payload);
      }
    }
  }
}
