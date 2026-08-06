import type { PushRepository } from "../../domain/repositories/push-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpPushRepository implements PushRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async registerDevice(
    token: string,
    platform: "ios" | "android" | "web",
    deviceName: string,
    pushToken: string,
  ): Promise<string> {
    const res = await this.apiClient.request<{ id: string }>("/auth/devices", {
      method: "POST",
      token,
      body: JSON.stringify({
        platform,
        deviceName,
        pushToken,
      }),
    });
    return res.id;
  }
}
