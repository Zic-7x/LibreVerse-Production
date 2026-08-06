import type { FastifyInstance } from "fastify";
import type {
  CreateDirectConversationInput,
  EditMessageInput,
  SendMessageInput,
  UpdateParticipantSettingsInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  EditMessageUseCase,
  GetConversationMessagesUseCase,
  GetOrCreateDirectConversationUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendTextMessageUseCase,
  SoftDeleteMessageUseCase,
  UpdateParticipantSettingsUseCase,
} from "../../../application/use-cases/messaging/messaging-use-cases.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface MessagingRouteDeps {
  getOrCreateDirectConversation: GetOrCreateDirectConversationUseCase;
  listConversations: ListConversationsUseCase;
  getConversationMessages: GetConversationMessagesUseCase;
  sendTextMessage: SendTextMessageUseCase;
  editMessage: EditMessageUseCase;
  softDeleteMessage: SoftDeleteMessageUseCase;
  markConversationRead: MarkConversationReadUseCase;
  updateParticipantSettings: UpdateParticipantSettingsUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerMessagingRoutes(
  app: FastifyInstance,
  deps: MessagingRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Get or Create Direct Conversation
  app.post(
    "/conversations/direct",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as CreateDirectConversationInput;

      return handleUseCase(
        reply,
        () =>
          deps.getOrCreateDirectConversation.execute(
            auth.userId,
            body.targetUserId,
          ),
        201,
      );
    },
  );

  // List Conversations
  app.get(
    "/conversations",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.listConversations.execute(auth.userId),
      );
    },
  );

  // Get Conversation Messages
  app.get(
    "/conversations/:id/messages",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const query = request.query as { limit?: string; before?: string };

      const limit = query.limit ? parseInt(query.limit, 10) : undefined;
      const before = query.before;

      return handleUseCase(reply, () =>
        deps.getConversationMessages.execute(auth.userId, id, {
          limit,
          before,
        }),
      );
    },
  );

  // Send Text Message
  app.post(
    "/conversations/:id/messages",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as SendMessageInput;

      return handleUseCase(
        reply,
        () => deps.sendTextMessage.execute(auth.userId, id, body),
        201,
      );
    },
  );

  // Edit Message
  app.patch(
    "/messages/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as EditMessageInput;

      return handleUseCase(reply, () =>
        deps.editMessage.execute(auth.userId, id, body),
      );
    },
  );

  // Soft Delete Message
  app.delete(
    "/messages/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, () =>
        deps.softDeleteMessage.execute(auth.userId, id),
      );
    },
  );

  // Mark Conversation Read
  app.post(
    "/conversations/:id/read",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(
        reply,
        () => deps.markConversationRead.execute(auth.userId, id),
        204,
      );
    },
  );

  // Update Participant Settings (Mute/Unmute)
  app.patch(
    "/conversations/:id/participants/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateParticipantSettingsInput;

      return handleUseCase(
        reply,
        () => deps.updateParticipantSettings.execute(auth.userId, id, body),
        204,
      );
    },
  );
}
