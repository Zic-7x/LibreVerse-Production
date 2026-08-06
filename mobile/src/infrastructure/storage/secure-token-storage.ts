import type { AuthTokens } from "../../domain/entities/auth.js";
import type { TokenStorage } from "./token-storage.js";

export interface NativeSecureStoreProvider {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export class SecureTokenStorageAdapter implements TokenStorage {
  private static STORAGE_KEY = "mobile_auth_tokens_v1";
  private memoryFallback: AuthTokens | null = null;

  constructor(private readonly secureStoreProvider?: NativeSecureStoreProvider) {}

  async getTokens(): Promise<AuthTokens | null> {
    if (this.secureStoreProvider) {
      try {
        const raw = await this.secureStoreProvider.getItemAsync(SecureTokenStorageAdapter.STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthTokens;
      } catch {
        return this.memoryFallback;
      }
    }
    return this.memoryFallback;
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.memoryFallback = tokens;
    if (this.secureStoreProvider) {
      try {
        await this.secureStoreProvider.setItemAsync(
          SecureTokenStorageAdapter.STORAGE_KEY,
          JSON.stringify(tokens),
        );
      } catch {
        // Fallback stored in memory
      }
    }
  }

  async clearTokens(): Promise<void> {
    this.memoryFallback = null;
    if (this.secureStoreProvider) {
      try {
        await this.secureStoreProvider.deleteItemAsync(SecureTokenStorageAdapter.STORAGE_KEY);
      } catch {
        // Fallback cleared
      }
    }
  }
}
