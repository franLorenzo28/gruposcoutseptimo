import "dotenv/config";

import { buildApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";

async function start(): Promise<void> {
  const config = loadEnvironment();
  const app = await buildApp({ config });
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, "graceful shutdown started");

    try {
      await app.close();
      app.log.info("server stopped");
      process.exitCode = 0;
    } catch (error: unknown) {
      app.log.error({ err: error }, "graceful shutdown failed");
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ host: config.HOST, port: config.PORT });
}

start().catch((error: unknown) => {
  console.error("No se pudo iniciar la API.", error);
  process.exitCode = 1;
});
