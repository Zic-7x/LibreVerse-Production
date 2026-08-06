import type {
  PushDeliveryResult,
  PushMessagePayload,
  PushProviderAdapter,
} from "../../application/interfaces/push.js";

export class MockPushProviderAdapter implements PushProviderAdapter {
  public sentPushes: PushMessagePayload[] = [];
  public invalidTokens: Set<string> = new Set();

  async sendPush(message: PushMessagePayload): Promise<PushDeliveryResult> {
    if (this.invalidTokens.has(message.deviceToken)) {
      return {
        success: false,
        tokenInvalid: true,
        error: "Device token expired or invalid",
      };
    }

    this.sentPushes.push(message);
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  clear(): void {
    this.sentPushes = [];
    this.invalidTokens.clear();
  }
}
