import type { DevicePlatform, UserStatus } from "@platform/shared-types";

export interface User {
  id: string;
  email: string | null;
  phoneE164: string | null;
  passwordHash: string;
  status: UserStatus;
  role: string;
  deletedAt: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string | null;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface Device {
  id: string;
  userId: string;
  platform: DevicePlatform;
  deviceName: string | null;
  pushToken: string | null;
  appVersion: string | null;
  osVersion: string | null;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export function canAuthenticate(user: User): boolean {
  return user.deletedAt === null && user.status === "active";
}

export function isBlockedStatus(status: UserStatus): boolean {
  return status === "suspended" || status === "deactivated" || status === "deleted";
}
