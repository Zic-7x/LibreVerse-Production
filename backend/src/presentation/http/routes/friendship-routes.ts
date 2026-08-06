import type { FastifyInstance } from "fastify";
import type {
  BlockUserInput,
  RespondFriendRequestInput,
  SendFriendRequestInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  BlockUserUseCase,
  CheckInteractionPolicyUseCase,
  ListBlockedUsersUseCase,
  ListFriendsUseCase,
  ListPendingRequestsUseCase,
  RemoveFriendshipUseCase,
  RespondFriendRequestUseCase,
  SendFriendRequestUseCase,
  UnblockUserUseCase,
} from "../../../application/use-cases/friendship/friendship-use-cases.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface FriendshipRouteDeps {
  sendFriendRequest: SendFriendRequestUseCase;
  respondFriendRequest: RespondFriendRequestUseCase;
  blockUser: BlockUserUseCase;
  unblockUser: UnblockUserUseCase;
  removeFriendship: RemoveFriendshipUseCase;
  listFriends: ListFriendsUseCase;
  listPendingRequests: ListPendingRequestsUseCase;
  listBlockedUsers: ListBlockedUsersUseCase;
  checkInteractionPolicy: CheckInteractionPolicyUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerFriendshipRoutes(
  app: FastifyInstance,
  deps: FriendshipRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Send friend request
  app.post(
    "/friends/requests",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as SendFriendRequestInput;

      return handleUseCase(
        reply,
        () => deps.sendFriendRequest.execute(auth.userId, body.targetUserId),
        201,
      );
    },
  );

  // Respond to friend request
  app.post(
    "/friends/requests/:id/respond",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as RespondFriendRequestInput;

      return handleUseCase(reply, () =>
        deps.respondFriendRequest.execute(auth.userId, id, body.action),
      );
    },
  );

  // List friends
  app.get(
    "/friends",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () => deps.listFriends.execute(auth.userId));
    },
  );

  // List incoming requests
  app.get(
    "/friends/requests/incoming",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.listPendingRequests.execute(auth.userId, "incoming"),
      );
    },
  );

  // List outgoing requests
  app.get(
    "/friends/requests/outgoing",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.listPendingRequests.execute(auth.userId, "outgoing"),
      );
    },
  );

  // Delete/unfriend
  app.delete(
    "/friends/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(
        reply,
        () => deps.removeFriendship.execute(auth.userId, id),
        204,
      );
    },
  );

  // Block user
  app.post(
    "/blocks",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as BlockUserInput;

      return handleUseCase(
        reply,
        () => deps.blockUser.execute(auth.userId, body.targetUserId),
        201,
      );
    },
  );

  // Unblock user
  app.delete(
    "/blocks/:targetUserId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { targetUserId } = request.params as { targetUserId: string };

      return handleUseCase(
        reply,
        () => deps.unblockUser.execute(auth.userId, targetUserId),
        204,
      );
    },
  );

  // List blocked users
  app.get(
    "/blocks",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.listBlockedUsers.execute(auth.userId),
      );
    },
  );

  // Check interaction policy with target user
  app.get(
    "/friends/policy/:targetUserId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { targetUserId } = request.params as { targetUserId: string };

      return handleUseCase(reply, () =>
        deps.checkInteractionPolicy.execute(auth.userId, targetUserId),
      );
    },
  );
}
