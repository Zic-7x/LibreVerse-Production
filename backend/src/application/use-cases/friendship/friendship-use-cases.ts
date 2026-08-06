import type {
  FriendSummary,
  Friendship,
  FriendshipInteractionPolicy,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { UserRepository } from "../../interfaces/auth.js";
import type { FriendshipRepository } from "../../interfaces/friendship.js";
import type { NotificationRepository } from "../../interfaces/notification.js";
import { toSharedFriendship } from "../../../domain/entities/friendship-entities.js";
import { validateTargetUserId } from "../../validation/friendship-validation.js";

export class SendFriendRequestUseCase {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly users: UserRepository,
    private readonly notificationRepo?: NotificationRepository,
  ) {}

  async execute(fromUserId: string, targetUserId: string): Promise<Friendship> {
    const validTargetId = validateTargetUserId(fromUserId, targetUserId);
    const targetUser = await this.users.findById(validTargetId);

    if (!targetUser) {
      throw new ApplicationError("NOT_FOUND", "Target user not found");
    }

    const friendship = await this.friendships.sendRequest(fromUserId, validTargetId);

    if (this.notificationRepo) {
      await this.notificationRepo.createNotification({
        recipientUserId: validTargetId,
        actorUserId: fromUserId,
        notificationType: "friend_request",
        title: "Friend Request",
        body: "Sent you a friend request",
        payload: { friendshipId: friendship.id },
      }).catch(() => {});
    }

    return toSharedFriendship(friendship);
  }
}

export class RespondFriendRequestUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(
    userId: string,
    friendshipId: string,
    action: "accept" | "decline",
  ): Promise<Friendship> {
    if (action === "accept") {
      const friendship = await this.friendships.acceptRequest(friendshipId, userId);
      return toSharedFriendship(friendship);
    } else if (action === "decline") {
      const friendship = await this.friendships.declineRequest(friendshipId, userId);
      return toSharedFriendship(friendship);
    } else {
      throw new ApplicationError("VALIDATION_ERROR", "Action must be 'accept' or 'decline'");
    }
  }
}

export class BlockUserUseCase {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(blockerUserId: string, targetUserId: string): Promise<Friendship> {
    const validTargetId = validateTargetUserId(blockerUserId, targetUserId);
    const targetUser = await this.users.findById(validTargetId);

    if (!targetUser) {
      throw new ApplicationError("NOT_FOUND", "Target user not found");
    }

    const friendship = await this.friendships.blockUser(blockerUserId, validTargetId);
    return toSharedFriendship(friendship);
  }
}

export class UnblockUserUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(blockerUserId: string, targetUserId: string): Promise<void> {
    const validTargetId = validateTargetUserId(blockerUserId, targetUserId);
    await this.friendships.unblockUser(blockerUserId, validTargetId);
  }
}

export class RemoveFriendshipUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(userId: string, friendshipId: string): Promise<void> {
    await this.friendships.removeFriendship(friendshipId, userId);
  }
}

export class ListFriendsUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(userId: string): Promise<FriendSummary[]> {
    return this.friendships.listFriends(userId);
  }
}

export class ListPendingRequestsUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(
    userId: string,
    direction: "incoming" | "outgoing",
  ): Promise<FriendSummary[]> {
    return this.friendships.listPending(userId, direction);
  }
}

export class ListBlockedUsersUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(userId: string): Promise<FriendSummary[]> {
    return this.friendships.listBlocked(userId);
  }
}

export class CheckInteractionPolicyUseCase {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(userA: string, userB: string): Promise<FriendshipInteractionPolicy> {
    if (userA === userB) {
      return { canInteract: true, isBlocked: false, areFriends: false };
    }

    const friendship = await this.friendships.findPair(userA, userB);

    if (!friendship) {
      return { canInteract: true, isBlocked: false, areFriends: false };
    }

    if (friendship.status === "blocked") {
      return {
        canInteract: false,
        isBlocked: true,
        areFriends: false,
        reason: "Interaction blocked due to block status between users",
      };
    }

    if (friendship.status === "accepted") {
      return { canInteract: true, isBlocked: false, areFriends: true };
    }

    return {
      canInteract: true,
      isBlocked: false,
      areFriends: false,
      reason: `Friendship status is ${friendship.status}`,
    };
  }
}
