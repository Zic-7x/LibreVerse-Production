import type { AuthTokens, UserSession } from "../../domain/entities/auth.js";
import type {
  GetMeUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUseCase,
} from "../use-cases/auth-use-cases.js";
import type { RegisterPushDeviceUseCase } from "../use-cases/push-use-cases.js";
import type { LoginInput, RegisterInput } from "../../domain/repositories/auth-repository.js";
import type { TokenStorage } from "../../infrastructure/storage/token-storage.js";

export type SessionChangeListener = (session: UserSession | null) => void;

export class AuthSessionManager {
  private currentSession: UserSession | null = null;
  private listeners: SessionChangeListener[] = [];

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly tokenStorage: TokenStorage,
    private readonly registerDeviceUseCase?: RegisterPushDeviceUseCase,
  ) {}

  public subscribe(listener: SessionChangeListener): () => void {
    this.listeners.push(listener);
    listener(this.currentSession);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getSession(): UserSession | null {
    return this.currentSession;
  }

  public getAccessToken(): string | null {
    return this.currentSession?.tokens.accessToken ?? null;
  }

  public getRefreshToken(): string | null {
    return this.currentSession?.tokens.refreshToken ?? null;
  }

  public async bootstrapSession(): Promise<UserSession | null> {
    const tokens = await this.tokenStorage.getTokens();
    if (!tokens || !tokens.accessToken) {
      this.setSession(null);
      return null;
    }

    try {
      const user = await this.getMeUseCase.execute(tokens.accessToken);
      const session: UserSession = { user, tokens };
      this.setSession(session);
      return session;
    } catch {
      // Access token failed, try refresh token
      if (tokens.refreshToken) {
        try {
          const newTokens = await this.refreshTokenUseCase.execute(tokens.refreshToken);
          const user = await this.getMeUseCase.execute(newTokens.accessToken);
          const session: UserSession = { user, tokens: newTokens };
          await this.tokenStorage.setTokens(newTokens);
          this.setSession(session);
          return session;
        } catch {
          // Refresh failed
          await this.tokenStorage.clearTokens();
          this.setSession(null);
          return null;
        }
      } else {
        await this.tokenStorage.clearTokens();
        this.setSession(null);
        return null;
      }
    }
  }

  public async login(input: LoginInput, deviceName = "Mobile Device"): Promise<UserSession> {
    const session = await this.loginUseCase.execute(input);
    await this.tokenStorage.setTokens(session.tokens);
    this.setSession(session);

    if (this.registerDeviceUseCase) {
      try {
        await this.registerDeviceUseCase.execute(
          session.tokens.accessToken,
          "ios",
          deviceName,
          "", // Empty push token until FM12
        );
      } catch {
        // Device registration stub optional failure
      }
    }

    return session;
  }

  public async register(input: RegisterInput, deviceName = "Mobile Device"): Promise<UserSession> {
    const session = await this.registerUseCase.execute(input);
    await this.tokenStorage.setTokens(session.tokens);
    this.setSession(session);

    if (this.registerDeviceUseCase) {
      try {
        await this.registerDeviceUseCase.execute(
          session.tokens.accessToken,
          "ios",
          deviceName,
          "", // Empty push token until FM12
        );
      } catch {
        // Device registration stub optional failure
      }
    }

    return session;
  }

  public async refreshTokens(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const newTokens = await this.refreshTokenUseCase.execute(refreshToken);
      await this.tokenStorage.setTokens(newTokens);
      if (this.currentSession) {
        this.currentSession = {
          ...this.currentSession,
          tokens: newTokens,
        };
        this.notify();
      }
      return newTokens;
    } catch {
      await this.logout();
      return null;
    }
  }

  public async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await this.logoutUseCase.execute(token);
      } catch {
        // Ignore logout network error on client teardown
      }
    }
    await this.tokenStorage.clearTokens();
    this.setSession(null);
  }

  private setSession(session: UserSession | null): void {
    this.currentSession = session;
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentSession));
  }
}
