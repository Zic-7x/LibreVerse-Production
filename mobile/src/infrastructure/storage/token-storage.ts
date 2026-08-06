import type { AuthTokens } from "../../domain/entities/auth.js";

export interface TokenStorage {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
}

export class InMemoryTokenStorage implements TokenStorage {
  private tokens: AuthTokens | null = null;

  async getTokens(): Promise<AuthTokens | null> {
    return this.tokens;
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.tokens = tokens;
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
  }
}
