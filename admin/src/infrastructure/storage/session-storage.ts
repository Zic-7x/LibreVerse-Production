import type { AdminSession } from "../../domain/entities/admin-auth.js";

export interface SessionStorage {
  getSession(): Promise<AdminSession | null>;
  setSession(session: AdminSession): Promise<void>;
  clearSession(): Promise<void>;
}

export class InMemorySessionStorage implements SessionStorage {
  private session: AdminSession | null = null;

  async getSession(): Promise<AdminSession | null> {
    return this.session;
  }

  async setSession(session: AdminSession): Promise<void> {
    this.session = session;
  }

  async clearSession(): Promise<void> {
    this.session = null;
  }
}
