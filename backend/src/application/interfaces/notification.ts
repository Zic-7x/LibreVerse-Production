import type { NotificationChannel } from "@platform/shared-types";
import type {
  NotificationEntity,
  NotificationPreferenceEntity,
} from "../../domain/entities/notification-entities.js";

export interface CreateNotificationParams {
  recipientUserId: string;
  actorUserId?: string | null;
  notificationType: string;
  title?: string | null;
  body?: string | null;
  payload?: Record<string, unknown>;
}

export interface NotificationRepository {
  createNotification(
    params: CreateNotificationParams,
  ): Promise<NotificationEntity | null>;

  getUserNotifications(
    recipientUserId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationEntity[]>;

  getUnreadCount(recipientUserId: string): Promise<number>;

  markAsRead(
    recipientUserId: string,
    notificationIds?: string[],
    markAll?: boolean,
  ): Promise<number>;

  getPreference(
    userId: string,
    notificationType: string,
    channel: NotificationChannel,
  ): Promise<boolean>;

  getPreferences(userId: string): Promise<NotificationPreferenceEntity[]>;

  setPreference(
    userId: string,
    notificationType: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<NotificationPreferenceEntity>;
}
