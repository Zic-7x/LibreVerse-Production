import pg from "pg";
import type { DatabaseProbe } from "../../application/interfaces/database-probe.js";

export class PostgresDatabaseProbe implements DatabaseProbe {
  constructor(private readonly pool: pg.Pool) {}

  async ping(): Promise<boolean> {
    try {
      const result = await this.pool.query("SELECT 1 AS ok");
      return result.rows[0]?.ok === 1;
    } catch (err) {
      console.error("[PostgresDatabaseProbe] ping failed:", (err as Error).message);
      return false;
    }
  }
}

export function createPostgresPool(connectionString: string): pg.Pool {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("[PostgresPool] Idle client error:", err.message);
  });

  return pool;
}

