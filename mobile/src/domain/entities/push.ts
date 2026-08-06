export type PushPermissionStatus = "granted" | "denied" | "not_determined";

export interface MobileDeviceRegistration {
  deviceId: string;
  platform: "ios" | "android" | "web";
  deviceName: string;
  pushToken: string;
  registeredAt: string;
}

export type DeepLinkTarget =
  | { type: "chat"; conversationId: string }
  | { type: "story"; storyId: string }
  | { type: "community"; communityId: string; channelId?: string }
  | { type: "notification"; notificationId: string };
