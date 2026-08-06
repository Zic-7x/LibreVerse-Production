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
    TRUNCATE friendships, media_variants, media, public_aliases, profiles, sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("M4 friendship & social graph integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in friendship.integration.test.ts as DB is unavailable:", (err as Error).message);
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

  it("handles friend request lifecycle, permissions, block rules, and policy check", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Register User A, User B, User C
    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "usera_friend@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;
    const userIdA = regA.json().user.id;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userb_friend@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;
    const userIdB = regB.json().user.id;

    const regC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userc_friend@example.com", password: "password123" },
    });
    const tokenC = regC.json().accessToken;
    const userIdC = regC.json().user.id;

    // 2. User A sends friend request to User B
    const sendRes1 = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userIdB },
    });
    expect(sendRes1.statusCode).toBe(201);
    const friendshipId = sendRes1.json().id;
    expect(sendRes1.json().status).toBe("pending");
    expect(sendRes1.json().initiatedBy).toBe(userIdA);

    // 3. User A re-sends request -> idempotent response
    const sendRes2 = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userIdB },
    });
    expect(sendRes2.statusCode).toBe(201);
    expect(sendRes2.json().id).toBe(friendshipId);

    // 4. User A attempts to accept own request -> 403
    const selfAcceptRes = await app.inject({
      method: "POST",
      url: `/friends/requests/${friendshipId}/respond`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { action: "accept" },
    });
    expect(selfAcceptRes.statusCode).toBe(403);

    // 5. User C attempts to accept request between A and B -> 403
    const strangerAcceptRes = await app.inject({
      method: "POST",
      url: `/friends/requests/${friendshipId}/respond`,
      headers: { authorization: `Bearer ${tokenC}` },
      payload: { action: "accept" },
    });
    expect(strangerAcceptRes.statusCode).toBe(403);

    // 6. User B fetches incoming pending requests
    const incomingRes = await app.inject({
      method: "GET",
      url: "/friends/requests/incoming",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(incomingRes.statusCode).toBe(200);
    expect(incomingRes.json().length).toBe(1);
    expect(incomingRes.json()[0].friendUserId).toBe(userIdA);

    // 7. User A fetches outgoing pending requests
    const outgoingRes = await app.inject({
      method: "GET",
      url: "/friends/requests/outgoing",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(outgoingRes.statusCode).toBe(200);
    expect(outgoingRes.json().length).toBe(1);
    expect(outgoingRes.json()[0].friendUserId).toBe(userIdB);

    // 8. User B accepts request
    const acceptRes = await app.inject({
      method: "POST",
      url: `/friends/requests/${friendshipId}/respond`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { action: "accept" },
    });
    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.json().status).toBe("accepted");

    // 9. Both see each other in friends list
    const friendsA = await app.inject({
      method: "GET",
      url: "/friends",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(friendsA.statusCode).toBe(200);
    expect(friendsA.json().length).toBe(1);
    expect(friendsA.json()[0].friendUserId).toBe(userIdB);

    const friendsB = await app.inject({
      method: "GET",
      url: "/friends",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(friendsB.statusCode).toBe(200);
    expect(friendsB.json().length).toBe(1);
    expect(friendsB.json()[0].friendUserId).toBe(userIdA);

    // 10. Check interaction policy between A and B
    const policyAB = await app.inject({
      method: "GET",
      url: `/friends/policy/${userIdB}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(policyAB.statusCode).toBe(200);
    expect(policyAB.json()).toEqual({
      canInteract: true,
      areFriends: true,
      isBlocked: false,
    });

    // 11. User B blocks User C
    const blockRes = await app.inject({
      method: "POST",
      url: "/blocks",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { targetUserId: userIdC },
    });
    expect(blockRes.statusCode).toBe(201);
    expect(blockRes.json().status).toBe("blocked");

    // 12. User C tries to send friend request to User B -> 403 FORBIDDEN
    const blockedRequestRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${tokenC}` },
      payload: { targetUserId: userIdB },
    });
    expect(blockedRequestRes.statusCode).toBe(403);

    // 13. Check interaction policy between B and C
    const policyBC = await app.inject({
      method: "GET",
      url: `/friends/policy/${userIdC}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(policyBC.statusCode).toBe(200);
    expect(policyBC.json().canInteract).toBe(false);
    expect(policyBC.json().isBlocked).toBe(true);

    // 14. User B unblocks User C
    const unblockRes = await app.inject({
      method: "DELETE",
      url: `/blocks/${userIdC}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(unblockRes.statusCode).toBe(204);

    // 15. User C sends friend request to User B -> succeeds now
    const unblockedReqRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${tokenC}` },
      payload: { targetUserId: userIdB },
    });
    expect(unblockedReqRes.statusCode).toBe(201);
    expect(unblockedReqRes.json().status).toBe("pending");

    // 16. User B declines User C request
    const declineRes = await app.inject({
      method: "POST",
      url: `/friends/requests/${unblockedReqRes.json().id}/respond`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { action: "decline" },
    });
    expect(declineRes.statusCode).toBe(200);
    expect(declineRes.json().status).toBe("declined");

    // 17. User A unfriends User B
    const unfriendRes = await app.inject({
      method: "DELETE",
      url: `/friends/${friendshipId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(unfriendRes.statusCode).toBe(204);

    // Verify User A friends list is empty
    const friendsAAfter = await app.inject({
      method: "GET",
      url: "/friends",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(friendsAAfter.json().length).toBe(0);
  });
});
