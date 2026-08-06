import type { AuthTokens, MobileUser, UserSession } from "../../domain/entities/auth.js";
import type { AuthRepository, LoginInput, RegisterInput } from "../../domain/repositories/auth-repository.js";

export class RegisterUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(input: RegisterInput): Promise<UserSession> {
    if (!input.email || !input.password) {
      throw new Error("Email and password are required for registration.");
    }
    return this.authRepo.register(input);
  }
}

export class LoginUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(input: LoginInput): Promise<UserSession> {
    if (!input.email && !input.phoneE164) {
      throw new Error("Email or phone number is required to login.");
    }
    if (!input.password) {
      throw new Error("Password is required to login.");
    }
    return this.authRepo.login(input);
  }
}

export class RefreshTokenUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new Error("Refresh token is required.");
    }
    return this.authRepo.refreshToken(refreshToken);
  }
}

export class GetMeUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(accessToken: string): Promise<MobileUser> {
    if (!accessToken) {
      throw new Error("Access token is required.");
    }
    return this.authRepo.getMe(accessToken);
  }
}

export class LogoutUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(accessToken: string): Promise<void> {
    if (accessToken) {
      await this.authRepo.logout(accessToken);
    }
  }
}
