import type { FastifyInstance } from "fastify";
import { CheckHealthUseCase } from "../../../application/use-cases/check-health.js";

export function registerHealthRoutes(
  app: FastifyInstance,
  checkHealth: CheckHealthUseCase,
): void {
  app.get("/health", async (_request, reply) => {
    const body = await checkHealth.execute();
    const statusCode = body.status === "ok" ? 200 : 503;
    return reply.code(statusCode).send(body);
  });

  app.get("/ready", async (_request, reply) => {
    const body = await checkHealth.execute();
    const statusCode = body.status === "ok" ? 200 : 503;
    return reply.code(statusCode).send(body);
  });
}
