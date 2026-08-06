import type { CreateCommunityInput } from "@platform/shared-types";
import type { MobileChannel, MobileCommunity } from "../../domain/entities/community.js";
import type { CommunityRepository } from "../../domain/repositories/community-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpCommunityRepository implements CommunityRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listPublicCommunities(token: string): Promise<MobileCommunity[]> {
    const res = await this.apiClient.request<{ communities: MobileCommunity[] }>("/communities/public", {
      method: "GET",
      token,
    });
    return res.communities || [];
  }

  async listUserCommunities(token: string): Promise<MobileCommunity[]> {
    const res = await this.apiClient.request<{ communities: MobileCommunity[] }>("/communities/user", {
      method: "GET",
      token,
    });
    return res.communities || [];
  }

  async createCommunity(token: string, input: CreateCommunityInput): Promise<MobileCommunity> {
    const res = await this.apiClient.request<{ community: MobileCommunity }>("/communities", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
    return res.community;
  }

  async joinCommunity(token: string, communityId: string): Promise<MobileCommunity> {
    const res = await this.apiClient.request<{ community: MobileCommunity }>(`/communities/${communityId}/join`, {
      method: "POST",
      token,
    });
    return res.community;
  }

  async listChannels(token: string, communityId: string): Promise<MobileChannel[]> {
    const res = await this.apiClient.request<{ channels: MobileChannel[] }>(`/communities/${communityId}/channels`, {
      method: "GET",
      token,
    });
    return res.channels || [];
  }

  async createChannel(token: string, communityId: string, title: string): Promise<MobileChannel> {
    const res = await this.apiClient.request<{ channel: MobileChannel }>(`/communities/${communityId}/channels`, {
      method: "POST",
      token,
      body: JSON.stringify({ title }),
    });
    return res.channel;
  }
}
