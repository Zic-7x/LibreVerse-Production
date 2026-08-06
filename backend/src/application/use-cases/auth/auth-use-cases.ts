import type {
  AuthUserSummary,
  DevicePlatform,
  LoginResponse,
  RegisterResponse,
} from "@platform/shared-types";
import { UserStatus } from "@platform/shared-types";
import { canAuthenticate, isBlockedStatus } from "../../../domain/entities/auth-entities.js";
import { ApplicationError } from "../../errors/application-error.js";
import type {
  AccessTokenService,
  CreateDeviceInput,
  DeviceRepository,
  PasswordHasher,
  RefreshTokenGenerator,
  SessionContext,
  SessionRepository,
  UserRepository,
} from "../../interfaces/auth.js";
import type { ProfileRepository } from "../../interfaces/profile.js";
import {
  validateLoginIdentifier,
  validateRegistrationInput,
} from "../../validation/auth-validation.js";

export interface RegisterUserInput {
  email?: string;
  phone?: string;
  password: string;
  fullName?: string;
  dob?: string;
  device?: Partial<CreateDeviceInput>;
  context: SessionContext;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly devices: DeviceRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenGenerator,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlSeconds: number,
    private readonly profiles?: ProfileRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterResponse> {
    const validated = validateRegistrationInput(input);

    if (validated.email) {
      const existing = await this.users.findByEmail(validated.email);
      if (existing) {
        throw new ApplicationError("CONFLICT", "Email is already registered");
      }
    }

    if (validated.phoneE164) {
      const existing = await this.users.findByPhone(validated.phoneE164);
      if (existing) {
        throw new ApplicationError("CONFLICT", "Phone is already registered");
      }
    }

    const passwordHash = await this.passwordHasher.hash(validated.password);
    const user = await this.users.create({
      email: validated.email,
      phoneE164: validated.phoneE164,
      passwordHash,
      status: UserStatus.Active,
    });

    if (this.profiles) {
      try {
        const displayName = input.fullName?.trim() || (validated.email ? validated.email.split("@")[0]! : "User");
        await this.profiles.create({
          userId: user.id,
          displayName,
          birthDate: input.dob?.trim() || null,
        });
      } catch (err) {
        console.warn("Could not create profile on registration:", err);
      }
    }

    const deviceId = await this.maybeCreateDevice(user.id, input.device);
    const tokens = await this.createSessionForUser(
      user.id,
      deviceId,
      input.context,
    );

    return {
      user: toUserSummary(user),
      ...tokens,
    };
  }

  private async maybeCreateDevice(
    userId: string,
    device?: Partial<CreateDeviceInput>,
  ): Promise<string | null> {
    if (!device) {
      return null;
    }

    const created = await this.devices.create({
      userId,
      platform: device.platform ?? "unknown",
      deviceName: device.deviceName ?? null,
      pushToken: device.pushToken ?? null,
      appVersion: device.appVersion ?? null,
      osVersion: device.osVersion ?? null,
    });
    return created.id;
  }

  private async createSessionForUser(
    userId: string,
    deviceId: string | null,
    context: SessionContext,
  ): Promise<Omit<RegisterResponse, "user">> {
    const refresh = this.refreshTokens.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    const session = await this.sessions.create({
      userId,
      deviceId,
      refreshTokenHash: refresh.hash,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt,
    });

    const accessToken = await this.accessTokens.sign({
      userId,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.accessTtlSeconds,
      tokenType: "Bearer",
    };
  }
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
  device?: Partial<CreateDeviceInput>;
  context: SessionContext;
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly devices: DeviceRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenGenerator,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlSeconds: number,
  ) {}

  async execute(input: LoginInput): Promise<LoginResponse> {
    const identifier = validateLoginIdentifier(input);
    const user = identifier.email
      ? await this.users.findByEmail(identifier.email)
      : await this.users.findByPhone(identifier.phoneE164!);

    if (!user) {
      throw new ApplicationError("INVALID_CREDENTIALS", "Invalid credentials");
    }

    if (isBlockedStatus(user.status)) {
      throw new ApplicationError("FORBIDDEN", "Account is not allowed to sign in");
    }

    if (!canAuthenticate(user)) {
      throw new ApplicationError("FORBIDDEN", "Account is not active");
    }

    const valid = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new ApplicationError("INVALID_CREDENTIALS", "Invalid credentials");
    }

    await this.users.updateLastLoginAt(user.id, new Date());

    const deviceId = await this.maybeCreateDevice(user.id, input.device);
    const refresh = this.refreshTokens.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    const session = await this.sessions.create({
      userId: user.id,
      deviceId,
      refreshTokenHash: refresh.hash,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      expiresAt,
    });

    const accessToken = await this.accessTokens.sign({
      userId: user.id,
      sessionId: session.id,
    });

    return {
      user: toUserSummary(user),
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.accessTtlSeconds,
      tokenType: "Bearer",
    };
  }

  private async maybeCreateDevice(
    userId: string,
    device?: Partial<CreateDeviceInput>,
  ): Promise<string | null> {
    if (!device) {
      return null;
    }

    const created = await this.devices.create({
      userId,
      platform: device.platform ?? "unknown",
      deviceName: device.deviceName ?? null,
      pushToken: device.pushToken ?? null,
      appVersion: device.appVersion ?? null,
      osVersion: device.osVersion ?? null,
    });
    return created.id;
  }
}

function toUserSummary(user: {
  id: string;
  email: string | null;
  phoneE164: string | null;
  status: AuthUserSummary["status"];
}): AuthUserSummary {
  return {
    id: user.id,
    email: user.email,
    phoneE164: user.phoneE164,
    status: user.status,
  };
}

export interface RefreshSessionInput {
  refreshToken: string;
  context: SessionContext;
}

export class RefreshSessionUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenGenerator,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlSeconds: number,
  ) {}

  async execute(input: RefreshSessionInput): Promise<Omit<LoginResponse, "user">> {
    if (!input.refreshToken?.trim()) {
      throw new ApplicationError("VALIDATION_ERROR", "Refresh token is required");
    }

    const hash = this.refreshTokens.hash(input.refreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (!session || session.revokedAt !== null) {
      throw new ApplicationError("TOKEN_INVALID", "Invalid refresh token");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new ApplicationError("TOKEN_EXPIRED", "Refresh token expired");
    }

    const user = await this.users.findById(session.userId);
    if (!user || !canAuthenticate(user)) {
      throw new ApplicationError("FORBIDDEN", "Account is not allowed to sign in");
    }

    if (isBlockedStatus(user.status)) {
      throw new ApplicationError("FORBIDDEN", "Account is not allowed to sign in");
    }

    await this.sessions.revoke(session.id, new Date());

    const refresh = this.refreshTokens.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    const newSession = await this.sessions.create({
      userId: user.id,
      deviceId: session.deviceId,
      refreshTokenHash: refresh.hash,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      expiresAt,
    });

    const accessToken = await this.accessTokens.sign({
      userId: user.id,
      sessionId: newSession.id,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.accessTtlSeconds,
      tokenType: "Bearer",
    };
  }
}

export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly refreshTokens: RefreshTokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    if (!refreshToken?.trim()) {
      throw new ApplicationError("VALIDATION_ERROR", "Refresh token is required");
    }

    const hash = this.refreshTokens.hash(refreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (!session || session.revokedAt !== null) {
      return;
    }

    await this.sessions.revoke(session.id, new Date());
  }
}

export class RevokeSessionUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new ApplicationError("NOT_FOUND", "Session not found");
    }

    if (session.revokedAt === null) {
      await this.sessions.revoke(sessionId, new Date());
    }
  }
}

export class RevokeAllSessionsUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string, exceptSessionId?: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId, new Date(), exceptSessionId);
  }
}

export interface RegisterDeviceInput {
  userId: string;
  platform?: DevicePlatform;
  deviceName?: string;
  pushToken?: string;
  appVersion?: string;
  osVersion?: string;
}

export class RegisterDeviceUseCase {
  constructor(private readonly devices: DeviceRepository) {}

  async execute(input: RegisterDeviceInput) {
    return this.devices.create({
      userId: input.userId,
      platform: input.platform ?? "unknown",
      deviceName: input.deviceName ?? null,
      pushToken: input.pushToken ?? null,
      appVersion: input.appVersion ?? null,
      osVersion: input.osVersion ?? null,
    });
  }
}

export class GetAuthenticatedUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<AuthUserSummary> {
    const user = await this.users.findById(userId);
    if (!user || !canAuthenticate(user)) {
      throw new ApplicationError("UNAUTHORIZED", "Unauthorized");
    }

    return toUserSummary(user);
  }
}
