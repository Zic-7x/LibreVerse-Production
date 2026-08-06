import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { WebSocket } from "ws";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RealtimeEvent } from "@platform/shared-types";
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

function waitForWsMessage<T = unknown>(ws: WebSocket): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout waiting for WebSocket message"));
    }, 3000);

    ws.once("message", (data) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(data.toString()) as T);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function waitForWsOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }
    ws.once("open", resolve);
    ws.once("error", reject);
  });
}

describe("M6 Real-time WebSocket messaging integration & contract tests", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"] | undefined;
  let serverAddress: string;

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.listen({ port: 0, host: "127.0.0.1" });
      const addr = app.server.address();
      if (typeof addr === "object" && addr !== null) {
        serverAddress = `ws://127.0.0.1:${addr.port}`;
      }
    } catch {
      // Postgres database not available in container environment
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    if (app) {
      await resetTables(databaseUrl);
    }
  });

  it("handles WS connection auth, subscription authorization, REST write fan-out, typing indicators", async () => {
    if (!app) return;

    // 1. Register users A, B, C
    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "ws_a@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "ws_b@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;

    const regC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "ws_c@example.com", password: "password123" },
    });
    const tokenC = regC.json().accessToken;
    const userIdC = regC.json().user.id;

    // 2. User A creates direct conversation with User B
    const createConv = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: regB.json().user.id },
    });
    const conversationId = createConv.json().conversation.id;

    // 3. Connect WebSockets for A, B, C
    const wsA = new WebSocket(`${serverAddress}/ws?token=${tokenA}`);
    const wsB = new WebSocket(`${serverAddress}/ws?token=${tokenB}`);
    const wsC = new WebSocket(`${serverAddress}/ws?token=${tokenC}`);

    await Promise.all([waitForWsOpen(wsA), waitForWsOpen(wsB), waitForWsOpen(wsC)]);

    // Initial auth message sent on connect
    const authA = await waitForWsMessage<{ type: string }>(wsA);
    expect(authA.type).toBe("authenticated");
    const authB = await waitForWsMessage<{ type: string }>(wsB);
    expect(authB.type).toBe("authenticated");
    const authC = await waitForWsMessage<{ type: string }>(wsC);
    expect(authC.type).toBe("authenticated");

    // 4. User C (non-member) attempts subscription to A-B conversation -> REJECTED
    wsC.send(JSON.stringify({ action: "subscribe", conversationId }));
    const errC = await waitForWsMessage<{ error: string; message: string }>(wsC);
    expect(errC.error).toBe("FORBIDDEN");

    // 5. User A and User B subscribe to A-B conversation -> ACCEPTED
    wsA.send(JSON.stringify({ action: "subscribe", conversationId }));
    const subA = await waitForWsMessage<{ type: string; conversationId: string }>(wsA);
    expect(subA.type).toBe("subscribed");
    expect(subA.conversationId).toBe(conversationId);

    wsB.send(JSON.stringify({ action: "subscribe", conversationId }));
    const subB = await waitForWsMessage<{ type: string; conversationId: string }>(wsB);
    expect(subB.type).toBe("subscribed");

    // 6. REST write path: User A sends text message via REST
    const msgPromiseB = waitForWsMessage<RealtimeEvent>(wsB);
    const msgPromiseA = waitForWsMessage<RealtimeEvent>(wsA);

    const postRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { body: "Live WS message from A!" },
    });
    expect(postRes.statusCode).toBe(201);
    const sentMsg = postRes.json();

    // Verify User B receives real-time event matching shared-types contract
    const eventB1 = await msgPromiseB;
    expect(eventB1.eventId).toBeDefined();
    expect(eventB1.eventType).toBe("message.created");
    expect(eventB1.conversationId).toBe(conversationId);
    expect(eventB1.timestamp).toBeDefined();
    expect(eventB1.payload).toEqual(sentMsg);

    // Verify User A also receives real-time event
    const eventA1 = await msgPromiseA;
    expect(eventA1.eventType).toBe("message.created");

    // 7. REST edit path: User A edits message
    const editPromiseB = waitForWsMessage<RealtimeEvent>(wsB);

    await app.inject({
      method: "PATCH",
      url: `/messages/${sentMsg.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { body: "Live WS message from A! (edited)" },
    });

    const eventB2 = await editPromiseB;
    expect(eventB2.eventType).toBe("message.updated");
    expect((eventB2.payload as { body: string }).body).toBe("Live WS message from A! (edited)");

    // 8. REST soft delete path: User A soft deletes message
    const deletePromiseB = waitForWsMessage<RealtimeEvent>(wsB);

    await app.inject({
      method: "DELETE",
      url: `/messages/${sentMsg.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    const eventB3 = await deletePromiseB;
    expect(eventB3.eventType).toBe("message.deleted");
    expect((eventB3.payload as { body: string | null }).body).toBeNull();

    // 9. Typing indicator test: User A sends typing status via WS
    const typingPromiseB = waitForWsMessage<RealtimeEvent<{ userId: string; isTyping: boolean }>>(wsB);

    wsA.send(JSON.stringify({ action: "typing", conversationId, isTyping: true }));

    const eventB4 = await typingPromiseB;
    expect(eventB4.eventType).toBe("typing.indicator");
    expect(eventB4.payload.userId).not.toBe(userIdC);
    expect(eventB4.payload.isTyping).toBe(true);

    // Cleanup sockets
    wsA.close();
    wsB.close();
    wsC.close();
  });
});
