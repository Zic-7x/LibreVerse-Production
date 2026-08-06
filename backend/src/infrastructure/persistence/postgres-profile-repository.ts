import type pg from "pg";
import type {
  CreateProfileInput,
  ProfileRepository,
  ProfileSearchResult,
  UpdateProfileInputData,
} from "../../application/interfaces/profile.js";
import type { ProfileEntity } from "../../domain/entities/profile-entities.js";

interface ProfileRow {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_media_id: string | null;
  birth_date: Date | string | null;
  locale: string;
  timezone: string;
  is_discoverable: boolean;
  created_at: Date;
  updated_at: Date;
}

interface SearchProfileRow {
  user_id: string;
  display_name: string;
  avatar_media_id: string | null;
  alias: string | null;
}

function mapProfile(row: ProfileRow): ProfileEntity {
  let birthDateStr: string | null = null;
  if (row.birth_date) {
    if (row.birth_date instanceof Date) {
      birthDateStr = row.birth_date.toISOString().split("T")[0]!;
    } else {
      birthDateStr = String(row.birth_date).split("T")[0]!;
    }
  }

  return {
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio,
    avatarMediaId: row.avatar_media_id,
    birthDate: birthDateStr,
    locale: row.locale,
    timezone: row.timezone,
    isDiscoverable: row.is_discoverable,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresProfileRepository implements ProfileRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateProfileInput): Promise<ProfileEntity> {
    const result = await this.pool.query<ProfileRow>(
      `INSERT INTO profiles (
         user_id, display_name, bio, birth_date, locale, timezone, is_discoverable
       )
       VALUES ($1, $2, $3, $4, COALESCE($5, 'en'), COALESCE($6, 'UTC'), COALESCE($7, true))
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         bio = COALESCE(EXCLUDED.bio, profiles.bio),
         birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
         locale = COALESCE(EXCLUDED.locale, profiles.locale),
         timezone = COALESCE(EXCLUDED.timezone, profiles.timezone),
         is_discoverable = COALESCE(EXCLUDED.is_discoverable, profiles.is_discoverable),
         updated_at = now()
       RETURNING user_id, display_name, bio, avatar_media_id, birth_date, locale, timezone, is_discoverable, created_at, updated_at`,
      [
        input.userId,
        input.displayName,
        input.bio ?? null,
        input.birthDate ?? null,
        input.locale ?? "en",
        input.timezone ?? "UTC",
        input.isDiscoverable ?? true,
      ],
    );

    return mapProfile(result.rows[0]!);
  }

  async findByUserId(userId: string): Promise<ProfileEntity | null> {
    const result = await this.pool.query<ProfileRow>(
      `SELECT user_id, display_name, bio, avatar_media_id, birth_date, locale, timezone, is_discoverable, created_at, updated_at
       FROM profiles
       WHERE user_id = $1`,
      [userId],
    );

    return result.rows[0] ? mapProfile(result.rows[0]) : null;
  }

  async update(userId: string, data: UpdateProfileInputData): Promise<ProfileEntity> {
    const fields: string[] = [];
    const values: unknown[] = [userId];
    let idx = 2;

    if (data.displayName !== undefined) {
      fields.push(`display_name = $${idx++}`);
      values.push(data.displayName);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.avatarMediaId !== undefined) {
      fields.push(`avatar_media_id = $${idx++}`);
      values.push(data.avatarMediaId);
    }
    if (data.birthDate !== undefined) {
      fields.push(`birth_date = $${idx++}`);
      values.push(data.birthDate);
    }
    if (data.locale !== undefined) {
      fields.push(`locale = $${idx++}`);
      values.push(data.locale);
    }
    if (data.timezone !== undefined) {
      fields.push(`timezone = $${idx++}`);
      values.push(data.timezone);
    }
    if (data.isDiscoverable !== undefined) {
      fields.push(`is_discoverable = $${idx++}`);
      values.push(data.isDiscoverable);
    }

    if (fields.length === 0) {
      const existing = await this.findByUserId(userId);
      if (!existing) {
        throw new Error("Profile not found");
      }
      return existing;
    }

    fields.push("updated_at = now()");

    const result = await this.pool.query<ProfileRow>(
      `UPDATE profiles
       SET ${fields.join(", ")}
       WHERE user_id = $1
       RETURNING user_id, display_name, bio, avatar_media_id, birth_date, locale, timezone, is_discoverable, created_at, updated_at`,
      values,
    );

    if (!result.rows[0]) {
      throw new Error("Profile not found");
    }

    return mapProfile(result.rows[0]);
  }

  async searchProfiles(
    query: string,
    excludeUserId: string,
    limit = 20,
  ): Promise<ProfileSearchResult[]> {
    const cleanQuery = query.trim().replace(/^@/, "");
    if (!cleanQuery) return [];

    const searchPattern = `%${cleanQuery}%`;
    const exactPattern = cleanQuery;
    const safeLimit = Math.max(1, Math.min(limit, 50));

    const result = await this.pool.query<SearchProfileRow>(
      `SELECT 
         p.user_id,
         p.display_name,
         p.avatar_media_id,
         a.alias
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN public_aliases a ON a.user_id = p.user_id AND a.is_primary = true AND a.active_until IS NULL
       WHERE (p.display_name ILIKE $1 OR a.alias ILIKE $1)
         AND p.user_id != $2
         AND p.is_discoverable = true
         AND u.status = 'active'
         AND u.deleted_at IS NULL
       ORDER BY 
         CASE 
           WHEN a.alias ILIKE $3 THEN 1
           WHEN a.alias ILIKE $1 THEN 2
           WHEN p.display_name ILIKE $3 THEN 3
           ELSE 4 
         END,
         p.display_name ASC
       LIMIT $4`,
      [searchPattern, excludeUserId, exactPattern, safeLimit],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      alias: row.alias,
      avatarMediaId: row.avatar_media_id,
    }));
  }
}
