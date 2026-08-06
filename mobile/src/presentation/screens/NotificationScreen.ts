import type {
  ListNotificationsUseCase,
  MarkNotificationReadUseCase,
} from "../../application/use-cases/notification-use-cases.js";
import type { MobileNotification } from "../../domain/entities/notification.js";

export class NotificationScreen {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
  ) {}

  async loadNotifications(token: string): Promise<MobileNotification[]> {
    return this.listNotificationsUseCase.execute(token);
  }

  async markRead(token: string, notificationId: string): Promise<void> {
    return this.markNotificationReadUseCase.execute(token, notificationId);
  }
}
