import type { AdminLoginUseCase } from "../../application/use-cases/admin-auth-use-cases.js";
import type { AdminSession } from "../../domain/entities/admin-auth.js";

export class LoginPageController {
  constructor(private readonly loginUseCase: AdminLoginUseCase) {}

  async handleLogin(email: string, password: string): Promise<AdminSession> {
    return this.loginUseCase.execute({ email, password });
  }
}
