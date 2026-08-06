import type pg from "pg";
import type { FriendSummary } from "@platform/shared-types";
import { ApplicationError } from "../../application/errors/application-error.js";
import type { FriendshipRepository } from "../../application/interfaces/friendship.js";
import {
  getOrderedPair,
  type FriendshipEntity,
} from "../../domain/entities/friendship-entities.js";

interface FriendshipRow {
  id: string;
  user_id_low: string;
  user_id_high: string;
  initiated_by: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: Date;
  updated_at: Date;
  accepted_at: Date | null;
}

interface FriendSummaryRow {
  friendship_id: string;
  friend_user_id: string;
  display_name: string | null;
  primary_alias: string | null;
  avatar_media_id: string | null;
  status: "pending" | "accepted" | "declined" | "blocked";
  initiated_by: string;
  created_at: Date;
  accepted_at: Date | null;
}

function mapFriendship(row: FriendshipRow): FriendshipEntity {
  return {
    id: row.id,
    userIdLow: row.user_id_low,
    userIdHigh: row.user_id_high,
    initiatedBy: row.initiated_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
  };
}

function mapFriendSummary(row: FriendSummaryRow): FriendSummary {
  return {
    friendshipId: row.friendship_id,
    friendUserId: row.friend_user_id,
    displayName: row.display_name || "User",
    primaryAlias: row.primary_alias,
    avatarMediaId: row.avatar_media_id,
    status: row.status,
    initiatedBy: row.initiated_by,
    createdAt: row.created_at.toISOString(),
    acceptedAt: row.accepted_at ? row.accepted_at.toISOString() : null,
  };
}

export class PostgresFriendshipRepository implements FriendshipRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findPair(userA: string, userB: string): Promise<FriendshipEntity | null> {
    const { userIdLow, userIdHigh } = getOrderedPair(userA, userB);
    const result = await this.pool.query<FriendshipRow>(
      `SELECT id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at
       FROM friendships
       WHERE user_id_low = $1 AND user_id_high = $2`,
      [userIdLow, userIdHigh],
    );

    return result.rows[0] ? mapFriendship(result.rows[0]) : null;
  }

  async sendRequest(fromUserId: string, toUserId: string): Promise<FriendshipEntity> {
    const { userIdLow, userIdHigh } = getOrderedPair(fromUserId, toUserId);
    const existing = await this.findPair(fromUserId, toUserId);

    if (existing) {
      if (existing.status === "blocked") {
        if (existing.initiatedBy === toUserId) {
          throw new ApplicationError("FORBIDDEN", "Cannot send friend request to this user");
        } else {
          throw new ApplicationError("CONFLICT", "You have blocked this user. Unblock them first.");
        }
      }

      if (existing.status === "accepted") {
        return existing;
      }

      if (existing.status === "pending") {
        if (existing.initiatedBy === fromUserId) {
          return existing; // Idempotent
        } else {
          // Cross-request -> auto accept
          const accepted = await this.pool.query<FriendshipRow>(
            `UPDATE friendships
             SET status = 'accepted', accepted_at = now(), updated_at = now()
             WHERE id = $1
             RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
            [existing.id],
          );
          return mapFriendship(accepted.rows[0]!);
        }
      }

      if (existing.status === "declined") {
        const reSent = await this.pool.query<FriendshipRow>(
          `UPDATE friendships
           SET status = 'pending', initiated_by = $2, accepted_at = NULL, updated_at = now()
           WHERE id = $1
           RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
          [existing.id, fromUserId],
        );
        return mapFriendship(reSent.rows[0]!);
      }
    }

    const inserted = await this.pool.query<FriendshipRow>(
      `INSERT INTO friendships (user_id_low, user_id_high, initiated_by, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
      [userIdLow, userIdHigh, fromUserId],
    );

    return mapFriendship(inserted.rows[0]!);
  }

  async acceptRequest(friendshipId: string, acceptorUserId: string): Promise<FriendshipEntity> {
    const result = await this.pool.query<FriendshipRow>(
      `SELECT id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at
       FROM friendships WHERE id = $1`,
      [friendshipId],
    );

    const friendship = result.rows[0];
    if (!friendship) {
      throw new ApplicationError("NOT_FOUND", "Friend request not found");
    }

    if (friendship.user_id_low !== acceptorUserId && friendship.user_id_high !== acceptorUserId) {
      throw new ApplicationError("FORBIDDEN", "You are not a participant in this friendship");
    }

    if (friendship.status === "accepted") {
      return mapFriendship(friendship);
    }

    if (friendship.status !== "pending") {
      throw new ApplicationError("CONFLICT", `Cannot accept request with status '${friendship.status}'`);
    }

    if (friendship.initiated_by === acceptorUserId) {
      throw new ApplicationError("FORBIDDEN", "Cannot accept your own friend request");
    }

    const updated = await this.pool.query<FriendshipRow>(
      `UPDATE friendships
       SET status = 'accepted', accepted_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
      [friendshipId],
    );

    return mapFriendship(updated.rows[0]!);
  }

  async declineRequest(friendshipId: string, declinerUserId: string): Promise<FriendshipEntity> {
    const result = await this.pool.query<FriendshipRow>(
      `SELECT id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at
       FROM friendships WHERE id = $1`,
      [friendshipId],
    );

    const friendship = result.rows[0];
    if (!friendship) {
      throw new ApplicationError("NOT_FOUND", "Friend request not found");
    }

    if (friendship.user_id_low !== declinerUserId && friendship.user_id_high !== declinerUserId) {
      throw new ApplicationError("FORBIDDEN", "You are not a participant in this friendship");
    }

    if (friendship.status === "declined") {
      return mapFriendship(friendship);
    }

    if (friendship.initiated_by === declinerUserId) {
      throw new ApplicationError("FORBIDDEN", "Cannot decline your own friend request");
    }

    const updated = await this.pool.query<FriendshipRow>(
      `UPDATE friendships
       SET status = 'declined', updated_at = now()
       WHERE id = $1
       RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
      [friendshipId],
    );

    return mapFriendship(updated.rows[0]!);
  }

  async blockUser(blockerUserId: string, targetUserId: string): Promise<FriendshipEntity> {
    const { userIdLow, userIdHigh } = getOrderedPair(blockerUserId, targetUserId);

    const result = await this.pool.query<FriendshipRow>(
      `INSERT INTO friendships (user_id_low, user_id_high, initiated_by, status, accepted_at, updated_at)
       VALUES ($1, $2, $3, 'blocked', NULL, now())
       ON CONFLICT (user_id_low, user_id_high) DO UPDATE SET
         status = 'blocked',
         initiated_by = EXCLUDED.initiated_by,
         accepted_at = NULL,
         updated_at = now()
       RETURNING id, user_id_low, user_id_high, initiated_by, status, created_at, updated_at, accepted_at`,
      [userIdLow, userIdHigh, blockerUserId],
    );

    return mapFriendship(result.rows[0]!);
  }

  async unblockUser(blockerUserId: string, targetUserId: string): Promise<void> {
    const { userIdLow, userIdHigh } = getOrderedPair(blockerUserId, targetUserId);

    await this.pool.query(
      `DELETE FROM friendships
       WHERE user_id_low = $1 AND user_id_high = $2 AND status = 'blocked' AND initiated_by = $3`,
      [userIdLow, userIdHigh, blockerUserId],
    );
  }

  async removeFriendship(friendshipId: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM friendships
       WHERE id = $1 AND (user_id_low = $2 OR user_id_high = $2)`,
      [friendshipId, userId],
    );

    if (result.rowCount === 0) {
      throw new ApplicationError("NOT_FOUND", "Friendship not found or unauthorized");
    }
  }

  async listFriends(userId: string): Promise<FriendSummary[]> {
    const result = await this.pool.query<FriendSummaryRow>(
      `SELECT f.id as friendship_id,
              CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END as friend_user_id,
              p.display_name,
              pa.alias as primary_alias,
              p.avatar_media_id,
              f.status,
              f.initiated_by,
              f.created_at,
              f.accepted_at
       FROM friendships f
       LEFT JOIN profiles p ON p.user_id = CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END
       LEFT JOIN public_aliases pa ON pa.user_id = p.user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE (f.user_id_low = $1 OR f.user_id_high = $1) AND f.status = 'accepted'
       ORDER BY f.accepted_at DESC NULLS LAST`,
      [userId],
    );

    return result.rows.map(mapFriendSummary);
  }

  async listPending(userId: string, direction: "incoming" | "outgoing"): Promise<FriendSummary[]> {
    const condition =
      direction === "incoming"
        ? "f.initiated_by != $1"
        : "f.initiated_by = $1";

    const result = await this.pool.query<FriendSummaryRow>(
      `SELECT f.id as friendship_id,
              CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END as friend_user_id,
              p.display_name,
              pa.alias as primary_alias,
              p.avatar_media_id,
              f.status,
              f.initiated_by,
              f.created_at,
              f.accepted_at
       FROM friendships f
       LEFT JOIN profiles p ON p.user_id = CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END
       LEFT JOIN public_aliases pa ON pa.user_id = p.user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE (f.user_id_low = $1 OR f.user_id_high = $1) AND f.status = 'pending' AND ${condition}
       ORDER BY f.created_at DESC`,
      [userId],
    );

    return result.rows.map(mapFriendSummary);
  }

  async listBlocked(userId: string): Promise<FriendSummary[]> {
    const result = await this.pool.query<FriendSummaryRow>(
      `SELECT f.id as friendship_id,
              CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END as friend_user_id,
              p.display_name,
              pa.alias as primary_alias,
              p.avatar_media_id,
              f.status,
              f.initiated_by,
              f.created_at,
              f.accepted_at
       FROM friendships f
       LEFT JOIN profiles p ON p.user_id = CASE WHEN f.user_id_low = $1 THEN f.user_id_high ELSE f.user_id_low END
       LEFT JOIN public_aliases pa ON pa.user_id = p.user_id AND pa.is_primary = true AND pa.active_until IS NULL
       WHERE (f.user_id_low = $1 OR f.user_id_high = $1) AND f.status = 'blocked' AND f.initiated_by = $1
       ORDER BY f.updated_at DESC`,
      [userId],
    );

    return result.rows.map(mapFriendSummary);
  }
}
