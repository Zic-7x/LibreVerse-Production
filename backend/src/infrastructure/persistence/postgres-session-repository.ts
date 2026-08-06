import crypto from "node:crypto";
import type pg from "pg";
import type {
  CreateSessionInput,
  SessionRepository,
} from "../../application/interfaces/auth.js";
import type { Session } from "../../domain/entities/auth-entities.js";

interface SessionRow {
  id: string;
  user_id: string;
  device_id: string | null;
  refresh_token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
  last_used_at: Date | null;
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    refreshTokenHash: row.refresh_token_hash,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export class PostgresSessionRepository implements SessionRepository {
  private inMemorySessions: Map<string, Session> = new Map();

  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateSessionInput): Promise<Session> {
    try {
      const result = await this.pool.query<SessionRow>(
        `INSERT INTO sessions (
           user_id, device_id, refresh_token_hash, ip_address, user_agent, expires_at
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, device_id, refresh_token_hash, ip_address, user_agent,
                   expires_at, revoked_at, created_at, last_used_at`,
        [
          input.userId,
          input.deviceId,
          input.refreshTokenHash,
          input.ipAddress,
          input.userAgent,
          input.expiresAt,
        ],
      );
      if (result.rows[0]) {
        return mapSession(result.rows[0]);
      }
    } catch (err) {
      console.error("[PostgresSessionRepository] create session query failed, falling back to inMemorySessions:", (err as Error).message);
    }

    const id = crypto.randomUUID();
    const session: Session = {
      id,
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      refreshTokenHash: input.refreshTokenHash,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
      lastUsedAt: null,
    };
    this.inMemorySessions.set(id, session);
    return session;
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    try {
      const result = await this.pool.query<SessionRow>(
        `SELECT id, user_id, device_id, refresh_token_hash, ip_address, user_agent,
                expires_at, revoked_at, created_at, last_used_at
         FROM sessions
         WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
        [hash],
      );
      if (result.rows[0]) return mapSession(result.rows[0]);
    } catch (err) {
      console.error("[PostgresSessionRepository] findByRefreshTokenHash query failed, falling back to inMemorySessions:", (err as Error).message);
    }

    for (const s of this.inMemorySessions.values()) {
      if (s.refreshTokenHash === hash && !s.revokedAt) {
        return s;
      }
    }
    return null;
  }

  async findById(id: string): Promise<Session | null> {
    try {
      const result = await this.pool.query<SessionRow>(
        `SELECT id, user_id, device_id, refresh_token_hash, ip_address, user_agent,
                expires_at, revoked_at, created_at, last_used_at
         FROM sessions WHERE id = $1`,
        [id],
      );
      if (result.rows[0]) return mapSession(result.rows[0]);
    } catch (err) {
      console.error("[PostgresSessionRepository] findById query failed, falling back to inMemorySessions:", (err as Error).message);
    }
    return this.inMemorySessions.get(id) ?? null;
  }

  async revoke(id: string, at: Date): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE sessions SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL`,
        [id, at],
      );
    } catch (err) {
      console.error("[PostgresSessionRepository] revoke session query failed, falling back to inMemorySessions:", (err as Error).message);
    }
    const session = this.inMemorySessions.get(id);
    if (session) {
      session.revokedAt = at;
    }
  }

  async revokeAllForUser(
    userId: string,
    at: Date,
    exceptSessionId?: string,
  ): Promise<void> {
    try {
      if (exceptSessionId) {
        await this.pool.query(
          `UPDATE sessions SET revoked_at = $3
           WHERE user_id = $1 AND revoked_at IS NULL AND id <> $2`,
          [userId, exceptSessionId, at],
        );
      } else {
        await this.pool.query(
          `UPDATE sessions SET revoked_at = $2
           WHERE user_id = $1 AND revoked_at IS NULL`,
          [userId, at],
        );
      }
    } catch (err) {
      console.error("[PostgresSessionRepository] revokeAllForUser query failed, falling back to inMemorySessions:", (err as Error).message);
    }

    for (const s of this.inMemorySessions.values()) {
      if (s.userId === userId && !s.revokedAt && s.id !== exceptSessionId) {
        s.revokedAt = at;
      }
    }
  }

  async touchLastUsed(id: string, at: Date): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE sessions SET last_used_at = $2 WHERE id = $1`,
        [id, at],
      );
    } catch (err) {
      console.error("[PostgresSessionRepository] touchLastUsed query failed, falling back to inMemorySessions:", (err as Error).message);
    }
    const session = this.inMemorySessions.get(id);
    if (session) {
      session.lastUsedAt = at;
    }
  }
}

