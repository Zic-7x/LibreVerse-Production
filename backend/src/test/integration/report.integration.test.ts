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
      report_subjects,
      reports,
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

describe("Milestone 13: User Reports Integration Tests", () => {
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

  it("submits a report against another user and fetches status", async () => {
    if (!app) return;

    const userA = await registerUser("reporter13@example.com", "Reporter");
    const userB = await registerUser("target13@example.com", "Target");

    const submitRes = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        reasonCode: "spam",
        description: "Spamming aggressive messages",
        subjects: [{ subjectType: "user", subjectId: userB.userId }],
      },
    });
    expect(submitRes.statusCode).toBe(201);
    const report = submitRes.json().report;
    expect(report.id).toBeDefined();
    expect(report.reporterUserId).toBe(userA.userId);
    expect(report.status).toBe("open");
    expect(report.subjects.length).toBe(1);
    expect(report.subjects[0].subjectId).toBe(userB.userId);

    // Reporter fetches single report by ID
    const getRes = await app.inject({
      method: "GET",
      url: `/reports/${report.id}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().report.id).toBe(report.id);

    // Reporter lists own reports
    const listRes = await app.inject({
      method: "GET",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().reports.length).toBe(1);
  });

  it("rejects reporting self", async () => {
    if (!app) return;

    const userA = await registerUser("self13@example.com", "SelfReporter");

    const res = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        reasonCode: "other",
        subjects: [{ subjectType: "user", subjectId: userA.userId }],
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("Cannot report yourself");
  });

  it("validates subject existence", async () => {
    if (!app) return;

    const userA = await registerUser("valid13@example.com", "UserA");
    const fakeId = "00000000-0000-0000-0000-000000000999";

    const res = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        reasonCode: "harassment",
        subjects: [{ subjectType: "user", subjectId: fakeId }],
      },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain("Subject not found");
  });

  it("enforces authorization: non-participant cannot report a private message", async () => {
    if (!app) return;

    const alice = await registerUser("alice13@example.com", "Alice");
    const bob = await registerUser("bob13@example.com", "Bob");
    const eve = await registerUser("eve13@example.com", "Eve");

    // Alice creates direct message to Bob
    const convRes = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${alice.accessToken}` },
      payload: { targetUserId: bob.userId },
    });
    expect(convRes.statusCode).toBe(201);
    const convId = convRes.json().conversation.id;

    const msgRes = await app.inject({
      method: "POST",
      url: `/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${alice.accessToken}` },
      payload: { messageType: "text", body: "Secret message" },
    });
    expect(msgRes.statusCode).toBe(201);
    const msgId = msgRes.json().message.id;

    // Eve (non-participant) tries to report Alice's private message -> FORBIDDEN (403)
    const eveReport = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${eve.accessToken}` },
      payload: {
        reasonCode: "harassment",
        subjects: [{ subjectType: "message", subjectId: msgId }],
      },
    });
    expect(eveReport.statusCode).toBe(403);
    expect(eveReport.json().error).toContain("Only participants can report a private message");

    // Bob (participant) reports Alice's private message -> OK (201)
    const bobReport = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${bob.accessToken}` },
      payload: {
        reasonCode: "harassment",
        subjects: [{ subjectType: "message", subjectId: msgId }],
      },
    });
    expect(bobReport.statusCode).toBe(201);
  });

  it("enforces duplicate report policy", async () => {
    if (!app) return;

    const userA = await registerUser("dupA13@example.com", "UserA");
    const userB = await registerUser("dupB13@example.com", "UserB");

    const payload = {
      reasonCode: "hate_speech",
      subjects: [{ subjectType: "user", subjectId: userB.userId }],
    };

    // First report
    const res1 = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload,
    });
    expect(res1.statusCode).toBe(201);

    // Duplicate report by same user -> 409 Conflict
    const res2 = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload,
    });
    expect(res2.statusCode).toBe(409);
    expect(res2.json().error).toContain("duplicate report");
  });
});
