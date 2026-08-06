import type { MobileProfile } from "../../domain/entities/profile.js";
import type { ProfileRepository, UpdateProfileInput } from "../../domain/repositories/profile-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpProfileRepository implements ProfileRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getProfile(token: string, userId: string): Promise<MobileProfile> {
    const res = await this.apiClient.request<{ profile: MobileProfile }>(`/users/${userId}/profile`, {
      method: "GET",
      token,
    });
    return res.profile;
  }

  async updateProfile(token: string, input: UpdateProfileInput): Promise<MobileProfile> {
    const res = await this.apiClient.request<{ profile: MobileProfile }>("/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
    return res.profile;
  }

  async claimAlias(token: string, alias: string): Promise<{ alias: string }> {
    return this.apiClient.request<{ alias: string }>("/me/alias", {
      method: "POST",
      token,
      body: JSON.stringify({ alias }),
    });
  }

  async getProfileByAlias(token: string, alias: string): Promise<MobileProfile> {
    const res = await this.apiClient.request<{ profile: MobileProfile }>(`/aliases/${alias}`, {
      method: "GET",
      token,
    });
    return res.profile;
  }
}
