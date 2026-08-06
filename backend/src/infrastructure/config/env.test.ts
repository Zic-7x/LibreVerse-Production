import { describe, expect, it } from "vitest";
import { loadConfig } from "./env.js";

describe("loadConfig", () => {
  it("uses default DATABASE_URL fallback when not provided", () => {
    const config = loadConfig({});
    expect(config.databaseUrl).toContain("postgresql://");
  });

  it("parses PORT", () => {
    const config = loadConfig({
      DATABASE_URL: "postgresql://localhost/db",
      PORT: "4000",
    });
    expect(config.port).toBe(4000);
  });

  it("uses dev jwt secret outside production", () => {
    const config = loadConfig({
      DATABASE_URL: "postgresql://localhost/db",
      NODE_ENV: "development",
    });
    expect(config.jwtSecret).toBeTruthy();
    expect(config.jwtAccessTtlSeconds).toBe(900);
  });

  it("requires JWT_SECRET in production", () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: "postgresql://localhost/db",
        NODE_ENV: "production",
      }),
    ).toThrow(/JWT_SECRET/);
  });
});
