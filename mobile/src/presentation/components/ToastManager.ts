export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  durationMs?: number;
}

export class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastMessage[] = [];
  private listeners: Array<(toasts: ToastMessage[]) => void> = [];

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public show(toast: Omit<ToastMessage, "id">): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      durationMs: toast.durationMs ?? 4000,
    };

    this.toasts = [...this.toasts, newToast];
    this.notify();

    if (newToast.durationMs && newToast.durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.durationMs);
    }

    return id;
  }

  public dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clearAll(): void {
    this.toasts = [];
    this.notify();
  }

  public getActiveToasts(): ToastMessage[] {
    return [...this.toasts];
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}
