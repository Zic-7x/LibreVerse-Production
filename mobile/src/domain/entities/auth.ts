import type { UserStatus } from "@platform/shared-types";

export interface MobileUser {
  id: string;
  email: string;
  phoneE164: string | null;
  status: UserStatus;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSession {
  user: MobileUser;
  tokens: AuthTokens;
}
