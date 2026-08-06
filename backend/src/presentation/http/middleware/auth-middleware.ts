import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccessTokenService } from "../../../application/interfaces/auth.js";
import { ApplicationError } from "../../../application/errors/application-error.js";
import { canAuthenticate, isBlockedStatus } from "../../../domain/entities/auth-entities.js";
import type { UserRepository } from "../../../application/interfaces/auth.js";
import type { AuthenticatedRequest } from "../auth-http.js";

export function createAuthMiddleware(
  accessTokens: AccessTokenService,
  users: UserRepository,
) {
  return async function authMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new ApplicationError("UNAUTHORIZED", "Missing bearer token");
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = await accessTokens.verify(token);

    const user = await users.findById(payload.userId);
    if (!user || !canAuthenticate(user) || isBlockedStatus(user.status)) {
      throw new ApplicationError("FORBIDDEN", "Account is not allowed to access this resource");
    }

    (request as AuthenticatedRequest).auth = {
      userId: payload.userId,
      sessionId: payload.sessionId,
    };
  };
}

export function registerAuthErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApplicationError) {
      const status =
        error.code === "VALIDATION_ERROR"
          ? 400
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "NOT_FOUND"
              ? 404
              : error.code === "CONFLICT"
                ? 409
                : 401;
      return reply.code(status).send({ error: error.message, code: error.code });
    }

    reply.log.error(error);
    return reply
      .code(500)
      .send({ error: "Internal server error", code: "INTERNAL_ERROR" });
  });
}
