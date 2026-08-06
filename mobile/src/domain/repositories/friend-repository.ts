import type { MobileBlockedUser, MobileFriend, MobileFriendRequest } from "../entities/friend.js";

export interface FriendRepository {
  listFriends(token: string): Promise<MobileFriend[]>;
  listFriendRequests(token: string): Promise<MobileFriendRequest[]>;
  sendFriendRequest(token: string, receiverUserId: string): Promise<MobileFriendRequest>;
  respondFriendRequest(token: string, requestId: string, action: "accept" | "reject"): Promise<void>;
  removeFriend(token: string, friendUserId: string): Promise<void>;
  blockUser(token: string, targetUserId: string): Promise<MobileBlockedUser>;
  unblockUser(token: string, targetUserId: string): Promise<void>;
  listBlockedUsers(token: string): Promise<MobileBlockedUser[]>;
}

