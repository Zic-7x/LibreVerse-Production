export interface MobileFriend {
  id: string;
  userId: string;
  friendUserId: string;
  displayName?: string;
  avatarMediaId?: string | null;
  createdAt: string;
}

export interface MobileFriendRequest {
  id: string;
  senderUserId: string;
  receiverUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface MobileBlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
}

