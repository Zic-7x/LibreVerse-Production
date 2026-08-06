import type { FriendSummary } from "@platform/shared-types";
import type { FriendshipEntity } from "../../domain/entities/friendship-entities.js";

export interface FriendshipRepository {
  findPair(userA: string, userB: string): Promise<FriendshipEntity | null>;
  sendRequest(fromUserId: string, toUserId: string): Promise<FriendshipEntity>;
  acceptRequest(friendshipId: string, acceptorUserId: string): Promise<FriendshipEntity>;
  declineRequest(friendshipId: string, declinerUserId: string): Promise<FriendshipEntity>;
  blockUser(blockerUserId: string, targetUserId: string): Promise<FriendshipEntity>;
  unblockUser(blockerUserId: string, targetUserId: string): Promise<void>;
  removeFriendship(friendshipId: string, userId: string): Promise<void>;
  listFriends(userId: string): Promise<FriendSummary[]>;
  listPending(userId: string, direction: "incoming" | "outgoing"): Promise<FriendSummary[]>;
  listBlocked(userId: string): Promise<FriendSummary[]>;
}
