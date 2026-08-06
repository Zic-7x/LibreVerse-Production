import type { UserStatus } from "@platform/shared-types";

export type AdminRole = "moderator" | "admin";

export interface AdminUser {
  id: string;
  email: string | null;
  phoneE164: string | null;
  status: UserStatus;
  role: AdminRole;
}

export interface AdminSession {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}
