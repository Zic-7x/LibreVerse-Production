export interface PushRepository {
  registerDevice(
    token: string,
    platform: "ios" | "android" | "web",
    deviceName: string,
    pushToken: string,
  ): Promise<string>;
}
