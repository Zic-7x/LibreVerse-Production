import type { MobileNotification } from "../../domain/entities/notification.js";
import type { NotificationRepository } from "../../domain/repositories/notification-repository.js";

export class ListNotificationsUseCase {
  constructor(private readonly notifRepo: NotificationRepository) {}

  async execute(token: string): Promise<MobileNotification[]> {
    if (!token) throw new Error("Token is required.");
    return this.notifRepo.listNotifications(token);
  }
}

export class MarkNotificationReadUseCase {
  constructor(private readonly notifRepo: NotificationRepository) {}

  async execute(token: string, notificationId: string): Promise<void> {
    if (!token || !notificationId) throw new Error("Token and NotificationId are required.");
    return this.notifRepo.markAsRead(token, notificationId);
  }
}
