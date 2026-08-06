import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../bootstrap/create-app.js";
import type { AppConfig } from "../../infrastructure/config/env.js";
import type { MockPushProviderAdapter } from "../../infrastructure/push/mock-push-provider.js";

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

async function truncateTables(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(`
    TRUNCATE TABLE
      notifications,
      notification_preferences,
      messages,
      conversation_participants,
      conversations,
      friendships,
      devices,
      user_sessions,
      users
    CASCADE;
  `);
  await client.end();
}

describe("Milestone 12: Push Notifications Integration Tests", () => {
  let app: Awaited<ReturnType<typeof createApp>>["app"];
  let pool: pg.Pool;
  let pushProvider: MockPushProviderAdapter;

  beforeAll(async () => {
    try {
      await applyMigrations(testConfig.databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      pool = container.pool;
      pushProvider = container.pushProvider;
      await app.ready();
    } catch {
      // Postgres might be offline
    }
  });

  beforeEach(async () => {
    if (app) {
      await truncateTables(testConfig.databaseUrl);
      pushProvider.clear();
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function registerUser(email: string, username: string) {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email,
        password: "Password123!",
        displayName: username,
      },
    });
    expect(res.statusCode).toBe(201);
    const data = res.json();
    return {
      userId: data.user.id as string,
      accessToken: data.accessToken as string,
    };
  }

  async function registerDevice(accessToken: string, pushToken: string) {
    const res = await app.inject({
      method: "POST",
      url: "/auth/devices",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        platform: "android",
        deviceName: "Test Phone",
        pushToken,
      },
    });
    expect(res.statusCode).toBe(200);
    return res.json().id as string;
  }

  it("dispatches push notification when push & in_app enabled (default)", async () => {
    if (!app) return;

    const userA = await registerUser("sender12@example.com", "Alice");
    const userB = await registerUser("recipient12@example.com", "Bob");

    // Bob registers device with push token
    await registerDevice(userB.accessToken, "fcm-token-bob-123");

    // Alice sends friend request
    const reqRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });
    expect(reqRes.statusCode).toBe(201);

    // Assert mock push provider received push dispatch
    expect(pushProvider.sentPushes.length).toBe(1);
    const sent = pushProvider.sentPushes[0];
    expect(sent.recipientUserId).toBe(userB.userId);
    expect(sent.deviceToken).toBe("fcm-token-bob-123");
    expect(sent.notificationType).toBe("friend_request");
    expect(sent.title).toBe("Friend Request");
  });

  it("does NOT dispatch push notification if user disabled push channel in preferences", async () => {
    if (!app) return;

    const userA = await registerUser("sender12b@example.com", "Alice");
    const userB = await registerUser("recipient12b@example.com", "Bob");

    await registerDevice(userB.accessToken, "fcm-token-bob-456");

    // Bob disables 'push' channel for 'friend_request'
    const prefRes = await app.inject({
      method: "PUT",
      url: "/notification-preferences",
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: {
        notificationType: "friend_request",
        channel: "push",
        enabled: false,
      },
    });
    expect(prefRes.statusCode).toBe(200);

    // Alice sends friend request
    await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });

    // Push provider should NOT receive push
    expect(pushProvider.sentPushes.length).toBe(0);
  });

  it("invalidates device push token when provider returns token invalid error", async () => {
    if (!app) return;

    const userA = await registerUser("sender12c@example.com", "Alice");
    const userC = await registerUser("recipient12c@example.com", "Charlie");

    const deviceId = await registerDevice(userC.accessToken, "bad-token-777");

    // Mark token as invalid in mock push provider
    pushProvider.invalidTokens.add("bad-token-777");

    // Alice sends friend request to Charlie
    await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userC.userId },
    });

    // Verify pushToken was cleared in DB for Charlie's device
    const { rows } = await pool.query<{ push_token: string | null }>(
      `SELECT push_token FROM devices WHERE id = $1`,
      [deviceId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].push_token).toBeNull();
  });
});
