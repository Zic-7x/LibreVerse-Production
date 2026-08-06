import type { AuthTokens, MobileUser, UserSession } from "../../domain/entities/auth.js";
import type { AuthRepository, LoginInput, RegisterInput } from "../../domain/repositories/auth-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async register(input: RegisterInput): Promise<UserSession> {
    return this.apiClient.request<UserSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput): Promise<UserSession> {
    return this.apiClient.request<UserSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.apiClient.request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe(accessToken: string): Promise<MobileUser> {
    const res = await this.apiClient.request<{ user: MobileUser }>("/auth/me", {
      method: "GET",
      token: accessToken,
    });
    return res.user;
  }

  async logout(accessToken: string): Promise<void> {
    await this.apiClient.request<void>("/auth/logout", {
      method: "POST",
      token: accessToken,
    });
  }
}
