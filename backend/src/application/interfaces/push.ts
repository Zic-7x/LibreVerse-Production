import type { DevicePlatform } from "@platform/shared-types";

export interface PushMessagePayload {
  recipientUserId: string;
  deviceToken: string;
  platform: DevicePlatform;
  notificationType: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
}

export interface PushDeliveryResult {
  success: boolean;
  tokenInvalid?: boolean;
  messageId?: string;
  error?: string;
}

export interface PushProviderAdapter {
  sendPush(message: PushMessagePayload): Promise<PushDeliveryResult>;
}
