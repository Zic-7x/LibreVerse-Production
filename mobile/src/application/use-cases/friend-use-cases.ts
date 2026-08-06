import type { MobileBlockedUser, MobileFriend, MobileFriendRequest } from "../../domain/entities/friend.js";
import type { FriendRepository } from "../../domain/repositories/friend-repository.js";

export class ListFriendsUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string): Promise<MobileFriend[]> {
    if (!token) throw new Error("Token required.");
    return this.friendRepo.listFriends(token);
  }
}

export class ListFriendRequestsUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string): Promise<MobileFriendRequest[]> {
    if (!token) throw new Error("Token required.");
    return this.friendRepo.listFriendRequests(token);
  }
}

export class SendFriendRequestUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string, receiverUserId: string): Promise<MobileFriendRequest> {
    if (!token || !receiverUserId) throw new Error("Token and target user ID are required.");
    return this.friendRepo.sendFriendRequest(token, receiverUserId);
  }
}

export class RespondFriendRequestUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string, requestId: string, action: "accept" | "reject"): Promise<void> {
    if (!token || !requestId) throw new Error("Token and request ID are required.");
    return this.friendRepo.respondFriendRequest(token, requestId, action);
  }
}

export class RemoveFriendUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string, friendUserId: string): Promise<void> {
    if (!token || !friendUserId) throw new Error("Token and friend user ID are required.");
    return this.friendRepo.removeFriend(token, friendUserId);
  }
}

export class BlockUserUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string, targetUserId: string): Promise<MobileBlockedUser> {
    if (!token || !targetUserId) throw new Error("Token and target user ID are required.");
    return this.friendRepo.blockUser(token, targetUserId);
  }
}

export class UnblockUserUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string, targetUserId: string): Promise<void> {
    if (!token || !targetUserId) throw new Error("Token and target user ID are required.");
    return this.friendRepo.unblockUser(token, targetUserId);
  }
}

export class ListBlockedUsersUseCase {
  constructor(private readonly friendRepo: FriendRepository) {}

  async execute(token: string): Promise<MobileBlockedUser[]> {
    if (!token) throw new Error("Token required.");
    return this.friendRepo.listBlockedUsers(token);
  }
}

