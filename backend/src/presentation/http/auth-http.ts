import type { FastifyReply, FastifyRequest } from "fastify";
import { ApplicationError } from "../../application/errors/application-error.js";

const STATUS_BY_CODE: Record<
  ApplicationError["code"],
  number
> = {
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
  TOKEN_INVALID: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  STORAGE_UNAVAILABLE: 503,
};

export function mapApplicationError(error: unknown): {
  statusCode: number;
  body: { error: string; code: string };
} {
  if (error instanceof ApplicationError) {
    return {
      statusCode: STATUS_BY_CODE[error.code] ?? 400,
      body: { error: error.message, code: error.code },
    };
  }

  const msg = error instanceof Error ? error.message : "Internal server error";
  return {
    statusCode: 500,
    body: { error: msg, code: "INTERNAL_ERROR" },
  };
}

export async function handleUseCase<T>(
  reply: FastifyReply,
  run: () => Promise<T>,
  successStatus = 200,
): Promise<T | FastifyReply> {
  try {
    const result = await run();
    return reply.code(successStatus).send(result);
  } catch (error) {
    const mapped = mapApplicationError(error);
    return reply.code(mapped.statusCode).send(mapped.body);
  }
}

export function sessionContext(request: FastifyRequest) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.headers["user-agent"] ?? null,
  };
}

export interface AuthenticatedRequest extends FastifyRequest {
  auth: {
    userId: string;
    sessionId: string;
  };
}
