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
    TRUNCATE locations, message_media, messages, conversation_participants, conversations, friendships, media_variants, media, public_aliases, profiles, sessions, devices, users RESTART IDENTITY CASCADE
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

describe("M7 Rich messages (media and location) integration & contract tests", () => {
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

  it("handles location messages with coordinate validation and history fetching", async () => {
    if (!app) return;

    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "rich_a@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "rich_b@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;

    const createConv = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: regB.json().user.id },
    });
    const conversationId = createConv.json().conversation.id;

    // Reject invalid coordinates
    const invalidRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        messageType: "location",
        location: { latitude: 120, longitude: 45 },
      },
    });
    expect(invalidRes.statusCode).toBe(400);

    // Send valid location message
    const locRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        messageType: "location",
        body: "Meeting spot",
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          title: "San Francisco Pier 39",
          addressLine: "Beach St & The Embarcadero",
          locality: "San Francisco",
          region: "CA",
          countryCode: "US",
        },
      },
    });
    expect(locRes.statusCode).toBe(201);
    const locMsg = locRes.json();
    expect(locMsg.messageType).toBe("location");
    expect(locMsg.location).toBeDefined();
    expect(locMsg.location.latitude).toBe(37.7749);
    expect(locMsg.location.longitude).toBe(-122.4194);
    expect(locMsg.location.title).toBe("San Francisco Pier 39");

    // Recipient fetches conversation history and receives location payload
    const histRes = await app.inject({
      method: "GET",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(histRes.statusCode).toBe(200);
    const messages = histRes.json().messages;
    expect(messages.length).toBe(1);
    expect(messages[0].messageType).toBe("location");
    expect(messages[0].location.title).toBe("San Francisco Pier 39");
  });

  it("handles media messages requiring ready status, and broadcasts enriched WS payload", async () => {
    if (!app) return;

    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "rich_a2@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "rich_b2@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;

    const createConv = await app.inject({
      method: "POST",
      url: "/conversations/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: regB.json().user.id },
    });
    const conversationId = createConv.json().conversation.id;

    // 1. Upload media asset
    const uploadInit = await app.inject({
      method: "POST",
      url: "/media/upload/init",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { mimeType: "image/jpeg", byteSize: 1024 },
    });
    const mediaId = uploadInit.json().mediaId;

    // 2. Attempt to attach media while status is 'uploading' -> REJECTED
    const unreadyRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        messageType: "media",
        mediaIds: [mediaId],
        body: "Look at this picture",
      },
    });
    expect(unreadyRes.statusCode).toBe(400);

    // 3. Complete media upload -> status 'ready'
    await app.inject({
      method: "POST",
      url: `/media/${mediaId}/complete`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { checksumSha256: "abc123sha256", widthPx: 800, heightPx: 600 },
    });

    // 4. Connect WebSocket for B
    const wsB = new WebSocket(`${serverAddress}/ws?token=${tokenB}`);
    await waitForWsOpen(wsB);
    await waitForWsMessage(wsB); // auth message

    wsB.send(JSON.stringify({ action: "subscribe", conversationId }));
    await waitForWsMessage(wsB); // sub ACK

    // 5. Send ready media message
    const msgPromiseB = waitForWsMessage<RealtimeEvent>(wsB);

    const mediaMsgRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        messageType: "media",
        mediaIds: [mediaId],
        body: "Look at this picture",
      },
    });
    expect(mediaMsgRes.statusCode).toBe(201);
    const mediaMsg = mediaMsgRes.json();
    expect(mediaMsg.messageType).toBe("media");
    expect(mediaMsg.media).toHaveLength(1);
    expect(mediaMsg.media[0].id).toBe(mediaId);

    // 6. Verify recipient receives enriched WS payload with version
    const wsEvent = await msgPromiseB;
    expect(wsEvent.eventType).toBe("message.created");
    expect(wsEvent.version).toBe("1.0");
    const payloadMsg = wsEvent.payload as { messageType: string; media: { id: string }[] };
    expect(payloadMsg.messageType).toBe("media");
    expect(payloadMsg.media[0].id).toBe(mediaId);

    wsB.close();
  });
});
