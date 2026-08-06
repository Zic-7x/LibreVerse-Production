import "dotenv/config";
import { createApp } from "./bootstrap/create-app.js";
import { loadConfig } from "./infrastructure/config/env.js";

async function main() {
  const config = loadConfig();
  const { app } = await createApp(config);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Received shutdown signal, closing server gracefully...");
    try {
      await app.close();
      app.log.info("Server closed successfully");
      process.exit(0);
    } catch (err) {
      app.log.error(err, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await app.listen({ host: config.host, port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
