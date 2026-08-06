import { describe, expect, it, vi } from "vitest";
import { CheckHealthUseCase } from "./check-health.js";
import type { DatabaseProbe } from "../interfaces/database-probe.js";

describe("CheckHealthUseCase", () => {
  it("returns ok when database responds", async () => {
    const probe: DatabaseProbe = { ping: vi.fn(async () => true) };
    const useCase = new CheckHealthUseCase(probe);
    await expect(useCase.execute()).resolves.toEqual({
      status: "ok",
      database: "connected",
    });
  });

  it("returns degraded when database is down", async () => {
    const probe: DatabaseProbe = { ping: vi.fn(async () => false) };
    const useCase = new CheckHealthUseCase(probe);
    await expect(useCase.execute()).resolves.toEqual({
      status: "degraded",
      database: "disconnected",
    });
  });
});
