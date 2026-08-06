import type { AuthTokens, MobileUser, UserSession } from "../entities/auth.js";

export interface RegisterInput {
  email: string;
  password: string;
  phoneE164?: string;
}

export interface LoginInput {
  email?: string;
  phoneE164?: string;
  password?: string;
}

export interface AuthRepository {
  register(input: RegisterInput): Promise<UserSession>;
  login(input: LoginInput): Promise<UserSession>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  getMe(accessToken: string): Promise<MobileUser>;
  logout(accessToken: string): Promise<void>;
}
