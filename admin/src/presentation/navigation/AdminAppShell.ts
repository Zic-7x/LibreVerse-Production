import type { AdminSession } from "../../domain/entities/admin-auth.js";
import type { ModerationCase, ModerationCaseDetails } from "../../domain/entities/moderation-case.js";
import type { AdminReport } from "../../domain/entities/report.js";

export type AdminTab = "cases" | "case_detail" | "reports";

export interface AdminAppShellState {
  currentTab: AdminTab;
  session: AdminSession | null;
  cases: ModerationCase[];
  selectedCaseId: string | null;
  activeCaseDetails: ModerationCaseDetails | null;
  reports: AdminReport[];
  isLoading: boolean;
  error: string | null;
}

export class AdminAppShellController {
  private state: AdminAppShellState = {
    currentTab: "cases",
    session: null,
    cases: [],
    selectedCaseId: null,
    activeCaseDetails: null,
    reports: [],
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: AdminAppShellState) => void> = new Set();

  getState(): AdminAppShellState {
    return { ...this.state };
  }

  setState(partial: Partial<AdminAppShellState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: (state: AdminAppShellState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  setTab(tab: AdminTab): void {
    this.setState({ currentTab: tab });
  }

  setSession(session: AdminSession | null): void {
    this.setState({ session, error: null });
  }

  setSelectedCase(caseId: string | null): void {
    this.setState({ selectedCaseId: caseId, currentTab: caseId ? "case_detail" : "cases" });
  }

  setError(error: string | null): void {
    this.setState({ error });
  }
}
