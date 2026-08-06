import type { MobileBlockedUser, MobileFriend, MobileFriendRequest } from "../../domain/entities/friend.js";
import type { FriendRepository } from "../../domain/repositories/friend-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpFriendRepository implements FriendRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listFriends(token: string): Promise<MobileFriend[]> {
    const res = await this.apiClient.request<{ friends: MobileFriend[] }>("/friends", {
      method: "GET",
      token,
    });
    return res.friends || [];
  }

  async listFriendRequests(token: string): Promise<MobileFriendRequest[]> {
    const res = await this.apiClient.request<{ requests: MobileFriendRequest[] }>("/friends/requests", {
      method: "GET",
      token,
    });
    return res.requests || [];
  }

  async sendFriendRequest(token: string, receiverUserId: string): Promise<MobileFriendRequest> {
    const res = await this.apiClient.request<{ request: MobileFriendRequest }>("/friends/requests", {
      method: "POST",
      token,
      body: JSON.stringify({ receiverUserId }),
    });
    return res.request;
  }

  async respondFriendRequest(token: string, requestId: string, action: "accept" | "reject"): Promise<void> {
    await this.apiClient.request<void>(`/friends/requests/${requestId}/${action}`, {
      method: "POST",
      token,
    });
  }

  async removeFriend(token: string, friendUserId: string): Promise<void> {
    await this.apiClient.request<void>(`/friends/${friendUserId}`, {
      method: "DELETE",
      token,
    });
  }

  async blockUser(token: string, targetUserId: string): Promise<MobileBlockedUser> {
    const res = await this.apiClient.request<{ blocked: MobileBlockedUser }>(`/users/${targetUserId}/block`, {
      method: "POST",
      token,
    });
    return res.blocked;
  }

  async unblockUser(token: string, targetUserId: string): Promise<void> {
    await this.apiClient.request<void>(`/users/${targetUserId}/block`, {
      method: "DELETE",
      token,
    });
  }

  async listBlockedUsers(token: string): Promise<MobileBlockedUser[]> {
    const res = await this.apiClient.request<{ blockedUsers: MobileBlockedUser[] }>("/users/blocked", {
      method: "GET",
      token,
    });
    return res.blockedUsers || [];
  }
}

