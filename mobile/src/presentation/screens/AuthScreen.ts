import type { LoginUseCase, RegisterUseCase } from "../../application/use-cases/auth-use-cases.js";
import type { UserSession } from "../../domain/entities/auth.js";

export class AuthScreen {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  async handleLogin(email?: string, phoneE164?: string, password?: string): Promise<UserSession> {
    return this.loginUseCase.execute({ email, phoneE164, password });
  }

  async handleRegister(email: string, password: string, phoneE164?: string): Promise<UserSession> {
    return this.registerUseCase.execute({ email, password, phoneE164 });
  }
}
