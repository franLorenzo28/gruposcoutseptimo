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
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { contentRoutes } from "./modules/content/content.routes.js";
import { groupRoutes } from "./modules/groups/group.routes.js";
import { socialRoutes } from "./modules/social/social.routes.js";
import { mediaRoutes } from "./modules/media/media.routes.js";
import { profileRoutes } from "./modules/profiles/profile.routes.js";
import { registrationRoutes } from "./modules/registrations/registration.routes.js";
import { installAuthentication } from "./plugins/auth.js";
import { installAuthorization } from "./plugins/authorization.js";
import { installErrorHandlers } from "./plugins/error-handler.js";
import { registerOpenApi } from "./plugins/openapi.js";
import { registerSecurityPlugins } from "./plugins/security.js";
import { installSupabaseClient } from "./plugins/supabase.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { createAuthMailer, type AuthMailer } from "./modules/auth/auth-mailer.js";

export interface BuildAppOptions {
  config?: EnvironmentConfig;
  logger?: boolean;
  readinessProbe?: ReadinessProbe;
  authMailer?: AuthMailer;
}

const acceptedRequestId = /^[A-Za-z0-9._:-]{1,128}$/;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadEnvironment();
  const authMailer = options.authMailer ?? createAuthMailer(config);
  const logger =
    options.logger === false
      ? false
      : {
          level: config.LOG_LEVEL,
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.apikey",
              "req.body.password",
              "req.body.token",
              "req.body.reset_token",
              "req.body.access_token",
              "req.body.refresh_token",
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
  installAuthentication(app, config);
  installAuthorization(app, config);

  await registerSecurityPlugins(app, config);
  await registerOpenApi(app, config);
  await app.register(authRoutes, { config, authMailer });
  await app.register(healthRoutes, {
    readinessProbe: options.readinessProbe ?? createSupabaseReadinessProbe(config),
  });
  await app.register(registrationRoutes, { config, authMailer });
  await app.register(profileRoutes);
  await app.register(adminRoutes);
  await app.register(contentRoutes);
  await app.register(groupRoutes, { prefix: "/v1" });
  await app.register(groupRoutes);
  await app.register(socialRoutes, { prefix: "/v1" });
  await app.register(socialRoutes);
  await app.register(mediaRoutes);

  return app;
}
