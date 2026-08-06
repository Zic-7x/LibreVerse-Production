import type { MobileNotification } from "../../domain/entities/notification.js";
import type { NotificationRepository } from "../../domain/repositories/notification-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpNotificationRepository implements NotificationRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listNotifications(token: string): Promise<MobileNotification[]> {
    const res = await this.apiClient.request<{ notifications: MobileNotification[] }>("/notifications", {
      method: "GET",
      token,
    });
    return res.notifications || [];
  }

  async markAsRead(token: string, notificationId: string): Promise<void> {
    await this.apiClient.request<void>(`/notifications/${notificationId}/read`, {
      method: "POST",
      token,
    });
  }
}
