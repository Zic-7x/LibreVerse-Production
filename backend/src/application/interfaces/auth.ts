import type { DevicePlatform, UserStatus } from "@platform/shared-types";
import type { Device, Session, User } from "../../domain/entities/auth-entities.js";

export interface CreateUserInput {
  email: string | null;
  phoneE164: string | null;
  passwordHash: string;
  status: UserStatus;
  role?: string;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phoneE164: string): Promise<User | null>;
  updateLastLoginAt(userId: string, at: Date): Promise<void>;
  updateStatus(userId: string, status: UserStatus): Promise<void>;
  updateRole(userId: string, role: string): Promise<void>;
}

export interface CreateSessionInput {
  userId: string;
  deviceId: string | null;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findByRefreshTokenHash(hash: string): Promise<Session | null>;
  findById(id: string): Promise<Session | null>;
  revoke(id: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date, exceptSessionId?: string): Promise<void>;
  touchLastUsed(id: string, at: Date): Promise<void>;
}

export interface CreateDeviceInput {
  userId: string;
  platform: DevicePlatform;
  deviceName: string | null;
  pushToken: string | null;
  appVersion: string | null;
  osVersion: string | null;
}

export interface UpdateDeviceInput {
  platform?: DevicePlatform;
  deviceName?: string | null;
  pushToken?: string | null;
  appVersion?: string | null;
  osVersion?: string | null;
  lastSeenAt?: Date;
}

export interface DeviceRepository {
  create(input: CreateDeviceInput): Promise<Device>;
  findById(id: string): Promise<Device | null>;
  findActiveDevicesForUser(userId: string): Promise<Device[]>;
  update(id: string, input: UpdateDeviceInput): Promise<Device>;
  clearPushToken(deviceId: string): Promise<void>;
  revoke(id: string, at: Date): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
}

export interface AccessTokenService {
  sign(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
}

export interface RefreshTokenPair {
  token: string;
  hash: string;
}

export interface RefreshTokenGenerator {
  generate(): RefreshTokenPair;
  hash(token: string): string;
}

export interface SessionContext {
  ipAddress: string | null;
  userAgent: string | null;
}
