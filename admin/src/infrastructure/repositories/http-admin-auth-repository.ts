import type { UserStatus } from "@platform/shared-types";
import type { AdminSession, AdminUser } from "../../domain/entities/admin-auth.js";
import type { AdminAuthRepository, AdminLoginInput } from "../../domain/repositories/admin-auth-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async login(input: AdminLoginInput): Promise<AdminSession> {
    const res = await this.apiClient.request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string | null; phoneE164: string | null; status: UserStatus; role?: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });

    const userRole = (res.user.role as "moderator" | "admin") || "moderator";

    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: {
        id: res.user.id,
        email: res.user.email,
        phoneE164: res.user.phoneE164,
        status: res.user.status,
        role: userRole,
      },
    };
  }

  async getMe(accessToken: string): Promise<AdminUser> {
    const res = await this.apiClient.request<{
      user: { id: string; email: string | null; phoneE164: string | null; status: UserStatus; role?: string };
    }>("/auth/me", {
      method: "GET",
      token: accessToken,
    });

    const userRole = (res.user.role as "moderator" | "admin") || "moderator";

    return {
      id: res.user.id,
      email: res.user.email,
      phoneE164: res.user.phoneE164,
      status: res.user.status,
      role: userRole,
    };
  }

  async logout(accessToken: string): Promise<void> {
    await this.apiClient.request<void>("/auth/logout", {
      method: "POST",
      token: accessToken,
    });
  }
}
