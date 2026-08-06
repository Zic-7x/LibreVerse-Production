import type { NotificationChannel } from "@platform/shared-types";
import type { NotificationRepository } from "../../interfaces/notification.js";
import type {
  NotificationEntity,
  NotificationPreferenceEntity,
} from "../../../domain/entities/notification-entities.js";

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number }> {
    const notifications = await this.notificationRepo.getUserNotifications(
      userId,
      options,
    );
    const unreadCount = await this.notificationRepo.getUnreadCount(userId);
    return { notifications, unreadCount };
  }
}

export class GetUnreadCountUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }
}

export class MarkNotificationsReadUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(
    userId: string,
    params: { notificationIds?: string[]; markAll?: boolean },
  ): Promise<number> {
    return this.notificationRepo.markAsRead(
      userId,
      params.notificationIds,
      params.markAll,
    );
  }
}

export class GetNotificationPreferencesUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(userId: string): Promise<NotificationPreferenceEntity[]> {
    return this.notificationRepo.getPreferences(userId);
  }
}

export class UpdateNotificationPreferenceUseCase {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(
    userId: string,
    input: {
      notificationType: string;
      channel: NotificationChannel;
      enabled: boolean;
    },
  ): Promise<NotificationPreferenceEntity> {
    return this.notificationRepo.setPreference(
      userId,
      input.notificationType,
      input.channel,
      input.enabled,
    );
  }
}
