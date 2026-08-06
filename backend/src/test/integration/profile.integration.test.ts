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
    TRUNCATE public_aliases, profiles, sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("profile & public alias integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in profile.integration.test.ts as DB is unavailable:", (err as Error).message);
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

  it("creates profile and allows owner CRUD and public alias management", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    // 1. Register User A
    const regResA = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "usera@example.com", password: "password123" },
    });
    expect(regResA.statusCode).toBe(201);
    const bodyA = regResA.json();
    const tokenA = bodyA.accessToken;
    const userIdA = bodyA.user.id;

    // 2. Fetch User A profile
    const profileResA = await app.inject({
      method: "GET",
      url: "/profiles/me",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(profileResA.statusCode).toBe(200);
    const profileBodyA = profileResA.json();
    expect(profileBodyA.profile.displayName).toBe("usera");
    expect(profileBodyA.profile.avatarMediaId).toBeNull();
    expect(profileBodyA.primaryAlias).toBeNull();

    // 3. Update User A profile
    const updateResA = await app.inject({
      method: "PATCH",
      url: "/profiles/me",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        displayName: "User Alpha",
        bio: "Software Architect",
        timezone: "America/New_York",
      },
    });
    expect(updateResA.statusCode).toBe(200);
    const updatedBodyA = updateResA.json();
    expect(updatedBodyA.profile.displayName).toBe("User Alpha");
    expect(updatedBodyA.profile.bio).toBe("Software Architect");
    expect(updatedBodyA.profile.timezone).toBe("America/New_York");
    expect(updatedBodyA.profile.avatarMediaId).toBeNull();

    // 4. Claim Alias 'alpha_handle'
    const aliasResA = await app.inject({
      method: "POST",
      url: "/profiles/me/alias",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { alias: "alpha_handle" },
    });
    expect(aliasResA.statusCode).toBe(201);
    expect(aliasResA.json().alias).toBe("alpha_handle");
    expect(aliasResA.json().isPrimary).toBe(true);

    // 5. Public read profile by alias
    const publicByAlias = await app.inject({
      method: "GET",
      url: "/profiles/alias/alpha_handle",
    });
    expect(publicByAlias.statusCode).toBe(200);
    expect(publicByAlias.json().profile.displayName).toBe("User Alpha");
    expect(publicByAlias.json().primaryAlias.alias).toBe("alpha_handle");

    // 6. Public read profile by user ID
    const publicById = await app.inject({
      method: "GET",
      url: `/profiles/${userIdA}`,
    });
    expect(publicById.statusCode).toBe(200);
    expect(publicById.json().profile.displayName).toBe("User Alpha");

    // 7. Register User B and try duplicate alias claim (conflict)
    const regResB = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "userb@example.com", password: "password123" },
    });
    const tokenB = regResB.json().accessToken;

    const dupAliasRes = await app.inject({
      method: "POST",
      url: "/profiles/me/alias",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { alias: "alpha_handle" },
    });
    expect(dupAliasRes.statusCode).toBe(409);
    expect(dupAliasRes.json().code).toBe("CONFLICT");

    // 8. Alias format validation
    const invalidAliasRes = await app.inject({
      method: "POST",
      url: "/profiles/me/alias",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { alias: "invalid-handle!" },
    });
    expect(invalidAliasRes.statusCode).toBe(400);
    expect(invalidAliasRes.json().code).toBe("VALIDATION_ERROR");

    // 9. Rename User A alias & verify history
    const renameResA = await app.inject({
      method: "POST",
      url: "/profiles/me/alias",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { alias: "alpha_v2" },
    });
    expect(renameResA.statusCode).toBe(201);
    expect(renameResA.json().alias).toBe("alpha_v2");

    const historyResA = await app.inject({
      method: "GET",
      url: "/profiles/me/alias/history",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(historyResA.statusCode).toBe(200);
    const historyList = historyResA.json();
    expect(historyList.length).toBe(2);
    // Recent alias is active primary
    expect(historyList[0].alias).toBe("alpha_v2");
    expect(historyList[0].isPrimary).toBe(true);
    expect(historyList[0].activeUntil).toBeNull();
    // Old alias is deactivated
    expect(historyList[1].alias).toBe("alpha_handle");
    expect(historyList[1].isPrimary).toBe(false);
    expect(historyList[1].activeUntil).not.toBeNull();
  });
});
