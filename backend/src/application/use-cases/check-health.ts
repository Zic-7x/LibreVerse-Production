import type { HealthResponse } from "@platform/shared-types";
import type { DatabaseProbe } from "../interfaces/database-probe.js";

export class CheckHealthUseCase {
  constructor(private readonly databaseProbe: DatabaseProbe) {}

  async execute(): Promise<HealthResponse> {
    const dbOk = await this.databaseProbe.ping();
    return {
      status: dbOk ? "ok" : "degraded",
      database: dbOk ? "connected" : "disconnected",
    };
  }
}
