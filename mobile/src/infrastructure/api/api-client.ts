export type RefreshTokenHandler = () => Promise<string | null>;

export class ApiClient {
  private refreshTokenHandler?: RefreshTokenHandler;

  constructor(private readonly baseUrl: string = "/api/v1") {}

  public setRefreshTokenHandler(handler: RefreshTokenHandler): void {
    this.refreshTokenHandler = handler;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string; isRetry?: boolean } = {},
  ): Promise<T> {
    const { token, isRetry, headers = {}, ...customConfig } = options;

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };

    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...customConfig,
      headers: reqHeaders,
    });

    if (response.status === 401 && token && !isRetry && this.refreshTokenHandler) {
      const newToken = await this.refreshTokenHandler();
      if (newToken) {
        return this.request<T>(endpoint, {
          ...options,
          token: newToken,
          isRetry: true,
        });
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMessage = errJson.message;
        }
      } catch {
        // Fallback to text status
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }
}
