import Fastify, { type FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type pg from "pg";
import { getMobilePreviewHtml } from "../presentation/http/views/mobile-preview.js";
import { CheckHealthUseCase } from "../application/use-cases/check-health.js";
import {
  GetAuthenticatedUserUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  RegisterDeviceUseCase,
  RegisterUserUseCase,
  RevokeAllSessionsUseCase,
  RevokeSessionUseCase,
} from "../application/use-cases/auth/auth-use-cases.js";
import type { AppConfig } from "../infrastructure/config/env.js";
import { Argon2PasswordHasher } from "../infrastructure/auth/argon2-password-hasher.js";
import { CryptoRefreshTokenGenerator } from "../infrastructure/auth/crypto-refresh-token.js";
import { JwtAccessTokenService } from "../infrastructure/auth/jwt-access-token-service.js";
import {
  createPostgresPool,
  PostgresDatabaseProbe,
} from "../infrastructure/persistence/postgres-pool.js";
import { PostgresCommunityRepository } from "../infrastructure/persistence/postgres-community-repository.js";
import { PostgresDeviceRepository } from "../infrastructure/persistence/postgres-device-repository.js";
import { PostgresFriendshipRepository } from "../infrastructure/persistence/postgres-friendship-repository.js";
import { PostgresMediaRepository } from "../infrastructure/persistence/postgres-media-repository.js";
import { PostgresMediaVariantRepository } from "../infrastructure/persistence/postgres-media-variant-repository.js";
import { PostgresMessagingRepository } from "../infrastructure/persistence/postgres-messaging-repository.js";
import { PostgresProfileRepository } from "../infrastructure/persistence/postgres-profile-repository.js";
import { PostgresPublicAliasRepository } from "../infrastructure/persistence/postgres-public-alias-repository.js";
import { PostgresSessionRepository } from "../infrastructure/persistence/postgres-session-repository.js";
import { PostgresStoryRepository } from "../infrastructure/persistence/postgres-story-repository.js";
import { PostgresNotificationRepository } from "../infrastructure/persistence/postgres-notification-repository.js";
import { PostgresReportRepository } from "../infrastructure/persistence/postgres-report-repository.js";
import { PostgresModerationRepository } from "../infrastructure/persistence/postgres-moderation-repository.js";
import { PostgresUserRepository } from "../infrastructure/persistence/postgres-user-repository.js";
import { MockPushProviderAdapter } from "../infrastructure/push/mock-push-provider.js";
import { PushDispatchService } from "../application/use-cases/notification/push-dispatch-service.js";
import { WebSocketMessagingServer } from "../infrastructure/realtime/websocket-messaging-server.js";
import { registerAuthErrorHandler } from "../presentation/http/middleware/auth-middleware.js";
import { registerAuthRoutes } from "../presentation/http/routes/auth-routes.js";
import { registerCommunityRoutes } from "../presentation/http/routes/community-routes.js";
import { registerFriendshipRoutes } from "../presentation/http/routes/friendship-routes.js";
import { registerHealthRoutes } from "../presentation/http/routes/health-routes.js";
import { registerMediaRoutes } from "../presentation/http/routes/media-routes.js";
import { registerMessagingRoutes } from "../presentation/http/routes/messaging-routes.js";
import { registerProfileRoutes } from "../presentation/http/routes/profile-routes.js";
import { registerStoryRoutes } from "../presentation/http/routes/story-routes.js";
import { registerNotificationRoutes } from "../presentation/http/routes/notification-routes.js";
import { registerReportRoutes } from "../presentation/http/routes/report-routes.js";
import { registerModerationRoutes } from "../presentation/http/routes/moderation-routes.js";
import {
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
} from "../application/use-cases/community/community-use-cases.js";
import {
  ArchiveChannelUseCase,
  CreateChannelUseCase,
  ListChannelsUseCase,
  UpdateChannelUseCase,
} from "../application/use-cases/community/channel-use-cases.js";
import {
  CleanupExpiredStoriesUseCase,
  CreateStoryUseCase,
  DeleteStoryUseCase,
  GetStoryByIdUseCase,
  GetStoryFeedUseCase,
  GetStoryViewersUseCase,
  RecordStoryViewUseCase,
} from "../application/use-cases/story/story-use-cases.js";
import {
  GetNotificationPreferencesUseCase,
  GetNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationsReadUseCase,
  UpdateNotificationPreferenceUseCase,
} from "../application/use-cases/notification/notification-use-cases.js";
import {
  GetReportByIdUseCase,
  ListUserReportsUseCase,
  SubmitReportUseCase,
} from "../application/use-cases/report/report-use-cases.js";
import {
  ExecuteModerationActionUseCase,
  GetModerationCaseByIdUseCase,
  ListModerationCasesUseCase,
  RevokeSanctionUseCase,
  UpdateModerationCaseUseCase,
} from "../application/use-cases/moderation/moderation-use-cases.js";
import {
  ClaimAliasUseCase,
  GetAliasHistoryUseCase,
  GetProfileByAliasUseCase,
  GetProfileByUserIdUseCase,
  UpdateProfileUseCase,
} from "../application/use-cases/profile/profile-use-cases.js";
import {
  CompleteUploadUseCase,
  DeleteMediaUseCase,
  GetMediaUseCase,
  InitUploadUseCase,
  MarkUploadFailedUseCase,
} from "../application/use-cases/media/media-use-cases.js";
import {
  BlockUserUseCase,
  CheckInteractionPolicyUseCase,
  ListBlockedUsersUseCase,
  ListFriendsUseCase,
  ListPendingRequestsUseCase,
  RemoveFriendshipUseCase,
  RespondFriendRequestUseCase,
  SendFriendRequestUseCase,
  UnblockUserUseCase,
} from "../application/use-cases/friendship/friendship-use-cases.js";
import {
  EditMessageUseCase,
  GetConversationMessagesUseCase,
  GetOrCreateDirectConversationUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendTextMessageUseCase,
  SoftDeleteMessageUseCase,
  UpdateParticipantSettingsUseCase,
} from "../application/use-cases/messaging/messaging-use-cases.js";

export interface AppContainer {
  app: ReturnType<typeof Fastify>;
  pool: pg.Pool;
  pushProvider: MockPushProviderAdapter;
  pushDispatchService: PushDispatchService;
}

export async function createApp(config: AppConfig): Promise<AppContainer> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
    bodyLimit: 50 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string", bodyLimit: 50 * 1024 * 1024 },
    (_req, body: string, done) => {
      try {
        if (!body || body.trim().length === 0) {
          done(null, {});
          return;
        }
        const json = JSON.parse(body);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  registerAuthErrorHandler(app);

  app.get("/", async (request, reply) => {
    const accept = request.headers["accept"] || "";
    const format = (request.query as { format?: string })?.format;
    if (format === "json" || (accept.includes("application/json") && !accept.includes("text/html"))) {
      return reply.send({
        name: "LibreVerse Mobile Platform API",
        status: "online",
        milestone: "M14 Moderation and sanctions",
        documentation: "/health",
      });
    }
    return reply.type("text/html").send(getMobilePreviewHtml());
  });

  const pool = createPostgresPool(config.databaseUrl);
  const databaseProbe = new PostgresDatabaseProbe(pool);
  const checkHealth = new CheckHealthUseCase(databaseProbe);

  const users = new PostgresUserRepository(pool);
  const sessions = new PostgresSessionRepository(pool);
  const devices = new PostgresDeviceRepository(pool);
  const profiles = new PostgresProfileRepository(pool);
  const aliases = new PostgresPublicAliasRepository(pool);
  const mediaRepo = new PostgresMediaRepository(pool);
  const variantRepo = new PostgresMediaVariantRepository(pool);
  const friendshipsRepo = new PostgresFriendshipRepository(pool);
  const messagingRepo = new PostgresMessagingRepository(pool);
  const communityRepo = new PostgresCommunityRepository(pool);
  const storyRepo = new PostgresStoryRepository(pool);
  const notificationRepo = new PostgresNotificationRepository(pool);
  const reportRepo = new PostgresReportRepository(pool);
  const moderationRepo = new PostgresModerationRepository(pool);
  const pushProvider = new MockPushProviderAdapter();
  const pushDispatchService = new PushDispatchService(
    notificationRepo,
    devices,
    pushProvider,
  );
  notificationRepo.setPushDispatchService(pushDispatchService);

  const passwordHasher = new Argon2PasswordHasher();
  const refreshTokens = new CryptoRefreshTokenGenerator();
  const accessTokens = new JwtAccessTokenService(
    config.jwtSecret,
    config.jwtAccessTtlSeconds,
  );

  const registerUser = new RegisterUserUseCase(
    users,
    sessions,
    devices,
    passwordHasher,
    accessTokens,
    refreshTokens,
    config.jwtAccessTtlSeconds,
    config.refreshTokenTtlSeconds,
    profiles,
  );
  const login = new LoginUseCase(
    users,
    sessions,
    devices,
    passwordHasher,
    accessTokens,
    refreshTokens,
    config.jwtAccessTtlSeconds,
    config.refreshTokenTtlSeconds,
  );
  const refreshSession = new RefreshSessionUseCase(
    users,
    sessions,
    accessTokens,
    refreshTokens,
    config.jwtAccessTtlSeconds,
    config.refreshTokenTtlSeconds,
  );
  const logout = new LogoutUseCase(sessions, refreshTokens);
  const revokeSession = new RevokeSessionUseCase(sessions);
  const revokeAllSessions = new RevokeAllSessionsUseCase(sessions);
  const registerDevice = new RegisterDeviceUseCase(devices);
  const getAuthenticatedUser = new GetAuthenticatedUserUseCase(users);

  const getProfileByUserId = new GetProfileByUserIdUseCase(profiles, aliases, users);
  const getProfileByAlias = new GetProfileByAliasUseCase(profiles, aliases, users);
  const updateProfile = new UpdateProfileUseCase(profiles, aliases, users);
  const claimAlias = new ClaimAliasUseCase(aliases, users);
  const getAliasHistory = new GetAliasHistoryUseCase(aliases, users);

  const initUpload = new InitUploadUseCase(mediaRepo);
  const completeUpload = new CompleteUploadUseCase(mediaRepo, variantRepo);
  const markUploadFailed = new MarkUploadFailedUseCase(mediaRepo);
  const getMedia = new GetMediaUseCase(mediaRepo, variantRepo);
  const deleteMedia = new DeleteMediaUseCase(mediaRepo);

  const sendFriendRequest = new SendFriendRequestUseCase(
    friendshipsRepo,
    users,
    notificationRepo,
  );
  const respondFriendRequest = new RespondFriendRequestUseCase(friendshipsRepo);
  const blockUser = new BlockUserUseCase(friendshipsRepo, users);
  const unblockUser = new UnblockUserUseCase(friendshipsRepo);
  const removeFriendship = new RemoveFriendshipUseCase(friendshipsRepo);
  const listFriends = new ListFriendsUseCase(friendshipsRepo);
  const listPendingRequests = new ListPendingRequestsUseCase(friendshipsRepo);
  const listBlockedUsers = new ListBlockedUsersUseCase(friendshipsRepo);
  const checkInteractionPolicy = new CheckInteractionPolicyUseCase(friendshipsRepo);

  await app.register(websocket);

  const wsMessagingServer = new WebSocketMessagingServer(
    accessTokens,
    messagingRepo,
  );

  app.get("/ws", { websocket: true }, async (socket, req) => {
    const query = req.query as { token?: string };
    let token = query?.token;

    if (!token) {
      const authHeader = req.headers["authorization"];
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const protocol = req.headers["sec-websocket-protocol"];
      if (protocol) {
        token = protocol.split(",")[0].trim();
      }
    }

    if (!token) {
      socket.close(1008, "Token missing");
      return;
    }

    await wsMessagingServer.handleConnection(socket, token);
  });

  const getOrCreateDirectConversation = new GetOrCreateDirectConversationUseCase(
    messagingRepo,
    friendshipsRepo,
    users,
  );
  const listConversations = new ListConversationsUseCase(messagingRepo);
  const getConversationMessages = new GetConversationMessagesUseCase(messagingRepo);
  const sendTextMessage = new SendTextMessageUseCase(
    messagingRepo,
    friendshipsRepo,
    mediaRepo,
    wsMessagingServer,
    notificationRepo,
    moderationRepo,
  );
  const editMessage = new EditMessageUseCase(messagingRepo, wsMessagingServer);
  const softDeleteMessage = new SoftDeleteMessageUseCase(
    messagingRepo,
    wsMessagingServer,
    communityRepo,
  );
  const markConversationRead = new MarkConversationReadUseCase(messagingRepo);
  const updateParticipantSettings = new UpdateParticipantSettingsUseCase(messagingRepo);

  const createCommunity = new CreateCommunityUseCase(
    communityRepo,
    mediaRepo,
    messagingRepo,
  );
  const getCommunity = new GetCommunityUseCase(communityRepo);
  const listPublicCommunities = new ListPublicCommunitiesUseCase(communityRepo);
  const listUserCommunities = new ListUserCommunitiesUseCase(communityRepo);
  const updateCommunity = new UpdateCommunityUseCase(communityRepo, mediaRepo);
  const archiveCommunity = new ArchiveCommunityUseCase(communityRepo);
  const joinCommunity = new JoinCommunityUseCase(communityRepo);
  const leaveCommunity = new LeaveCommunityUseCase(communityRepo);
  const addOrInviteMember = new AddOrInviteMemberUseCase(communityRepo);
  const updateMemberRole = new UpdateMemberRoleUseCase(communityRepo);
  const removeMember = new RemoveMemberUseCase(communityRepo);
  const transferOwnership = new TransferOwnershipUseCase(communityRepo);
  const listCommunityMembers = new ListCommunityMembersUseCase(communityRepo);

  const createChannel = new CreateChannelUseCase(communityRepo, messagingRepo);
  const listChannels = new ListChannelsUseCase(communityRepo, messagingRepo);
  const updateChannel = new UpdateChannelUseCase(communityRepo, messagingRepo);
  const archiveChannel = new ArchiveChannelUseCase(communityRepo, messagingRepo);

  const createStory = new CreateStoryUseCase(storyRepo);
  const getStoryFeed = new GetStoryFeedUseCase(storyRepo);
  const getStoryById = new GetStoryByIdUseCase(storyRepo, friendshipsRepo);
  const recordStoryView = new RecordStoryViewUseCase(storyRepo, friendshipsRepo);
  const getStoryViewers = new GetStoryViewersUseCase(storyRepo);
  const deleteStory = new DeleteStoryUseCase(storyRepo);
  const cleanupExpiredStories = new CleanupExpiredStoriesUseCase(storyRepo);

  const getNotifications = new GetNotificationsUseCase(notificationRepo);
  const getUnreadCount = new GetUnreadCountUseCase(notificationRepo);
  const markNotificationsRead = new MarkNotificationsReadUseCase(notificationRepo);
  const getNotificationPreferences = new GetNotificationPreferencesUseCase(notificationRepo);
  const updateNotificationPreference = new UpdateNotificationPreferenceUseCase(notificationRepo);

  const submitReport = new SubmitReportUseCase(reportRepo);
  const getReportById = new GetReportByIdUseCase(reportRepo);
  const listUserReports = new ListUserReportsUseCase(reportRepo);

  const listModerationCases = new ListModerationCasesUseCase(moderationRepo, users);
  const getModerationCaseById = new GetModerationCaseByIdUseCase(moderationRepo, users);
  const updateModerationCase = new UpdateModerationCaseUseCase(moderationRepo, users);
  const executeModerationAction = new ExecuteModerationActionUseCase(
    moderationRepo,
    users,
    sessions,
  );
  const revokeSanction = new RevokeSanctionUseCase(moderationRepo, users);

  const registerAllRoutes = (instance: FastifyInstance) => {
    registerHealthRoutes(instance, checkHealth);
    registerAuthRoutes(instance, {
      registerUser,
      login,
      refreshSession,
      logout,
      revokeSession,
      revokeAllSessions,
      registerDevice,
      getAuthenticatedUser,
      accessTokens,
      users,
    });
    registerProfileRoutes(instance, {
      getProfileByUserId,
      getProfileByAlias,
      updateProfile,
      claimAlias,
      getAliasHistory,
      accessTokens,
      users,
    });
    registerMediaRoutes(instance, {
      initUpload,
      completeUpload,
      markUploadFailed,
      getMedia,
      deleteMedia,
      accessTokens,
      users,
    });
    registerFriendshipRoutes(instance, {
      sendFriendRequest,
      respondFriendRequest,
      blockUser,
      unblockUser,
      removeFriendship,
      listFriends,
      listPendingRequests,
      listBlockedUsers,
      checkInteractionPolicy,
      accessTokens,
      users,
    });
    registerMessagingRoutes(instance, {
      getOrCreateDirectConversation,
      listConversations,
      getConversationMessages,
      sendTextMessage,
      editMessage,
      softDeleteMessage,
      markConversationRead,
      updateParticipantSettings,
      accessTokens,
      users,
    });
    registerCommunityRoutes(instance, {
      createCommunity,
      getCommunity,
      listPublicCommunities,
      listUserCommunities,
      updateCommunity,
      archiveCommunity,
      joinCommunity,
      leaveCommunity,
      addOrInviteMember,
      updateMemberRole,
      removeMember,
      transferOwnership,
      listCommunityMembers,
      createChannel,
      listChannels,
      updateChannel,
      archiveChannel,
      accessTokens,
      users,
    });
    registerStoryRoutes(instance, {
      createStory,
      getStoryFeed,
      getStoryById,
      recordStoryView,
      getStoryViewers,
      deleteStory,
      cleanupExpiredStories,
      accessTokens,
      users,
    });
    registerNotificationRoutes(instance, {
      getNotifications,
      getUnreadCount,
      markNotificationsRead,
      getNotificationPreferences,
      updateNotificationPreference,
      accessTokens,
      users,
    });
    registerReportRoutes(instance, {
      submitReport,
      getReportById,
      listUserReports,
      accessTokens,
      users,
    });
    registerModerationRoutes(instance, {
      listCases: listModerationCases,
      getCaseById: getModerationCaseById,
      updateCase: updateModerationCase,
      executeAction: executeModerationAction,
      revokeSanction,
      accessTokens,
      users,
    });
  };

  registerAllRoutes(app);
  await app.register(
    async (apiV1) => {
      registerAllRoutes(apiV1);
    },
    { prefix: "/api/v1" },
  );

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return { app, pool, pushProvider, pushDispatchService };
}
