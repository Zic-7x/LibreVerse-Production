import type { FastifyInstance } from "fastify";
import type { CreateReportInput } from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  GetReportByIdUseCase,
  ListUserReportsUseCase,
  SubmitReportUseCase,
} from "../../../application/use-cases/report/report-use-cases.js";
import { toSharedReport } from "../../../domain/entities/report-entities.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface ReportRouteDeps {
  submitReport: SubmitReportUseCase;
  getReportById: GetReportByIdUseCase;
  listUserReports: ListUserReportsUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerReportRoutes(
  app: FastifyInstance,
  deps: ReportRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Submit report
  app.post(
    "/reports",
    {
      preHandler: authMiddleware,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as CreateReportInput;

      return handleUseCase(
        reply,
        async () => {
          const report = await deps.submitReport.execute(auth.userId, body);
          return { report: toSharedReport(report) };
        },
        201,
      );
    },
  );

  // List user's reports
  app.get(
    "/reports",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, async () => {
        const reports = await deps.listUserReports.execute(auth.userId);
        return { reports: reports.map(toSharedReport) };
      });
    },
  );

  // Get single report status
  app.get(
    "/reports/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const report = await deps.getReportById.execute(auth.userId, id);
        return { report: toSharedReport(report) };
      });
    },
  );
}
