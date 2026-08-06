import type pg from "pg";
import type { PublicAliasRepository } from "../../application/interfaces/profile.js";
import type { PublicAliasEntity } from "../../domain/entities/profile-entities.js";
import { ApplicationError } from "../../application/errors/application-error.js";

interface PublicAliasRow {
  id: string;
  user_id: string;
  alias: string;
  is_primary: boolean;
  active_from: Date;
  active_until: Date | null;
  created_at: Date;
}

function mapPublicAlias(row: PublicAliasRow): PublicAliasEntity {
  return {
    id: row.id,
    userId: row.user_id,
    alias: row.alias,
    isPrimary: row.is_primary,
    activeFrom: row.active_from,
    activeUntil: row.active_until,
    createdAt: row.created_at,
  };
}

export class PostgresPublicAliasRepository implements PublicAliasRepository {
  constructor(private readonly pool: pg.Pool) {}

  async claimPrimaryAlias(userId: string, alias: string): Promise<PublicAliasEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Check if current active alias is already this exact handle for this user
      const existing = await client.query<PublicAliasRow>(
        `SELECT id, user_id, alias, is_primary, active_from, active_until, created_at
         FROM public_aliases
         WHERE alias = $1 AND active_until IS NULL`,
        [alias],
      );

      if (existing.rows[0]) {
        if (existing.rows[0].user_id === userId) {
          // Already belongs to this user and is active
          if (!existing.rows[0].is_primary) {
            await client.query(
              `UPDATE public_aliases SET is_primary = false WHERE user_id = $1 AND active_until IS NULL`,
              [userId],
            );
            const updated = await client.query<PublicAliasRow>(
              `UPDATE public_aliases SET is_primary = true WHERE id = $1 RETURNING *`,
              [existing.rows[0].id],
            );
            await client.query("COMMIT");
            return mapPublicAlias(updated.rows[0]!);
          }
          await client.query("COMMIT");
          return mapPublicAlias(existing.rows[0]);
        } else {
          throw new ApplicationError("CONFLICT", "Alias is already taken");
        }
      }

      // Deactivate existing primary alias(es) for this user
      await client.query(
        `UPDATE public_aliases
         SET active_until = now(), is_primary = false
         WHERE user_id = $1 AND active_until IS NULL`,
        [userId],
      );

      // Insert new primary alias
      const inserted = await client.query<PublicAliasRow>(
        `INSERT INTO public_aliases (user_id, alias, is_primary, active_from)
         VALUES ($1, $2, true, now())
         RETURNING id, user_id, alias, is_primary, active_from, active_until, created_at`,
        [userId, alias],
      );

      await client.query("COMMIT");
      return mapPublicAlias(inserted.rows[0]!);
    } catch (err: unknown) {
      await client.query("ROLLBACK");
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new ApplicationError("CONFLICT", "Alias is already taken");
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async findPrimaryByUserId(userId: string): Promise<PublicAliasEntity | null> {
    const result = await this.pool.query<PublicAliasRow>(
      `SELECT id, user_id, alias, is_primary, active_from, active_until, created_at
       FROM public_aliases
       WHERE user_id = $1 AND is_primary = true AND active_until IS NULL`,
      [userId],
    );

    return result.rows[0] ? mapPublicAlias(result.rows[0]) : null;
  }

  async findActiveByAlias(alias: string): Promise<PublicAliasEntity | null> {
    const result = await this.pool.query<PublicAliasRow>(
      `SELECT id, user_id, alias, is_primary, active_from, active_until, created_at
       FROM public_aliases
       WHERE alias = $1 AND active_until IS NULL`,
      [alias],
    );

    return result.rows[0] ? mapPublicAlias(result.rows[0]) : null;
  }

  async findHistoryByUserId(userId: string): Promise<PublicAliasEntity[]> {
    const result = await this.pool.query<PublicAliasRow>(
      `SELECT id, user_id, alias, is_primary, active_from, active_until, created_at
       FROM public_aliases
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map(mapPublicAlias);
  }
}
