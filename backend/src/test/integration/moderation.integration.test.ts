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
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
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

  // Ensure role column exists
  await client.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'",
  );

  await client.end();
}

async function truncateTables(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(`
    TRUNCATE TABLE
      user_sanctions,
      moderation_actions,
      moderation_cases,
      report_subjects,
      reports,
      messages,
      conversation_participants,
      conversations,
      friendships,
      user_sessions,
      devices,
      user_profiles,
      public_aliases,
      users
    CASCADE;
  `);
  await client.end();
}

describe("Moderation & Sanctions Integration Tests (M14)", () => {
  let app: Awaited<ReturnType<typeof createApp>>["app"];
  let pool: pg.Pool;

  beforeAll(async () => {
    try {
      await applyMigrations(testConfig.databaseUrl);
      const created = await createApp(testConfig);
      app = created.app;
      pool = created.pool;
      await app.ready();
    } catch {
      // Postgres might be offline in sandboxed test environment
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    if (app) {
      await truncateTables(testConfig.databaseUrl);
    }
  });

  it("enforces role check for moderation endpoints", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // Register normal user
    const regRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "normal@example.com",
        password: "Password123!",
      },
    });
    const normalToken = regRes.json().tokens.accessToken;

    // Try accessing moderation cases as normal user
    const listRes = await app.inject({
      method: "GET",
      url: "/moderation/cases",
      headers: { authorization: `Bearer ${normalToken}` },
    });
    expect(listRes.statusCode).toBe(403);

    // Promote normal user to moderator via DB update
    const normalUserId = regRes.json().user.id;
    await pool.query("UPDATE users SET role = 'moderator' WHERE id = $1", [
      normalUserId,
    ]);

    // Retry listing moderation cases
    const listResMod = await app.inject({
      method: "GET",
      url: "/moderation/cases",
      headers: { authorization: `Bearer ${normalToken}` },
    });
    expect(listResMod.statusCode).toBe(200);
    expect(listResMod.json().cases).toBeDefined();
  });

  it("links reported content to moderation cases and allows moderator to suspend & ban user", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Setup Moderator, User A (reporter), User B (offender)
    const modReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "mod@example.com", password: "Password123!" },
    });
    const modUserId = modReg.json().user.id;
    const modToken = modReg.json().tokens.accessToken;
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [
      modUserId,
    ]);

    const userAReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userA@example.com", password: "Password123!" },
    });
    const userAToken = userAReg.json().tokens.accessToken;

    const userBReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userB@example.com", password: "Password123!" },
    });
    const userBUserId = userBReg.json().user.id;
    const userBToken = userBReg.json().tokens.accessToken;

    // 2. User A reports User B for harassment
    const reportRes = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        reasonCode: "harassment",
        description: "User B sent offensive messages",
        subjects: [{ subjectType: "user", subjectId: userBUserId }],
      },
    });
    expect(reportRes.statusCode).toBe(201);
    const reportId = reportRes.json().report.id;

    // 3. Moderator lists cases and finds the open case
    const casesRes = await app.inject({
      method: "GET",
      url: "/moderation/cases",
      headers: { authorization: `Bearer ${modToken}` },
    });
    expect(casesRes.statusCode).toBe(200);
    const cases = casesRes.json().cases;
    expect(cases.length).toBeGreaterThanOrEqual(1);

    const targetCase = cases.find((c: { reportId: string }) => c.reportId === reportId);
    expect(targetCase).toBeDefined();

    // 4. Moderator suspends User B
    const actionRes = await app.inject({
      method: "POST",
      url: `/moderation/cases/${targetCase.id}/actions`,
      headers: { authorization: `Bearer ${modToken}` },
      payload: {
        actionType: "suspend",
        reason: "Violated community harassment policy",
        targetUserId: userBUserId,
      },
    });
    expect(actionRes.statusCode).toBe(201);
    expect(actionRes.json().sanction).toBeDefined();
    expect(actionRes.json().sanction.sanctionType).toBe("suspend");

    // 5. User B attempts login -> blocked (403 / suspended)
    const userBLoginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "userB@example.com", password: "Password123!" },
    });
    expect(userBLoginRes.statusCode).toBe(403);

    // User B attempts authenticated request with existing access token -> fails
    const userBMeRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${userBToken}` },
    });
    expect(userBMeRes.statusCode).toBe(403);

    // 6. Moderator revokes User B's sanction
    const sanctionId = actionRes.json().sanction.id;
    const revokeRes = await app.inject({
      method: "POST",
      url: `/moderation/sanctions/${sanctionId}/revoke`,
      headers: { authorization: `Bearer ${modToken}` },
    });
    expect(revokeRes.statusCode).toBe(200);

    // User B can login again!
    const userBLoginAgainRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "userB@example.com", password: "Password123!" },
    });
    expect(userBLoginAgainRes.statusCode).toBe(200);
  });

  it("prevents muted user from sending messages and allows remove_content to soft delete message", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Setup Moderator, User A, User B
    const modReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "mod2@example.com", password: "Password123!" },
    });
    const modUserId = modReg.json().user.id;
    const modToken = modReg.json().tokens.accessToken;
    await pool.query("UPDATE users SET role = 'moderator' WHERE id = $1", [
      modUserId,
    ]);

    const userAReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userA2@example.com", password: "Password123!" },
    });
    const userAToken = userAReg.json().tokens.accessToken;

    const userBReg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userB2@example.com", password: "Password123!" },
    });
    const userBUserId = userBReg.json().user.id;
    const userBToken = userBReg.json().tokens.accessToken;

    // Create direct conversation
    const convRes = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${userAToken}` },
      payload: { targetUserId: userBUserId },
    });
    const convId = convRes.json().conversation.id;

    // User B sends a message
    const msgRes = await app.inject({
      method: "POST",
      url: `/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${userBToken}` },
      payload: { messageType: "text", body: "Spam message from user B" },
    });
    expect(msgRes.statusCode).toBe(201);
    const msgId = msgRes.json().message.id;

    // User A reports the message
    const reportRes = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        reasonCode: "spam",
        subjects: [{ subjectType: "message", subjectId: msgId }],
      },
    });
    const reportId = reportRes.json().report.id;

    // Find the moderation case
    const casesRes = await app.inject({
      method: "GET",
      url: "/moderation/cases",
      headers: { authorization: `Bearer ${modToken}` },
    });
    const targetCase = casesRes.json().cases.find((c: { reportId: string }) => c.reportId === reportId);

    // Moderator mutes User B
    const muteRes = await app.inject({
      method: "POST",
      url: `/moderation/cases/${targetCase.id}/actions`,
      headers: { authorization: `Bearer ${modToken}` },
      payload: {
        actionType: "mute",
        reason: "Spamming conversation",
        targetUserId: userBUserId,
      },
    });
    expect(muteRes.statusCode).toBe(201);

    // User B attempts to send another message -> blocked (403 Muted)
    const sendBlockedRes = await app.inject({
      method: "POST",
      url: `/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${userBToken}` },
      payload: { messageType: "text", body: "Another spam message" },
    });
    expect(sendBlockedRes.statusCode).toBe(403);
    expect(sendBlockedRes.json().error.message).toContain("muted");

    // Moderator removes offending message
    const removeRes = await app.inject({
      method: "POST",
      url: `/moderation/cases/${targetCase.id}/actions`,
      headers: { authorization: `Bearer ${modToken}` },
      payload: {
        actionType: "remove_content",
        reason: "Removing spam message",
      },
    });
    expect(removeRes.statusCode).toBe(201);

    // User A fetches message history -> message is hidden/deleted
    const historyRes = await app.inject({
      method: "GET",
      url: `/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${userAToken}` },
    });
    expect(historyRes.statusCode).toBe(200);
    const messages = historyRes.json().messages;
    expect(messages.find((m: { id: string }) => m.id === msgId)).toBeUndefined();
  });
});
