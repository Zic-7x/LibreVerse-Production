export type AppEnvironment = "development" | "staging" | "production";

export interface ApiEnvironmentConfig {
  environment: AppEnvironment;
  baseUrl: string;
  wsUrl: string;
  timeoutMs: number;
}

export const DEFAULT_ENV_CONFIGS: Record<AppEnvironment, ApiEnvironmentConfig> = {
  development: {
    environment: "development",
    baseUrl: "http://localhost:3000/api/v1",
    wsUrl: "ws://localhost:3000/ws",
    timeoutMs: 10000,
  },
  staging: {
    environment: "staging",
    baseUrl: "https://staging-api.freedom.app/api/v1",
    wsUrl: "wss://staging-api.freedom.app/ws",
    timeoutMs: 15000,
  },
  production: {
    environment: "production",
    baseUrl: "https://api.freedom.app/api/v1",
    wsUrl: "wss://api.freedom.app/ws",
    timeoutMs: 15000,
  },
};

export class ApiConfig {
  private currentConfig: ApiEnvironmentConfig;

  constructor(env: AppEnvironment = "development", customBaseUrl?: string) {
    const defaultConfig = DEFAULT_ENV_CONFIGS[env] ?? DEFAULT_ENV_CONFIGS.development;
    this.currentConfig = {
      ...defaultConfig,
      ...(customBaseUrl ? { baseUrl: customBaseUrl } : {}),
    };
  }

  public getConfig(): ApiEnvironmentConfig {
    return { ...this.currentConfig };
  }

  public setEnvironment(env: AppEnvironment, customBaseUrl?: string): void {
    const defaultConfig = DEFAULT_ENV_CONFIGS[env] ?? DEFAULT_ENV_CONFIGS.development;
    this.currentConfig = {
      ...defaultConfig,
      ...(customBaseUrl ? { baseUrl: customBaseUrl } : {}),
    };
  }

  public getBaseUrl(): string {
    return this.currentConfig.baseUrl;
  }

  public getWsUrl(): string {
    return this.currentConfig.wsUrl;
  }
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  version?: string;
  timestamp: string;
  db?: { connected: boolean };
}

export async function checkBackendHealth(baseUrl: string): Promise<HealthCheckResponse> {
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, "/health");
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return {
        status: "error",
        service: "mobile-health-check",
        timestamp: new Date().toISOString(),
      };
    }

    const data = (await response.json()) as Partial<HealthCheckResponse>;
    return {
      status: data.status === "ok" ? "ok" : "degraded",
      service: data.service ?? "platform-backend",
      timestamp: data.timestamp ?? new Date().toISOString(),
      db: data.db,
    };
  } catch {
    return {
      status: "error",
      service: "mobile-health-check",
      timestamp: new Date().toISOString(),
      db: { connected: false },
    };
  }
}
