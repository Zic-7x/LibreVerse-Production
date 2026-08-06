import type { AdminSession, AdminUser } from "../entities/admin-auth.js";

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminAuthRepository {
  login(input: AdminLoginInput): Promise<AdminSession>;
  getMe(accessToken: string): Promise<AdminUser>;
  logout(accessToken: string): Promise<void>;
}
