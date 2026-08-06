import type { FastifyInstance } from "fastify";
import type { UpdateProfileInput } from "@platform/shared-types";
import type { AccessTokenService, UserRepository } from "../../../application/interfaces/auth.js";
import {
  ClaimAliasUseCase,
  GetAliasHistoryUseCase,
  GetProfileByAliasUseCase,
  GetProfileByUserIdUseCase,
  UpdateProfileUseCase,
} from "../../../application/use-cases/profile/profile-use-cases.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";

export interface ProfileRouteDeps {
  getProfileByUserId: GetProfileByUserIdUseCase;
  getProfileByAlias: GetProfileByAliasUseCase;
  updateProfile: UpdateProfileUseCase;
  claimAlias: ClaimAliasUseCase;
  getAliasHistory: GetAliasHistoryUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerProfileRoutes(
  app: FastifyInstance,
  deps: ProfileRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Authenticated user's profile
  app.get(
    "/profiles/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.getProfileByUserId.execute(auth.userId),
      );
    },
  );

  // Update authenticated user's profile
  app.patch(
    "/profiles/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as UpdateProfileInput;

      return handleUseCase(reply, () =>
        deps.updateProfile.execute(auth.userId, body),
      );
    },
  );

  // Claim or rename primary alias
  app.post(
    "/profiles/me/alias",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as { alias?: string };

      return handleUseCase(
        reply,
        () => deps.claimAlias.execute(auth.userId, body.alias ?? ""),
        201,
      );
    },
  );

  // Get alias history for authenticated user
  app.get(
    "/profiles/me/alias/history",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      return handleUseCase(reply, () =>
        deps.getAliasHistory.execute(auth.userId),
      );
    },
  );

  // Get public profile by alias (public route, no auth required)
  app.get("/profiles/alias/:alias", async (request, reply) => {
    const { alias } = request.params as { alias: string };
    return handleUseCase(reply, () => deps.getProfileByAlias.execute(alias));
  });

  // Get public profile by user ID
  app.get("/profiles/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    return handleUseCase(reply, () => deps.getProfileByUserId.execute(userId));
  });
}
