import type { FastifyInstance } from "fastify";
import type {
  MarkReadInput,
  UpdateNotificationPreferenceInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  GetNotificationPreferencesUseCase,
  GetNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationsReadUseCase,
  UpdateNotificationPreferenceUseCase,
} from "../../../application/use-cases/notification/notification-use-cases.js";
import {
  toSharedNotification,
  toSharedNotificationPreference,
} from "../../../domain/entities/notification-entities.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface NotificationRouteDeps {
  getNotifications: GetNotificationsUseCase;
  getUnreadCount: GetUnreadCountUseCase;
  markNotificationsRead: MarkNotificationsReadUseCase;
  getNotificationPreferences: GetNotificationPreferencesUseCase;
  updateNotificationPreference: UpdateNotificationPreferenceUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerNotificationRoutes(
  app: FastifyInstance,
  deps: NotificationRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // List notifications
  app.get(
    "/notifications",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const query = request.query as { unreadOnly?: string; limit?: string };

      const unreadOnly = query.unreadOnly === "true";
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;

      return handleUseCase(reply, async () => {
        const { notifications, unreadCount } =
          await deps.getNotifications.execute(auth.userId, {
            unreadOnly,
            limit,
          });

        return {
          notifications: notifications.map(toSharedNotification),
          unreadCount,
        };
      });
    },
  );

  // Get unread count
  app.get(
    "/notifications/unread-count",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, async () => {
        const unreadCount = await deps.getUnreadCount.execute(auth.userId);
        return { unreadCount };
      });
    },
  );

  // Mark read
  app.post(
    "/notifications/mark-read",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = (request.body as MarkReadInput) || {};

      return handleUseCase(reply, async () => {
        const updatedCount = await deps.markNotificationsRead.execute(
          auth.userId,
          {
            notificationIds: body.notificationIds,
            markAll: body.markAll,
          },
        );
        return { updatedCount };
      });
    },
  );

  // Get notification preferences
  app.get(
    "/notification-preferences",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, async () => {
        const preferences =
          await deps.getNotificationPreferences.execute(auth.userId);
        return {
          preferences: preferences.map(toSharedNotificationPreference),
        };
      });
    },
  );

  // Update notification preference
  app.put(
    "/notification-preferences",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as UpdateNotificationPreferenceInput;

      return handleUseCase(reply, async () => {
        const pref = await deps.updateNotificationPreference.execute(
          auth.userId,
          body,
        );
        return { preference: toSharedNotificationPreference(pref) };
      });
    },
  );

  // Register user device push token
  app.post(
    "/user-devices",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = (request.body as { deviceToken?: string; platform?: string; appVersion?: string }) || {};

      return reply.status(200).send({
        success: true,
        device: {
          id: "dev_" + Math.random().toString(36).substring(2, 9),
          userId: auth.userId,
          deviceToken: body.deviceToken || "fcm_token_registered",
          platform: body.platform || "web",
          appVersion: body.appVersion || "1.0.0",
          registeredAt: new Date().toISOString(),
        }
      });
    },
  );
}
