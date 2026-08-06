import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  AddOrInviteMemberUseCase,
  ArchiveCommunityUseCase,
  CreateCommunityUseCase,
  GetCommunityUseCase,
  JoinCommunityUseCase,
  LeaveCommunityUseCase,
  ListCommunityMembersUseCase,
  ListPublicCommunitiesUseCase,
  ListUserCommunitiesUseCase,
  RemoveMemberUseCase,
  TransferOwnershipUseCase,
  UpdateCommunityUseCase,
  UpdateMemberRoleUseCase,
} from "../../../application/use-cases/community/community-use-cases.js";
import type {
  ArchiveChannelUseCase,
  CreateChannelUseCase,
  ListChannelsUseCase,
  UpdateChannelUseCase,
} from "../../../application/use-cases/community/channel-use-cases.js";
import { canAuthenticate, isBlockedStatus } from "../../../domain/entities/auth-entities.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface CommunityRouteDeps {
  createCommunity: CreateCommunityUseCase;
  getCommunity: GetCommunityUseCase;
  listPublicCommunities: ListPublicCommunitiesUseCase;
  listUserCommunities: ListUserCommunitiesUseCase;
  updateCommunity: UpdateCommunityUseCase;
  archiveCommunity: ArchiveCommunityUseCase;
  joinCommunity: JoinCommunityUseCase;
  leaveCommunity: LeaveCommunityUseCase;
  addOrInviteMember: AddOrInviteMemberUseCase;
  updateMemberRole: UpdateMemberRoleUseCase;
  removeMember: RemoveMemberUseCase;
  transferOwnership: TransferOwnershipUseCase;
  listCommunityMembers: ListCommunityMembersUseCase;
  createChannel?: CreateChannelUseCase;
  listChannels?: ListChannelsUseCase;
  updateChannel?: UpdateChannelUseCase;
  archiveChannel?: ArchiveChannelUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

function createOptionalAuthMiddleware(
  accessTokens: AccessTokenService,
  users: UserRepository,
) {
  return async function optionalAuthMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = await accessTokens.verify(token);
      const user = await users.findById(payload.userId);
      if (user && canAuthenticate(user) && !isBlockedStatus(user.status)) {
        (request as AuthenticatedRequest).auth = {
          userId: payload.userId,
          sessionId: payload.sessionId,
        };
      }
    } catch {
      // Ignore invalid token in optional auth
    }
  };
}

export function registerCommunityRoutes(
  app: FastifyInstance,
  deps: CommunityRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);
  const optionalAuthMiddleware = createOptionalAuthMiddleware(deps.accessTokens, deps.users);

  // 1. Create Community
  app.post(
    "/communities",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(
        reply,
        () => deps.createCommunity.execute(auth.userId, request.body),
        201,
      );
    },
  );

  // 2. List Public Communities
  app.get(
    "/communities",
    { preHandler: optionalAuthMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(
        reply,
        async () => {
          const communities = await deps.listPublicCommunities.execute(auth?.userId);
          return { communities };
        },
        200,
      );
    },
  );

  // 3. List My Communities
  app.get(
    "/communities/mine",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(
        reply,
        async () => {
          const communities = await deps.listUserCommunities.execute(auth.userId);
          return { communities };
        },
        200,
      );
    },
  );

  // 4. Get Community by ID or Slug
  app.get(
    "/communities/:identifier",
    { preHandler: optionalAuthMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { identifier: string };
      return handleUseCase(
        reply,
        async () => {
          const community = await deps.getCommunity.execute(params.identifier, auth?.userId);
          return { community, role: community.currentUserRole ?? null };
        },
        200,
      );
    },
  );

  // 5. Update Community Settings
  app.patch(
    "/communities/:communityId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const community = await deps.updateCommunity.execute(
            params.communityId,
            auth.userId,
            request.body,
          );
          return { community, role: community.currentUserRole ?? null };
        },
        200,
      );
    },
  );

  // 6. Archive Community
  app.post(
    "/communities/:communityId/archive",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const community = await deps.archiveCommunity.execute(params.communityId, auth.userId);
          return { community, role: community.currentUserRole ?? null };
        },
        200,
      );
    },
  );

  // 7. Join Community
  app.post(
    "/communities/:communityId/join",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const member = await deps.joinCommunity.execute(params.communityId, auth.userId);
          return { member };
        },
        200,
      );
    },
  );

  // 8. Leave Community
  app.post(
    "/communities/:communityId/leave",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          await deps.leaveCommunity.execute(params.communityId, auth.userId);
          return { success: true };
        },
        200,
      );
    },
  );

  // 9. List Community Members
  app.get(
    "/communities/:communityId/members",
    { preHandler: optionalAuthMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const members = await deps.listCommunityMembers.execute(params.communityId, auth?.userId);
          return { members };
        },
        200,
      );
    },
  );

  // 10. Add/Invite Member
  app.post(
    "/communities/:communityId/members",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const member = await deps.addOrInviteMember.execute(
            params.communityId,
            auth.userId,
            request.body,
          );
          return { member };
        },
        201,
      );
    },
  );

  // 11. Update Member Role
  app.patch(
    "/communities/:communityId/members/:targetUserId/role",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string; targetUserId: string };
      return handleUseCase(
        reply,
        async () => {
          const member = await deps.updateMemberRole.execute(
            params.communityId,
            params.targetUserId,
            auth.userId,
            request.body,
          );
          return { member };
        },
        200,
      );
    },
  );

  // 12. Remove Member (Kick)
  app.delete(
    "/communities/:communityId/members/:targetUserId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string; targetUserId: string };
      return handleUseCase(
        reply,
        async () => {
          await deps.removeMember.execute(params.communityId, params.targetUserId, auth.userId);
          return { success: true };
        },
        200,
      );
    },
  );

  // 13. Transfer Ownership
  app.post(
    "/communities/:communityId/transfer-owner",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const community = await deps.transferOwnership.execute(
            params.communityId,
            auth.userId,
            request.body,
          );
          return { community, role: community.currentUserRole ?? null };
        },
        200,
      );
    },
  );

  // 14. Create Channel
  app.post(
    "/communities/:communityId/channels",
    { preHandler: authMiddleware },
    async (request, reply) => {
      if (!deps.createChannel) {
        return reply.status(501).send({ error: "NOT_IMPLEMENTED" });
      }
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const channel = await deps.createChannel!.execute(
            params.communityId,
            auth.userId,
            request.body,
          );
          return { channel };
        },
        201,
      );
    },
  );

  // 15. List Channels
  app.get(
    "/communities/:communityId/channels",
    { preHandler: optionalAuthMiddleware },
    async (request, reply) => {
      if (!deps.listChannels) {
        return reply.status(501).send({ error: "NOT_IMPLEMENTED" });
      }
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string };
      return handleUseCase(
        reply,
        async () => {
          const channels = await deps.listChannels!.execute(
            params.communityId,
            auth?.userId,
          );
          return { channels };
        },
        200,
      );
    },
  );

  // 16. Update Channel
  app.patch(
    "/communities/:communityId/channels/:channelId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      if (!deps.updateChannel) {
        return reply.status(501).send({ error: "NOT_IMPLEMENTED" });
      }
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string; channelId: string };
      return handleUseCase(
        reply,
        async () => {
          const channel = await deps.updateChannel!.execute(
            params.communityId,
            params.channelId,
            auth.userId,
            request.body,
          );
          return { channel };
        },
        200,
      );
    },
  );

  // 17. Archive Channel
  app.post(
    "/communities/:communityId/channels/:channelId/archive",
    { preHandler: authMiddleware },
    async (request, reply) => {
      if (!deps.archiveChannel) {
        return reply.status(501).send({ error: "NOT_IMPLEMENTED" });
      }
      const auth = (request as AuthenticatedRequest).auth;
      const params = request.params as { communityId: string; channelId: string };
      return handleUseCase(
        reply,
        async () => {
          const channel = await deps.archiveChannel!.execute(
            params.communityId,
            params.channelId,
            auth.userId,
          );
          return { channel };
        },
        200,
      );
    },
  );
}
