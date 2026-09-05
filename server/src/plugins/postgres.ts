import type { FastifyInstance } from "fastify";
import pg from "pg";
import type { EnvironmentConfig } from "../config/environment.js";

declare module "fastify" {
  interface FastifyInstance {
    db: pg.Pool | null;
  }
}

export function installPostgresPool(app: FastifyInstance, config: EnvironmentConfig): pg.Pool | null {
  if (!config.DATABASE_URL) {
    app.decorate("db", null);
    return null;
  }

  const ssl = config.DATABASE_SSL === "disable"
    ? false
    : { rejectUnauthorized: config.DATABASE_SSL === "verify-full" };
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    ssl,
    max: config.DATABASE_POOL_MAX,
    connectionTimeoutMillis: config.DATABASE_TIMEOUT_MS,
    idleTimeoutMillis: 30_000,
    statement_timeout: config.DATABASE_TIMEOUT_MS,
    application_name: "gruposcoutseptimo-api",
  });
  pool.on("error", (error) => app.log.error({ err: error }, "idle PostgreSQL client error"));
  app.decorate("db", pool);
  app.addHook("onClose", async () => { await pool.end(); });
  return pool;
}
