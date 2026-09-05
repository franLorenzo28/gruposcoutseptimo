import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import type { ReadinessProbe } from "../../integrations/supabase/readiness.js";
import { healthResponseSchema, readinessResponseSchema } from "./health.schemas.js";

export interface HealthRouteOptions {
  readinessProbe: ReadinessProbe;
}

export const healthRoutes: FastifyPluginAsyncZod<HealthRouteOptions> = async (
  app,
  options,
) => {
  app.get(
    "/health",
    {
      config: { rateLimit: false },
      schema: {
        tags: ["operational"],
        summary: "Comprueba que el proceso HTTP está vivo",
        response: { 200: healthResponseSchema },
      },
    },
    async () => ({
      status: "ok" as const,
      service: "gruposcoutseptimo-api" as const,
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    }),
  );

  app.get(
    "/ready",
    {
      config: { rateLimit: false },
      schema: {
        tags: ["operational"],
        summary: "Comprueba que las dependencias están disponibles",
        response: {
          200: readinessResponseSchema,
          503: readinessResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const checks = await options.readinessProbe.check();
      const status =
        checks.auth.status === "up" && checks.database.status === "up"
          ? "ready"
          : "not_ready";

      if (status === "not_ready") {
        request.log.warn(
          {
            authReason: checks.auth.reason,
            databaseReason: checks.database.reason,
          },
          "dependency readiness check failed",
        );
      }

      return reply.status(status === "ready" ? 200 : 503).send({
        status,
        checks: {
          supabaseAuth: {
            status: checks.auth.status,
            latencyMs: checks.auth.latencyMs,
          },
          supabaseDatabase: {
            status: checks.database.status,
            latencyMs: checks.database.latencyMs,
          },
        },
        timestamp: new Date().toISOString(),
      });
    },
  );
};
