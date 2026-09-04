import type { User } from "@supabase/supabase-js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../core/errors.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    authUser: User | null;
  }
}

export function installAuthentication(app: FastifyInstance): void {
  app.decorateRequest("authUser", null);

  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest): Promise<void> {
      if (!app.supabase) {
        throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de identidad no está disponible.");
      }

      const authorization = request.headers.authorization;
      const match = authorization?.match(/^Bearer\s+(.+)$/i);
      const accessToken = match?.[1]?.trim();

      if (!accessToken) {
        throw new AppError(401, "AUTH_TOKEN_MISSING", "Falta el token de acceso.");
      }

      const { data, error } = await app.supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        const upstreamStatus = error && "status" in error ? Number(error.status) : 0;
        if (upstreamStatus >= 500) {
          throw new AppError(503, "AUTH_PROVIDER_UNAVAILABLE", "El servicio de identidad no está disponible.");
        }
        throw new AppError(401, "AUTH_TOKEN_INVALID", "El token de acceso no es válido.");
      }

      request.authUser = data.user;
    },
  );
}
