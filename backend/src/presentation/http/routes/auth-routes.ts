import type { FastifyInstance } from "fastify";
import type { DevicePlatform } from "@platform/shared-types";
import {
  GetAuthenticatedUserUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  RegisterDeviceUseCase,
  RegisterUserUseCase,
  RevokeAllSessionsUseCase,
  RevokeSessionUseCase,
} from "../../../application/use-cases/auth/auth-use-cases.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import {
  handleUseCase,
  sessionContext,
  type AuthenticatedRequest,
} from "../auth-http.js";
import type { AccessTokenService, UserRepository } from "../../../application/interfaces/auth.js";

export interface AuthRouteDeps {
  registerUser: RegisterUserUseCase;
  login: LoginUseCase;
  refreshSession: RefreshSessionUseCase;
  logout: LogoutUseCase;
  revokeSession: RevokeSessionUseCase;
  revokeAllSessions: RevokeAllSessionsUseCase;
  registerDevice: RegisterDeviceUseCase;
  getAuthenticatedUser: GetAuthenticatedUserUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

function mapDeviceInput(body: Record<string, unknown> | undefined) {
  if (!body?.device || typeof body.device !== "object") {
    return undefined;
  }

  const device = body.device as Record<string, unknown>;
  return {
    platform: device.platform as DevicePlatform | undefined,
    deviceName: device.deviceName as string | undefined,
    pushToken: device.pushToken as string | undefined,
    appVersion: device.appVersion as string | undefined,
    osVersion: device.osVersion as string | undefined,
  };
}

export function registerAuthRoutes(
  app: FastifyInstance,
  deps: AuthRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  app.post(
    "/auth/register",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = request.body as {
        email?: string;
        phone?: string;
        password?: string;
        device?: Record<string, unknown>;
      };

      return handleUseCase(reply, async () =>
        deps.registerUser.execute({
          email: body.email,
          phone: body.phone,
          password: body.password ?? "",
          device: mapDeviceInput(body),
          context: sessionContext(request),
        }),
      201);
    },
  );

  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = request.body as {
        email?: string;
        phone?: string;
        password?: string;
        device?: Record<string, unknown>;
      };

      return handleUseCase(reply, () =>
        deps.login.execute({
          email: body.email,
          phone: body.phone,
          password: body.password ?? "",
          device: mapDeviceInput(body),
          context: sessionContext(request),
        }),
      );
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    const body = request.body as { refreshToken?: string };

    return handleUseCase(reply, () =>
      deps.refreshSession.execute({
        refreshToken: body.refreshToken ?? "",
        context: sessionContext(request),
      }),
    );
  });

  app.post("/auth/logout", async (request, reply) => {
    const body = request.body as { refreshToken?: string };

    return handleUseCase(reply, async () => {
      await deps.logout.execute(body.refreshToken ?? "");
      return { ok: true };
    });
  });

  app.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, () =>
        deps.getAuthenticatedUser.execute(auth.userId),
      );
    },
  );

  app.delete(
    "/auth/sessions/:sessionId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { sessionId } = request.params as { sessionId: string };

      return handleUseCase(reply, async () => {
        await deps.revokeSession.execute(auth.userId, sessionId);
        return { ok: true };
      });
    },
  );

  app.delete(
    "/auth/sessions",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;

      return handleUseCase(reply, async () => {
        await deps.revokeAllSessions.execute(auth.userId, auth.sessionId);
        return { ok: true };
      });
    },
  );

  app.post(
    "/auth/devices",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body as {
        platform?: DevicePlatform;
        deviceName?: string;
        pushToken?: string;
        appVersion?: string;
        osVersion?: string;
      };

      return handleUseCase(
        reply,
        async () => {
          const device = await deps.registerDevice.execute({
            userId: auth.userId,
            platform: body.platform,
            deviceName: body.deviceName,
            pushToken: body.pushToken,
            appVersion: body.appVersion,
            osVersion: body.osVersion,
          });

          return {
            id: device.id,
            platform: device.platform,
            deviceName: device.deviceName,
            pushToken: device.pushToken,
            appVersion: device.appVersion,
            osVersion: device.osVersion,
            lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
            createdAt: device.createdAt.toISOString(),
          };
        },
        201,
      );
    },
  );
}
