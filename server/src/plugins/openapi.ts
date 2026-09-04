import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

import type { EnvironmentConfig } from "../config/environment.js";

export async function registerOpenApi(
  app: FastifyInstance,
  config: EnvironmentConfig,
): Promise<void> {
  if (config.NODE_ENV !== "development") return;

  const [{ default: swagger }, { default: swaggerUi }] = await Promise.all([
    import("@fastify/swagger"),
    import("@fastify/swagger-ui"),
  ]);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Grupo Scout Séptimo API",
        description: "Backend HTTP sobre Supabase para la plataforma del Grupo Scout Séptimo.",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    staticCSP: true,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
