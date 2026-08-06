import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../bootstrap/create-app.js";
import type { AppConfig } from "../../infrastructure/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../../../../database/migrations");

const testConfig: AppConfig = {
  host: "127.0.0.1",
  port: 0,
  logLevel: "silent",
  nodeEnv: "test",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://platform:platform@127.0.0.1:5432/platform",
  jwtSecret: "test-jwt-secret",
  jwtAccessTtlSeconds: 900,
  refreshTokenTtlSeconds: 2_592_000,
};

async function applyMigrations(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".up.sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.up\.sql$/, "");
    const { rows } = await client.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1",
      [version],
    );
    if (rows.length > 0) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [version],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  await client.end();
}

async function resetAuthTables(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(`
    TRUNCATE sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("auth integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in auth.integration.test.ts as DB is unavailable:", (err as Error).message);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (app) {
      await resetAuthTables(databaseUrl);
    }
  });

  it("register → login → refresh → logout lifecycle", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    const registerRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "alice@example.com",
        password: "password123",
        device: { platform: "web", deviceName: "Chrome" },
      },
    });

    expect(registerRes.statusCode).toBe(201);
    const registered = registerRes.json();
    expect(registered.user.email).toBe("alice@example.com");
    expect(registered.accessToken).toBeTruthy();
    expect(registered.refreshToken).toBeTruthy();

    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${registered.accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "alice@example.com",
        password: "password123",
        device: { platform: "ios", deviceName: "iPhone" },
      },
    });
    expect(loginRes.statusCode).toBe(200);
    const loggedIn = loginRes.json();

    const refreshRes = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: loggedIn.refreshToken },
    });
    expect(refreshRes.statusCode).toBe(200);
    const refreshed = refreshRes.json();
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(loggedIn.refreshToken);

    const oldRefreshRes = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: loggedIn.refreshToken },
    });
    expect(oldRefreshRes.statusCode).toBe(401);

    const logoutRes = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { refreshToken: refreshed.refreshToken },
    });
    expect(logoutRes.statusCode).toBe(200);

    const revokedRefreshRes = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: refreshed.refreshToken },
    });
    expect(revokedRefreshRes.statusCode).toBe(401);
  });

  it("suspended user cannot login or refresh", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    const registerRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "suspended@example.com",
        password: "password123",
      },
    });
    const { refreshToken, user } = registerRes.json();

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(`UPDATE users SET status = 'suspended' WHERE id = $1`, [
      user.id,
    ]);
    await client.end();

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "suspended@example.com",
        password: "password123",
      },
    });
    expect(loginRes.statusCode).toBe(403);

    const refreshRes = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken },
    });
    expect(refreshRes.statusCode).toBe(403);
  });

  it("two devices keep independent sessions after single logout", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "bob@example.com",
        password: "password123",
      },
    });

    const device1 = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "bob@example.com",
        password: "password123",
        device: { platform: "web", deviceName: "Chrome" },
      },
    });
    const session1 = device1.json();

    const device2 = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "bob@example.com",
        password: "password123",
        device: { platform: "ios", deviceName: "iPhone" },
      },
    });
    const session2 = device2.json();

    await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { refreshToken: session1.refreshToken },
    });

    const device2Refresh = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: session2.refreshToken },
    });
    expect(device2Refresh.statusCode).toBe(200);

    const device1Refresh = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: session1.refreshToken },
    });
    expect(device1Refresh.statusCode).toBe(401);
  });

  it("does not write to profiles or messaging tables on register", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "carol@example.com",
        password: "password123",
      },
    });

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM sessions) AS sessions,
        (SELECT COUNT(*)::int FROM devices) AS devices,
        (SELECT COUNT(*)::int FROM profiles) AS profiles,
        (SELECT COUNT(*)::int FROM friendships) AS friendships,
        (SELECT COUNT(*)::int FROM conversations) AS conversations
    `);

    await client.end();

    expect(counts.rows[0]).toEqual({
      users: 1,
      sessions: 1,
      devices: 0,
      profiles: 0,
      friendships: 0,
      conversations: 0,
    });
  });
});
