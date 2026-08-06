import type { MobileNotification } from "../entities/notification.js";

export interface NotificationRepository {
  listNotifications(token: string): Promise<MobileNotification[]>;
  markAsRead(token: string, notificationId: string): Promise<void>;
}
