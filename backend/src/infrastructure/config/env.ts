export interface AppConfig {
  host: string;
  port: number;
  logLevel: string;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid integer: ${value}`);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  const databaseUrl =
    env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/platform";

  const nodeEnv = env.NODE_ENV ?? "development";
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (nodeEnv === "production") {
      throw new Error("JWT_SECRET is required in production");
    }
  }

  return {
    host: env.HOST ?? "0.0.0.0",
    port,
    logLevel: env.LOG_LEVEL ?? "info",
    nodeEnv,
    databaseUrl,
    jwtSecret: jwtSecret ?? "dev-only-insecure-jwt-secret",
    jwtAccessTtlSeconds: parsePositiveInt(env.JWT_ACCESS_TTL_SECONDS, 900),
    refreshTokenTtlSeconds: parsePositiveInt(
      env.REFRESH_TOKEN_TTL_SECONDS,
      2_592_000,
    ),
  };
}
