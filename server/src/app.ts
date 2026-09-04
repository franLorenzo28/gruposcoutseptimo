import { randomUUID } from "node:crypto";

import Fastify, { LogController, type FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { loadEnvironment, type EnvironmentConfig } from "./config/environment.js";
import {
  createSupabaseReadinessProbe,
  type ReadinessProbe,
} from "./integrations/supabase/readiness.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { installAuthentication } from "./plugins/auth.js";
import { installErrorHandlers } from "./plugins/error-handler.js";
import { registerOpenApi } from "./plugins/openapi.js";
import { registerSecurityPlugins } from "./plugins/security.js";
import { installSupabaseClient } from "./plugins/supabase.js";

export interface BuildAppOptions {
  config?: EnvironmentConfig;
  logger?: boolean;
  readinessProbe?: ReadinessProbe;
}

const acceptedRequestId = /^[A-Za-z0-9._:-]{1,128}$/;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadEnvironment();
  const logger =
    options.logger === false
      ? false
      : {
          level: config.LOG_LEVEL,
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.apikey",
              "SUPABASE_SERVICE_ROLE_KEY",
              "password",
              "token",
            ],
            censor: "[REDACTED]",
          },
        };
  const app = Fastify({
    bodyLimit: config.BODY_LIMIT_BYTES,
    logger,
    logController: new LogController({ requestIdLogLabel: "requestId" }),
    genReqId: (request) => {
      const incoming = request.headers["x-request-id"];
      return typeof incoming === "string" && acceptedRequestId.test(incoming)
        ? incoming
        : randomUUID();
    },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  installErrorHandlers(app);
  installSupabaseClient(app, config);
  installAuthentication(app);

  await registerSecurityPlugins(app, config);
  await registerOpenApi(app, config);
  await app.register(healthRoutes, {
    readinessProbe: options.readinessProbe ?? createSupabaseReadinessProbe(config),
  });

  return app;
}
