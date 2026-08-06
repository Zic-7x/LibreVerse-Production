import type { DeepLinkTarget } from "../../domain/entities/push.js";
import type { PushRepository } from "../../domain/repositories/push-repository.js";

export class RegisterPushDeviceUseCase {
  constructor(private readonly pushRepo: PushRepository) {}

  async execute(
    token: string,
    platform: "ios" | "android" | "web",
    deviceName: string,
    pushToken: string,
  ): Promise<string> {
    if (!token || !pushToken) throw new Error("Token and pushToken are required.");
    return this.pushRepo.registerDevice(token, platform, deviceName, pushToken);
  }
}

export class HandleDeepLinkUseCase {
  parseUrl(url: string): DeepLinkTarget | null {
    try {
      const cleanUrl = url.replace(/^app:\/\//, "https://app.local/");
      const parsed = new URL(cleanUrl);
      const path = parsed.pathname;

      if (path.startsWith("/chat/")) {
        const conversationId = path.split("/")[2];
        if (conversationId) return { type: "chat", conversationId };
      }

      if (path.startsWith("/stories/")) {
        const storyId = path.split("/")[2];
        if (storyId) return { type: "story", storyId };
      }

      if (path.startsWith("/communities/")) {
        const parts = path.split("/");
        const communityId = parts[2];
        const channelId = parts[4];
        if (communityId) return { type: "community", communityId, channelId };
      }

      if (path.startsWith("/notifications/")) {
        const notificationId = path.split("/")[2];
        if (notificationId) return { type: "notification", notificationId };
      }

      return null;
    } catch {
      return null;
    }
  }
}
