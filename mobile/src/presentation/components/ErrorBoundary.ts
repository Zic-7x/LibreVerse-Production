export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: string;
}

export type ErrorListener = (state: ErrorBoundaryState) => void;

export class ErrorBoundaryController {
  private state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  private listeners: ErrorListener[] = [];

  public subscribe(listener: ErrorListener): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public captureError(error: Error | unknown, errorInfo?: string): void {
    const normError = error instanceof Error ? error : new Error(String(error));
    this.state = {
      hasError: true,
      error: normError,
      errorInfo,
    };
    this.notify();
  }

  public reset(): void {
    this.state = {
      hasError: false,
      error: null,
    };
    this.notify();
  }

  public getState(): ErrorBoundaryState {
    return { ...this.state };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }
}
