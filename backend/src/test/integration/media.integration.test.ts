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
    TRUNCATE media_variants, media, public_aliases, profiles, sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("M3 media upload pipeline & avatar integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in media.integration.test.ts as DB is unavailable:", (err as Error).message);
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

  it("completes full upload pipeline, handles variants, permissions, and profile avatar link", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Register User A and User B
    const regA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "media_a@example.com", password: "password123" },
    });
    const tokenA = regA.json().accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "media_b@example.com", password: "password123" },
    });
    const tokenB = regB.json().accessToken;

    // 2. User A initializes upload
    const initRes = await app.inject({
      method: "POST",
      url: "/media/upload/init",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { mimeType: "image/png", byteSize: 2048576 },
    });
    expect(initRes.statusCode).toBe(201);
    const initBody = initRes.json();
    expect(initBody.mediaId).toBeDefined();
    expect(initBody.storageKey).toContain("uploads/");
    const mediaId = initBody.mediaId;

    // 3. User B attempts to complete User A's upload -> 403 FORBIDDEN
    const forbiddenRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/complete`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { widthPx: 1024, heightPx: 768 },
    });
    expect(forbiddenRes.statusCode).toBe(403);

    // 4. User A completes upload -> status ready + auto-generated thumbnail variant
    const completeRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/complete`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        widthPx: 1024,
        heightPx: 768,
        checksumSha256: "a".repeat(64),
      },
    });
    expect(completeRes.statusCode).toBe(200);
    const completeBody = completeRes.json();
    expect(completeBody.media.status).toBe("ready");
    expect(completeBody.media.widthPx).toBe(1024);
    expect(completeBody.variants.length).toBe(1);
    expect(completeBody.variants[0].variantType).toBe("thumbnail");

    // 5. User A links media as profile avatar round-trip
    const profileUpdateRes = await app.inject({
      method: "PATCH",
      url: "/profiles/me",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { avatarMediaId: mediaId },
    });
    expect(profileUpdateRes.statusCode).toBe(200);
    expect(profileUpdateRes.json().profile.avatarMediaId).toBe(mediaId);

    // Fetch profile and verify avatarMediaId is present
    const profileGetRes = await app.inject({
      method: "GET",
      url: "/profiles/me",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(profileGetRes.statusCode).toBe(200);
    expect(profileGetRes.json().profile.avatarMediaId).toBe(mediaId);

    // 6. Test content download endpoint
    const contentRes = await app.inject({
      method: "GET",
      url: `/media/${mediaId}/content`,
    });
    expect(contentRes.statusCode).toBe(200);
    expect(contentRes.headers["content-type"]).toBe("image/png");

    // 7. Test failed upload pipeline for a separate upload
    const initFailedRes = await app.inject({
      method: "POST",
      url: "/media/upload/init",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { mimeType: "video/mp4", byteSize: 5000000 },
    });
    const failedMediaId = initFailedRes.json().mediaId;

    const markFailedRes = await app.inject({
      method: "POST",
      url: `/media/${failedMediaId}/failed`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(markFailedRes.statusCode).toBe(200);
    expect(markFailedRes.json().media.status).toBe("failed");

    // 8. Delete media
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/media/${mediaId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Deleted media GET returns 404
    const getDeletedRes = await app.inject({
      method: "GET",
      url: `/media/${mediaId}`,
    });
    expect(getDeletedRes.statusCode).toBe(404);
  });
});
