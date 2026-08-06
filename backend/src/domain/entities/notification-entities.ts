import type {
  Notification as SharedNotification,
  NotificationPreference as SharedNotificationPreference,
  NotificationChannel,
} from "@platform/shared-types";

export interface NotificationEntity {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  notificationType: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
  actorAlias?: string;
  actorDisplayName?: string;
  actorAvatarUrl?: string;
}

export interface NotificationPreferenceEntity {
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: Date;
}

export function toSharedNotification(
  entity: NotificationEntity,
): SharedNotification {
  return {
    id: entity.id,
    recipientUserId: entity.recipientUserId,
    actorUserId: entity.actorUserId,
    notificationType: entity.notificationType,
    title: entity.title,
    body: entity.body,
    payload: entity.payload,
    readAt: entity.readAt ? entity.readAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    actorAlias: entity.actorAlias,
    actorDisplayName: entity.actorDisplayName,
    actorAvatarUrl: entity.actorAvatarUrl,
  };
}

export function toSharedNotificationPreference(
  entity: NotificationPreferenceEntity,
): SharedNotificationPreference {
  return {
    userId: entity.userId,
    notificationType: entity.notificationType,
    channel: entity.channel,
    enabled: entity.enabled,
    updatedAt: entity.updatedAt.toISOString(),
  };
}
