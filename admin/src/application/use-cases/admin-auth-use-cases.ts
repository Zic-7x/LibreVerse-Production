import type { AdminSession, AdminUser } from "../../domain/entities/admin-auth.js";
import type { AdminAuthRepository, AdminLoginInput } from "../../domain/repositories/admin-auth-repository.js";

export class AdminLoginUseCase {
  constructor(private readonly authRepo: AdminAuthRepository) {}

  async execute(input: AdminLoginInput): Promise<AdminSession> {
    if (!input.email || !input.password) {
      throw new Error("Email and password are required.");
    }

    const session = await this.authRepo.login(input);
    if (session.user.role !== "moderator" && session.user.role !== "admin") {
      throw new Error("Access denied: Moderator or Admin role required.");
    }

    return session;
  }
}

export class GetAdminMeUseCase {
  constructor(private readonly authRepo: AdminAuthRepository) {}

  async execute(accessToken: string): Promise<AdminUser> {
    if (!accessToken) {
      throw new Error("Access token required.");
    }
    const user = await this.authRepo.getMe(accessToken);
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Access denied: Moderator or Admin role required.");
    }
    return user;
  }
}

export class AdminLogoutUseCase {
  constructor(private readonly authRepo: AdminAuthRepository) {}

  async execute(accessToken: string): Promise<void> {
    if (accessToken) {
      await this.authRepo.logout(accessToken);
    }
  }
}
