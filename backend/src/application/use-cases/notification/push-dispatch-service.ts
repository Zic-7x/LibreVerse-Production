import type { DeviceRepository } from "../../interfaces/auth.js";
import type { NotificationRepository } from "../../interfaces/notification.js";
import type { PushProviderAdapter } from "../../interfaces/push.js";

export interface PushDispatchParams {
  recipientUserId: string;
  notificationType: string;
  title?: string | null;
  body?: string | null;
  payload?: Record<string, unknown>;
}

export class PushDispatchService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly deviceRepo: DeviceRepository,
    private readonly pushProvider: PushProviderAdapter,
  ) {}

  async dispatch(params: PushDispatchParams): Promise<void> {
    const isPushEnabled = await this.notificationRepo.getPreference(
      params.recipientUserId,
      params.notificationType,
      "push",
    );

    if (!isPushEnabled) {
      return;
    }

    const devices = await this.deviceRepo.findActiveDevicesForUser(
      params.recipientUserId,
    );

    for (const device of devices) {
      if (!device.pushToken) {
        continue;
      }

      const result = await this.pushProvider.sendPush({
        recipientUserId: params.recipientUserId,
        deviceToken: device.pushToken,
        platform: device.platform,
        notificationType: params.notificationType,
        title: params.title ?? null,
        body: params.body ?? null,
        payload: params.payload ?? {},
      });

      if (result.tokenInvalid) {
        await this.deviceRepo.clearPushToken(device.id);
      }
    }
  }
}
