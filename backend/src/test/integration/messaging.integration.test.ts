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

async function resetTables(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(`
    TRUNCATE messages, conversation_participants, conversations, friendships, media_variants, media, public_aliases, profiles, sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("M5 direct messaging REST API integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in messaging.integration.test.ts as DB is unavailable:", (err as Error).message);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (app) {
      await resetTables(databaseUrl);
    }
  });

  it("completes full direct messaging lifecycle, unread counts, editing, soft-deletion, and block rules", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Register User A, User B, User C
    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "msg_a@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "msg_b@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;
    const userIdB = regB.json().user.id;

    const regC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "msg_c@example.com", password: "password123" },
    });
    const tokenC = regC.json().accessToken;
    const userIdC = regC.json().user.id;

    // 2. User A creates direct conversation with User B
    const createConvRes1 = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userIdB },
    });
    expect(createConvRes1.statusCode).toBe(201);
    const conv1 = createConvRes1.json().conversation;
    expect(conv1.conversationType).toBe("direct");
    const conversationId = conv1.id;

    // Re-creating returns the same conversation
    const createConvRes2 = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userIdB },
    });
    expect(createConvRes2.statusCode).toBe(201);
    expect(createConvRes2.json().conversation.id).toBe(conversationId);

    // 3. User A sends message 1 and message 2
    const msgRes1 = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { body: "Hello User B!" },
    });
    expect(msgRes1.statusCode).toBe(201);
    const msg1 = msgRes1.json();
    expect(msg1.body).toBe("Hello User B!");

    const msgRes2 = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { body: "How are you doing?", replyToId: msg1.id },
    });
    expect(msgRes2.statusCode).toBe(201);
    const msg2 = msgRes2.json();
    expect(msg2.replyToId).toBe(msg1.id);

    // 4. User B checks conversation list -> unreadCount = 2
    const listB1 = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(listB1.statusCode).toBe(200);
    expect(listB1.json().length).toBe(1);
    expect(listB1.json()[0].unreadCount).toBe(2);
    expect(listB1.json()[0].lastMessage.body).toBe("How are you doing?");

    // 5. User C attempts to view messages in A-B conversation -> 403 FORBIDDEN
    const strangerGetMsgs = await app.inject({
      method: "GET",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenC}` },
    });
    expect(strangerGetMsgs.statusCode).toBe(403);

    // 6. User B fetches messages in A-B conversation
    const getMsgsB = await app.inject({
      method: "GET",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(getMsgsB.statusCode).toBe(200);
    expect(getMsgsB.json().length).toBe(2);

    // 7. User B marks conversation as read
    const readRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/read`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(readRes.statusCode).toBe(204);

    // User B checks list again -> unreadCount = 0
    const listB2 = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(listB2.json()[0].unreadCount).toBe(0);

    // 8. User A edits message 1
    const editRes = await app.inject({
      method: "PATCH",
      url: `/messages/${msg1.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { body: "Hello User B! (edited)" },
    });
    expect(editRes.statusCode).toBe(200);
    expect(editRes.json().body).toBe("Hello User B! (edited)");
    expect(editRes.json().editedAt).toBeDefined();

    // User B attempts to edit User A's message -> 403
    const forbiddenEdit = await app.inject({
      method: "PATCH",
      url: `/messages/${msg1.id}`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { body: "Hacked!" },
    });
    expect(forbiddenEdit.statusCode).toBe(403);

    // 9. User A soft-deletes message 2
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/messages/${msg2.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.json().body).toBeNull();
    expect(deleteRes.json().deletedAt).toBeDefined();

    // 10. User B mutes conversation
    const muteRes = await app.inject({
      method: "PATCH",
      url: `/conversations/${conversationId}/participants/me`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { isMuted: true },
    });
    expect(muteRes.statusCode).toBe(204);

    // 11. Test block enforcement: User B blocks User C
    await app.inject({
      method: "POST",
      url: "/blocks",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { targetUserId: userIdC },
    });

    // User C attempts to start direct conversation with User B -> 403 FORBIDDEN
    const blockedConvRes = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenC}` },
      payload: { targetUserId: userIdB },
    });
    expect(blockedConvRes.statusCode).toBe(403);
  });
});
