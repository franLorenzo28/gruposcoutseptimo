import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";

import type { EnvironmentConfig } from "../config/environment.js";

export async function registerSecurityPlugins(
  app: FastifyInstance,
  config: EnvironmentConfig,
): Promise<void> {
  await app.register(cookie);
  await app.register(cors, {
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow: boolean) => void,
    ) => {
      callback(null, !origin || config.CORS_ORIGINS.includes(origin));
    },
  });

  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === "production",
  });

  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });
}
