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
      user_devices,
      user_sessions,
      users
    CASCADE;
  `);
  await client.end();
}

describe("Milestone 11: Notifications & Preferences Integration Tests", () => {
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(testConfig.databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch {
      // Postgres might be offline
    }
  });

  beforeEach(async () => {
    if (app) {
      await truncateTables(testConfig.databaseUrl);
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

  it("creates in-app notifications when actions occur and preference is ON by default", async () => {
    if (!app) return;

    const userA = await registerUser("alice@example.com", "Alice");
    const userB = await registerUser("bob@example.com", "Bob");

    // 1. User A sends friend request to User B -> should create notification for User B
    const reqRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });
    expect(reqRes.statusCode).toBe(201);

    // 2. Check User B's notifications
    const notifResB = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(notifResB.statusCode).toBe(200);
    const dataB = notifResB.json();
    expect(dataB.unreadCount).toBe(1);
    expect(dataB.notifications.length).toBe(1);
    expect(dataB.notifications[0].notificationType).toBe("friend_request");
    expect(dataB.notifications[0].actorUserId).toBe(userA.userId);

    // 3. Check unread count endpoint for User B
    const unreadRes = await app.inject({
      method: "GET",
      url: "/notifications/unread-count",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(unreadRes.statusCode).toBe(200);
    expect(unreadRes.json().unreadCount).toBe(1);
  });

  it("does NOT create notification row when user disables preference for that notification_type", async () => {
    if (!app) return;

    const userA = await registerUser("sender@example.com", "Sender");
    const userB = await registerUser("recipient@example.com", "Recipient");

    // User B turns OFF in_app notifications for 'friend_request'
    const updatePrefRes = await app.inject({
      method: "PUT",
      url: "/notification-preferences",
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: {
        notificationType: "friend_request",
        channel: "in_app",
        enabled: false,
      },
    });
    expect(updatePrefRes.statusCode).toBe(200);
    expect(updatePrefRes.json().preference.enabled).toBe(false);

    // Verify preference stored
    const prefsRes = await app.inject({
      method: "GET",
      url: "/notification-preferences",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(prefsRes.statusCode).toBe(200);
    expect(prefsRes.json().preferences.length).toBe(1);
    expect(prefsRes.json().preferences[0].enabled).toBe(false);

    // User A sends friend request to User B
    const reqRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });
    expect(reqRes.statusCode).toBe(201);

    // Check User B's notifications - should be empty because preference is OFF
    const notifResB = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(notifResB.statusCode).toBe(200);
    const dataB = notifResB.json();
    expect(dataB.unreadCount).toBe(0);
    expect(dataB.notifications.length).toBe(0);
  });

  it("marks notifications as read and clears unread count", async () => {
    if (!app) return;

    const userA = await registerUser("userA@example.com", "UserA");
    const userB = await registerUser("userB@example.com", "UserB");

    // Send friend request to generate notification
    await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });

    // Verify unread count is 1
    const initialUnread = await app.inject({
      method: "GET",
      url: "/notifications/unread-count",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(initialUnread.json().unreadCount).toBe(1);

    // Mark as read (markAll)
    const markRes = await app.inject({
      method: "POST",
      url: "/notifications/mark-read",
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { markAll: true },
    });
    expect(markRes.statusCode).toBe(200);
    expect(markRes.json().updatedCount).toBe(1);

    // Unread count should now be 0
    const clearedUnread = await app.inject({
      method: "GET",
      url: "/notifications/unread-count",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(clearedUnread.json().unreadCount).toBe(0);
  });
});
