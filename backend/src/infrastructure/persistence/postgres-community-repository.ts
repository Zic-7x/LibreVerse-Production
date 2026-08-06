import type pg from "pg";
import type { CommunityMemberRole, CommunityVisibility } from "@platform/shared-types";
import type {
  CommunityRepository,
  CreateCommunityRepositoryInput,
  UpdateCommunityRepositoryInput,
} from "../../application/interfaces/community.js";
import type {
  CommunityEntity,
  CommunityMemberEntity,
} from "../../domain/entities/community-entities.js";

interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_media_id: string | null;
  owner_user_id: string;
  visibility: CommunityVisibility;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
  member_count?: string | number;
}

interface CommunityMemberRow {
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  joined_at: Date;
  left_at: Date | null;
  display_name?: string | null;
  avatar_media_id?: string | null;
}

function mapCommunity(row: CommunityRow): CommunityEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    avatarMediaId: row.avatar_media_id,
    ownerUserId: row.owner_user_id,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    memberCount: row.member_count !== undefined ? Number(row.member_count) : undefined,
  };
}

function mapMember(row: CommunityMemberRow): CommunityMemberEntity {
  return {
    communityId: row.community_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    displayName: row.display_name ?? null,
    avatarMediaId: row.avatar_media_id ?? null,
  };
}

export class PostgresCommunityRepository implements CommunityRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateCommunityRepositoryInput): Promise<CommunityEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const commRes = await client.query<CommunityRow>(
        `INSERT INTO communities (name, slug, description, avatar_media_id, owner_user_id, visibility)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, slug, description, avatar_media_id, owner_user_id, visibility, created_at, updated_at, archived_at`,
        [
          input.name,
          input.slug,
          input.description ?? null,
          input.avatarMediaId ?? null,
          input.ownerUserId,
          input.visibility,
        ],
      );

      const comm = commRes.rows[0]!;

      // Automatically insert owner as a member with role 'owner'
      await client.query(
        `INSERT INTO community_members (community_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [comm.id, input.ownerUserId],
      );

      await client.query("COMMIT");

      return {
        ...mapCommunity(comm),
        memberCount: 1,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<CommunityEntity | null> {
    const result = await this.pool.query<CommunityRow>(
      `SELECT c.id, c.name, c.slug, c.description, c.avatar_media_id, c.owner_user_id,
              c.visibility, c.created_at, c.updated_at, c.archived_at,
              (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.left_at IS NULL) as member_count
       FROM communities c
       WHERE c.id = $1`,
      [id],
    );

    return result.rows[0] ? mapCommunity(result.rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<CommunityEntity | null> {
    const result = await this.pool.query<CommunityRow>(
      `SELECT c.id, c.name, c.slug, c.description, c.avatar_media_id, c.owner_user_id,
              c.visibility, c.created_at, c.updated_at, c.archived_at,
              (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.left_at IS NULL) as member_count
       FROM communities c
       WHERE c.slug = $1`,
      [slug],
    );

    return result.rows[0] ? mapCommunity(result.rows[0]) : null;
  }

  async update(id: string, input: UpdateCommunityRepositoryInput): Promise<CommunityEntity> {
    const fields: string[] = [];
    const values: unknown[] = [id];
    let idx = 2;

    if (input.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(input.slug);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(input.description);
    }
    if (input.avatarMediaId !== undefined) {
      fields.push(`avatar_media_id = $${idx++}`);
      values.push(input.avatarMediaId);
    }
    if (input.visibility !== undefined) {
      fields.push(`visibility = $${idx++}`);
      values.push(input.visibility);
    }

    fields.push(`updated_at = now()`);

    const result = await this.pool.query<CommunityRow>(
      `UPDATE communities
       SET ${fields.join(", ")}
       WHERE id = $1
       RETURNING id, name, slug, description, avatar_media_id, owner_user_id, visibility, created_at, updated_at, archived_at,
                 (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = communities.id AND cm.left_at IS NULL) as member_count`,
      values,
    );

    return mapCommunity(result.rows[0]!);
  }

  async archive(id: string): Promise<CommunityEntity> {
    const result = await this.pool.query<CommunityRow>(
      `UPDATE communities
       SET archived_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING id, name, slug, description, avatar_media_id, owner_user_id, visibility, created_at, updated_at, archived_at,
                 (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = communities.id AND cm.left_at IS NULL) as member_count`,
      [id],
    );

    return mapCommunity(result.rows[0]!);
  }

  async transferOwnership(id: string, newOwnerUserId: string): Promise<CommunityEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Get old owner
      const oldRes = await client.query<{ owner_user_id: string }>(
        `SELECT owner_user_id FROM communities WHERE id = $1`,
        [id],
      );
      if (!oldRes.rows[0]) {
        throw new Error("Community not found");
      }
      const oldOwnerUserId = oldRes.rows[0].owner_user_id;

      // 2. Update community owner_user_id
      const commRes = await client.query<CommunityRow>(
        `UPDATE communities
         SET owner_user_id = $2, updated_at = now()
         WHERE id = $1
         RETURNING id, name, slug, description, avatar_media_id, owner_user_id, visibility, created_at, updated_at, archived_at,
                   (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = communities.id AND cm.left_at IS NULL) as member_count`,
        [id, newOwnerUserId],
      );

      // 3. Update old owner's role to 'admin'
      await client.query(
        `UPDATE community_members
         SET role = 'admin'
         WHERE community_id = $1 AND user_id = $2`,
        [id, oldOwnerUserId],
      );

      // 4. Update or insert new owner's role to 'owner'
      await client.query(
        `INSERT INTO community_members (community_id, user_id, role, joined_at, left_at)
         VALUES ($1, $2, 'owner', now(), NULL)
         ON CONFLICT (community_id, user_id)
         DO UPDATE SET role = 'owner', left_at = NULL`,
        [id, newOwnerUserId],
      );

      await client.query("COMMIT");
      return mapCommunity(commRes.rows[0]!);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async listPublicCommunities(options?: { limit?: number; offset?: number }): Promise<CommunityEntity[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const result = await this.pool.query<CommunityRow>(
      `SELECT c.id, c.name, c.slug, c.description, c.avatar_media_id, c.owner_user_id,
              c.visibility, c.created_at, c.updated_at, c.archived_at,
              (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.left_at IS NULL) as member_count
       FROM communities c
       WHERE c.visibility IN ('public', 'private') AND c.archived_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return result.rows.map(mapCommunity);
  }

  async listCommunitiesForUser(userId: string): Promise<CommunityEntity[]> {
    const result = await this.pool.query<CommunityRow>(
      `SELECT c.id, c.name, c.slug, c.description, c.avatar_media_id, c.owner_user_id,
              c.visibility, c.created_at, c.updated_at, c.archived_at,
              (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.left_at IS NULL) as member_count
       FROM communities c
       JOIN community_members cm ON cm.community_id = c.id
       WHERE cm.user_id = $1 AND cm.left_at IS NULL
       ORDER BY cm.joined_at DESC`,
      [userId],
    );

    return result.rows.map(mapCommunity);
  }

  async getMember(communityId: string, userId: string): Promise<CommunityMemberEntity | null> {
    const result = await this.pool.query<CommunityMemberRow>(
      `SELECT cm.community_id, cm.user_id, cm.role, cm.joined_at, cm.left_at,
              p.display_name, p.avatar_media_id
       FROM community_members cm
       LEFT JOIN profiles p ON p.user_id = cm.user_id
       WHERE cm.community_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL`,
      [communityId, userId],
    );

    return result.rows[0] ? mapMember(result.rows[0]) : null;
  }

  async listMembers(communityId: string): Promise<CommunityMemberEntity[]> {
    const result = await this.pool.query<CommunityMemberRow>(
      `SELECT cm.community_id, cm.user_id, cm.role, cm.joined_at, cm.left_at,
              p.display_name, p.avatar_media_id
       FROM community_members cm
       LEFT JOIN profiles p ON p.user_id = cm.user_id
       WHERE cm.community_id = $1 AND cm.left_at IS NULL
       ORDER BY
         CASE cm.role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'moderator' THEN 3
           ELSE 4
         END, cm.joined_at ASC`,
      [communityId],
    );

    return result.rows.map(mapMember);
  }

  async addMember(
    communityId: string,
    userId: string,
    role: CommunityMemberRole = "member",
  ): Promise<CommunityMemberEntity> {
    const result = await this.pool.query<CommunityMemberRow>(
      `INSERT INTO community_members (community_id, user_id, role, joined_at, left_at)
       VALUES ($1, $2, $3, now(), NULL)
       ON CONFLICT (community_id, user_id)
       DO UPDATE SET role = $3, joined_at = now(), left_at = NULL
       RETURNING community_id, user_id, role, joined_at, left_at`,
      [communityId, userId, role],
    );

    const prof = await this.pool.query<{ display_name: string | null; avatar_media_id: string | null }>(
      `SELECT display_name, avatar_media_id FROM profiles WHERE user_id = $1`,
      [userId],
    );

    const row = result.rows[0]!;
    if (prof.rows[0]) {
      row.display_name = prof.rows[0].display_name;
      row.avatar_media_id = prof.rows[0].avatar_media_id;
    }

    return mapMember(row);
  }

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: CommunityMemberRole,
  ): Promise<CommunityMemberEntity> {
    const result = await this.pool.query<CommunityMemberRow>(
      `UPDATE community_members
       SET role = $3
       WHERE community_id = $1 AND user_id = $2 AND left_at IS NULL
       RETURNING community_id, user_id, role, joined_at, left_at`,
      [communityId, userId, role],
    );

    const prof = await this.pool.query<{ display_name: string | null; avatar_media_id: string | null }>(
      `SELECT display_name, avatar_media_id FROM profiles WHERE user_id = $1`,
      [userId],
    );

    const row = result.rows[0]!;
    if (prof.rows[0]) {
      row.display_name = prof.rows[0].display_name;
      row.avatar_media_id = prof.rows[0].avatar_media_id;
    }

    return mapMember(row);
  }

  async removeMember(communityId: string, userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE community_members
       SET left_at = now()
       WHERE community_id = $1 AND user_id = $2`,
      [communityId, userId],
    );
  }

  async getMemberCount(communityId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND left_at IS NULL`,
      [communityId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
