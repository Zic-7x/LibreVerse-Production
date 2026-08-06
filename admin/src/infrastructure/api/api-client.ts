export class ApiClient {
  constructor(private readonly baseUrl: string = "/api/v1") {}

  async request<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
    const { token, headers = {}, ...customConfig } = options;

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

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMessage = errJson.message;
        }
      } catch {
        // Fallback error string
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }
}
