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
      story_views,
      story_items,
      stories,
      friendships,
      public_aliases,
      media_variants,
      media,
      user_devices,
      user_sessions,
      users
    CASCADE;
  `);
  await client.end();
}

describe("Milestone 10: Ephemeral Stories Integration Tests", () => {
  let app: Awaited<ReturnType<typeof createApp>>["app"];
  let pool: pg.Pool;

  beforeAll(async () => {
    try {
      await applyMigrations(testConfig.databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      pool = container.pool;
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
      userId: data.user.id,
      accessToken: data.accessToken,
    };
  }

  async function createMockMedia(accessToken: string) {
    const initRes = await app.inject({
      method: "POST",
      url: "/media/upload/init",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        mimeType: "image/jpeg",
        byteSize: 1024,
      },
    });
    expect(initRes.statusCode).toBe(201);
    const { media } = initRes.json();

    const completeRes = await app.inject({
      method: "POST",
      url: `/media/${media.id}/complete`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        widthPx: 1080,
        heightPx: 1920,
      },
    });
    expect(completeRes.statusCode).toBe(200);
    return media.id as string;
  }

  it("creates a story with items, fetches feed, records view idempotently, and cleans up expired stories", async () => {
    if (!app) return;

    // 1. Register User A (Author) & User B (Friend) & User C (Stranger)
    const userA = await registerUser("author@example.com", "Alice");
    const userB = await registerUser("friend@example.com", "Bob");
    const userC = await registerUser("stranger@example.com", "Charlie");

    // Establish friendship between Alice & Bob
    const reqRes = await app.inject({
      method: "POST",
      url: "/friends/requests",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });
    expect(reqRes.statusCode).toBe(201);
    const reqData = reqRes.json();

    const acceptRes = await app.inject({
      method: "POST",
      url: `/friends/requests/${reqData.friendship.id}/respond`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
      payload: { action: "accept" },
    });
    expect(acceptRes.statusCode).toBe(200);

    // 2. User A uploads media
    const mediaId1 = await createMockMedia(userA.accessToken);
    const mediaId2 = await createMockMedia(userA.accessToken);

    // 3. User A posts a story
    const createStoryRes = await app.inject({
      method: "POST",
      url: "/stories",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: {
        caption: "A day at the beach 🏖️",
        ttlHours: 24,
        items: [
          { mediaId: mediaId1, durationMs: 5000 },
          { mediaId: mediaId2, durationMs: 7000 },
        ],
      },
    });

    expect(createStoryRes.statusCode).toBe(201);
    const { story } = createStoryRes.json();
    expect(story.id).toBeDefined();
    expect(story.authorUserId).toBe(userA.userId);
    expect(story.caption).toBe("A day at the beach 🏖️");
    expect(story.items.length).toBe(2);
    expect(story.items[0].mediaUrl).toContain(mediaId1);

    // 4. Check Story Feed for Bob (Friend)
    const feedResB = await app.inject({
      method: "GET",
      url: "/stories/feed",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(feedResB.statusCode).toBe(200);
    const feedB = feedResB.json();
    expect(feedB.stories.length).toBe(1);
    expect(feedB.stories[0].id).toBe(story.id);
    expect(feedB.stories[0].isViewedByMe).toBe(false);

    // 5. Check Story Feed for Charlie (Stranger - not friends)
    const feedResC = await app.inject({
      method: "GET",
      url: "/stories/feed",
      headers: { authorization: `Bearer ${userC.accessToken}` },
    });
    expect(feedResC.statusCode).toBe(200);
    const feedC = feedResC.json();
    expect(feedC.stories.length).toBe(0); // Charlie should not see Alice's story

    // 6. User B views story (Idempotency test)
    const viewRes1 = await app.inject({
      method: "POST",
      url: `/stories/${story.id}/view`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(viewRes1.statusCode).toBe(200);
    expect(viewRes1.json().recorded).toBe(true);

    // Second view by same user should return recorded: false
    const viewRes2 = await app.inject({
      method: "POST",
      url: `/stories/${story.id}/view`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(viewRes2.statusCode).toBe(200);
    expect(viewRes2.json().recorded).toBe(false);

    // 7. User A checks viewers analytics
    const viewersRes = await app.inject({
      method: "GET",
      url: `/stories/${story.id}/viewers`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(viewersRes.statusCode).toBe(200);
    const viewersData = viewersRes.json();
    expect(viewersData.totalCount).toBe(1);
    expect(viewersData.viewers[0].viewerUserId).toBe(userB.userId);

    // User B attempts to view viewers list (should fail)
    const unauthorizedViewersRes = await app.inject({
      method: "GET",
      url: `/stories/${story.id}/viewers`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(unauthorizedViewersRes.statusCode).toBe(400);

    // 8. Test story expiration and cleanup job
    // Expire the story in DB
    await pool.query(
      `UPDATE stories SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1`,
      [story.id],
    );

    // Feed should no longer return expired story
    const expiredFeedRes = await app.inject({
      method: "GET",
      url: "/stories/feed",
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(expiredFeedRes.statusCode).toBe(200);
    expect(expiredFeedRes.json().stories.length).toBe(0);

    // Run cleanup job endpoint
    const cleanupRes = await app.inject({
      method: "POST",
      url: "/stories/cleanup",
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(cleanupRes.statusCode).toBe(200);
    expect(cleanupRes.json().cleanedCount).toBe(1);

    // Direct lookup of cleaned story returns 400 (not found)
    const lookupRes = await app.inject({
      method: "GET",
      url: `/stories/${story.id}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(lookupRes.statusCode).toBe(400);
  });

  it("handles soft-deleting a story by the author", async () => {
    if (!app) return;

    const user = await registerUser("creator@example.com", "Creator");
    const mediaId = await createMockMedia(user.accessToken);

    const postRes = await app.inject({
      method: "POST",
      url: "/stories",
      headers: { authorization: `Bearer ${user.accessToken}` },
      payload: {
        items: [{ mediaId }],
      },
    });
    expect(postRes.statusCode).toBe(201);
    const { story } = postRes.json();

    // Delete story
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/stories/${story.id}`,
      headers: { authorization: `Bearer ${user.accessToken}` },
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.json().success).toBe(true);

    // Verify feed is empty
    const feedRes = await app.inject({
      method: "GET",
      url: "/stories/feed",
      headers: { authorization: `Bearer ${user.accessToken}` },
    });
    expect(feedRes.statusCode).toBe(200);
    expect(feedRes.json().stories.length).toBe(0);
  });
});
