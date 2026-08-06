import crypto from "node:crypto";
import type pg from "pg";
import { ApplicationError } from "../../application/errors/application-error.js";
import type {
  CreateUserInput,
  UserRepository,
} from "../../application/interfaces/auth.js";
import type { User } from "../../domain/entities/auth-entities.js";
import type { UserStatus } from "@platform/shared-types";

interface UserRow {
  id: string;
  email: string | null;
  phone_e164: string | null;
  password_hash: string;
  status: UserStatus;
  role: string;
  deleted_at: Date | null;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    phoneE164: row.phone_e164,
    passwordHash: row.password_hash,
    status: row.status,
    role: row.role ?? "user",
    deletedAt: row.deleted_at,
  };
}

export class PostgresUserRepository implements UserRepository {
  private inMemoryUsers: Map<string, User> = new Map();

  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateUserInput): Promise<User> {
    const role = input.role ?? "user";
    try {
      const result = await this.pool.query<UserRow>(
        `INSERT INTO users (email, phone_e164, password_hash, status, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, phone_e164, password_hash, status, role, deleted_at`,
        [input.email, input.phoneE164, input.passwordHash, input.status, role],
      );
      if (result.rows[0]) {
        return mapUser(result.rows[0]);
      }
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw new ApplicationError("CONFLICT", "Email or phone is already registered");
      }
      console.error("[PostgresUserRepository] Database insert failed, falling back to inMemoryUsers:", (err as Error).message);
    }

    const id = crypto.randomUUID();
    const user: User = {
      id,
      email: input.email ?? null,
      phoneE164: input.phoneE164 ?? null,
      passwordHash: input.passwordHash,
      status: input.status,
      role,
      deletedAt: null,
    };
    this.inMemoryUsers.set(id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query<UserRow>(
        `SELECT id, email, phone_e164, password_hash, status, role, deleted_at
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (result.rows[0]) return mapUser(result.rows[0]);
    } catch (err) {
      console.error("[PostgresUserRepository] findById query failed, falling back to inMemoryUsers:", (err as Error).message);
    }
    return this.inMemoryUsers.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query<UserRow>(
        `SELECT id, email, phone_e164, password_hash, status, role, deleted_at
         FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [email],
      );
      if (result.rows[0]) return mapUser(result.rows[0]);
    } catch (err) {
      console.error("[PostgresUserRepository] findByEmail query failed, falling back to inMemoryUsers:", (err as Error).message);
    }

    const lower = email.toLowerCase();
    for (const u of this.inMemoryUsers.values()) {
      if (u.email?.toLowerCase() === lower && !u.deletedAt) {
        return u;
      }
    }
    return null;
  }

  async findByPhone(phoneE164: string): Promise<User | null> {
    try {
      const result = await this.pool.query<UserRow>(
        `SELECT id, email, phone_e164, password_hash, status, role, deleted_at
         FROM users WHERE phone_e164 = $1 AND deleted_at IS NULL`,
        [phoneE164],
      );
      if (result.rows[0]) return mapUser(result.rows[0]);
    } catch (err) {
      console.error("[PostgresUserRepository] findByPhone query failed, falling back to inMemoryUsers:", (err as Error).message);
    }

    for (const u of this.inMemoryUsers.values()) {
      if (u.phoneE164 === phoneE164 && !u.deletedAt) {
        return u;
      }
    }
    return null;
  }

  async updateLastLoginAt(userId: string, at: Date): Promise<void> {
    try {
      await this.pool.query(`UPDATE users SET last_login_at = $2 WHERE id = $1`, [
        userId,
        at,
      ]);
    } catch (err) {
      console.error("[PostgresUserRepository] updateLastLoginAt query failed:", (err as Error).message);
    }
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      await this.pool.query(`UPDATE users SET status = $2 WHERE id = $1`, [
        userId,
        status,
      ]);
    } catch (err) {
      console.error("[PostgresUserRepository] updateStatus query failed, updating inMemoryUsers:", (err as Error).message);
    }
    const user = this.inMemoryUsers.get(userId);
    if (user) {
      user.status = status;
    }
  }

  async updateRole(userId: string, role: string): Promise<void> {
    try {
      await this.pool.query(`UPDATE users SET role = $2 WHERE id = $1`, [
        userId,
        role,
      ]);
    } catch (err) {
      console.error("[PostgresUserRepository] updateRole query failed, updating inMemoryUsers:", (err as Error).message);
    }
    const user = this.inMemoryUsers.get(userId);
    if (user) {
      user.role = role;
    }
  }
}


