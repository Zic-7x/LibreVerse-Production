import type {
  Friendship as SharedFriendship,
  FriendshipStatus,
} from "@platform/shared-types";

export interface FriendshipEntity {
  id: string;
  userIdLow: string;
  userIdHigh: string;
  initiatedBy: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt: Date | null;
}

export function getOrderedPair(
  userA: string,
  userB: string,
): { userIdLow: string; userIdHigh: string } {
  if (userA === userB) {
    throw new Error("Cannot form friendship pair with self");
  }
  if (userA < userB) {
    return { userIdLow: userA, userIdHigh: userB };
  }
  return { userIdLow: userB, userIdHigh: userA };
}

export function toSharedFriendship(
  friendship: FriendshipEntity,
): SharedFriendship {
  return {
    id: friendship.id,
    userIdLow: friendship.userIdLow,
    userIdHigh: friendship.userIdHigh,
    initiatedBy: friendship.initiatedBy,
    status: friendship.status,
    createdAt: friendship.createdAt.toISOString(),
    updatedAt: friendship.updatedAt.toISOString(),
    acceptedAt: friendship.acceptedAt
      ? friendship.acceptedAt.toISOString()
      : null,
  };
}
