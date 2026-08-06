import type {
  HandleDeepLinkUseCase,
  RegisterPushDeviceUseCase,
} from "../../application/use-cases/push-use-cases.js";
import type { DeepLinkTarget, PushPermissionStatus } from "../../domain/entities/push.js";

export class PushNotificationHandler {
  private permissionStatus: PushPermissionStatus = "not_determined";

  constructor(
    private readonly registerDeviceUseCase: RegisterPushDeviceUseCase,
    private readonly deepLinkUseCase: HandleDeepLinkUseCase,
  ) {}

  async requestPermission(): Promise<PushPermissionStatus> {
    // In real mobile runtime, this triggers OS push dialog
    this.permissionStatus = "granted";
    return this.permissionStatus;
  }

  getPermissionStatus(): PushPermissionStatus {
    return this.permissionStatus;
  }

  async registerPushToken(
    authToken: string,
    pushToken: string,
    platform: "ios" | "android" | "web" = "android",
    deviceName: string = "Mobile Device",
  ): Promise<string> {
    if (this.permissionStatus !== "granted") {
      await this.requestPermission();
    }
    return this.registerDeviceUseCase.execute(authToken, platform, deviceName, pushToken);
  }

  handleIncomingNotificationTap(deepLinkUrl: string): DeepLinkTarget | null {
    return this.deepLinkUseCase.parseUrl(deepLinkUrl);
  }
}
