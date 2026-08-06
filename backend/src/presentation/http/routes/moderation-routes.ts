import type { FastifyInstance } from "fastify";
import type {
  CreateModerationActionInput,
  UpdateModerationCaseInput,
} from "@platform/shared-types";
import type { ListCasesFilter } from "../../../application/interfaces/moderation.js";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  ExecuteModerationActionUseCase,
  GetModerationCaseByIdUseCase,
  ListModerationCasesUseCase,
  RevokeSanctionUseCase,
  UpdateModerationCaseUseCase,
} from "../../../application/use-cases/moderation/moderation-use-cases.js";
import {
  toSharedModerationAction,
  toSharedModerationCase,
  toSharedUserSanction,
} from "../../../domain/entities/moderation-entities.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface ModerationRouteDeps {
  listCases: ListModerationCasesUseCase;
  getCaseById: GetModerationCaseByIdUseCase;
  updateCase: UpdateModerationCaseUseCase;
  executeAction: ExecuteModerationActionUseCase;
  revokeSanction: RevokeSanctionUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerModerationRoutes(
  app: FastifyInstance,
  deps: ModerationRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // List moderation cases
  app.get(
    "/moderation/cases",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const query = request.query as ListCasesFilter;

      return handleUseCase(reply, async () => {
        const cases = await deps.listCases.execute(auth.userId, query);
        return { cases: cases.map(toSharedModerationCase) };
      });
    },
  );

  // Get single case details & action audit log
  app.get(
    "/moderation/cases/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const res = await deps.getCaseById.execute(auth.userId, id);
        return {
          case: toSharedModerationCase(res.case),
          actions: res.actions.map(toSharedModerationAction),
        };
      });
    },
  );

  // Update moderation case
  app.patch(
    "/moderation/cases/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateModerationCaseInput;

      return handleUseCase(reply, async () => {
        const updated = await deps.updateCase.execute(auth.userId, id, body);
        return { case: toSharedModerationCase(updated) };
      });
    },
  );

  // Execute moderation action on case
  app.post(
    "/moderation/cases/:id/actions",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as CreateModerationActionInput;

      return handleUseCase(
        reply,
        async () => {
          const res = await deps.executeAction.execute(auth.userId, id, body);
          return {
            action: toSharedModerationAction(res.action),
            sanction: res.sanction ? toSharedUserSanction(res.sanction) : undefined,
          };
        },
        201,
      );
    },
  );

  // Revoke user sanction
  app.post(
    "/moderation/sanctions/:id/revoke",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const sanction = await deps.revokeSanction.execute(auth.userId, id);
        return { sanction: toSharedUserSanction(sanction) };
      });
    },
  );
}
