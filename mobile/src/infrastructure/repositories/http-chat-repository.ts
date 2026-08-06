import type { MobileConversation, MobileMessage } from "../../domain/entities/chat.js";
import type { ChatRepository, SendMessageInput } from "../../domain/repositories/chat-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpChatRepository implements ChatRepository {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly wsUrl: string = "ws://127.0.0.1:3000/ws/messages",
  ) {}

  async listConversations(token: string): Promise<MobileConversation[]> {
    const res = await this.apiClient.request<{ conversations: MobileConversation[] }>("/conversations", {
      method: "GET",
      token,
    });
    return res.conversations || [];
  }

  async createDirectConversation(token: string, targetUserId: string): Promise<MobileConversation> {
    const res = await this.apiClient.request<{ conversation: MobileConversation }>("/conversations/direct", {
      method: "POST",
      token,
      body: JSON.stringify({ targetUserId }),
    });
    return res.conversation;
  }

  async getMessages(token: string, conversationId: string): Promise<MobileMessage[]> {
    const res = await this.apiClient.request<{ messages: MobileMessage[] }>(
      `/conversations/${conversationId}/messages`,
      {
        method: "GET",
        token,
      },
    );
    return res.messages || [];
  }

  async sendMessage(token: string, conversationId: string, input: SendMessageInput): Promise<MobileMessage> {
    const res = await this.apiClient.request<{ message: MobileMessage }>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        token,
        body: JSON.stringify(input),
      },
    );
    return res.message;
  }

  async editMessage(
    token: string,
    conversationId: string,
    messageId: string,
    body: string,
  ): Promise<MobileMessage> {
    const res = await this.apiClient.request<{ message: MobileMessage }>(
      `/conversations/${conversationId}/messages/${messageId}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ body }),
      },
    );
    return res.message;
  }

  async deleteMessage(token: string, conversationId: string, messageId: string): Promise<void> {
    await this.apiClient.request<void>(
      `/conversations/${conversationId}/messages/${messageId}`,
      {
        method: "DELETE",
        token,
      },
    );
  }

  async markConversationRead(token: string, conversationId: string): Promise<void> {
    await this.apiClient.request<void>(`/conversations/${conversationId}/read`, {
      method: "POST",
      token,
    });
  }


  connectWebSocket(token: string, onMessage: (msg: MobileMessage) => void): () => void {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${this.wsUrl}?token=${encodeURIComponent(token)}`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "message" && data.payload) {
            onMessage(data.payload as MobileMessage);
          }
        } catch {
          // Ignore invalid WS payload
        }
      };
    } catch {
      // Failed to connect WS
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }
}
