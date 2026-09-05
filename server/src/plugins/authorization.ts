import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { EnvironmentConfig } from "../config/environment.js";
import { AppError } from "../core/errors.js";

declare module "fastify" {
  interface FastifyInstance {
    getPowerRole(request: FastifyRequest): "user" | "mod" | "admin";
    requireActiveAccount(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

function metadataRole(request: FastifyRequest): "user" | "mod" | "admin" {
  const role = request.authUser?.app_metadata?.role;
  const roles = request.authUser?.app_metadata?.roles;
  const candidates = [role, ...(Array.isArray(roles) ? roles : [])]
    .filter((candidate): candidate is string => typeof candidate === "string")
    .map((candidate) => candidate.toLowerCase());
  if (candidates.includes("admin")) return "admin";
  if (candidates.includes("mod")) return "mod";
  return "user";
}

export function installAuthorization(app: FastifyInstance, config: EnvironmentConfig): void {
  app.decorate("getPowerRole", (request: FastifyRequest) => {
    const user = request.authUser;
    if (!user) return "user";
    if (
      config.ADMIN_USER_IDS.includes(user.id) ||
      (typeof user.email === "string" && config.ADMIN_EMAILS.includes(user.email.toLowerCase()))
    ) {
      return "admin";
    }
    return metadataRole(request);
  });

  app.decorate(
    "requireActiveAccount",
    async function requireActiveAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await app.authenticate(request, reply);
      if (!request.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Debes iniciar sesión.");
      }
      let data: { account_status: string | null } | null;
      if (app.db) {
        try {
          const result = await app.db.query<{ account_status: string | null }>(
            "select account_status from public.profiles where user_id = $1 limit 1", [request.authUser.id],
          );
          data = result.rows[0] ?? null;
        } catch {
          throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el estado de la cuenta.");
        }
      } else {
        if (!app.supabaseAdmin) {
          throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de autorización no está disponible.");
        }
        const result = await app.supabaseAdmin.from("profiles").select("account_status")
          .eq("user_id", request.authUser.id).maybeSingle();
        if (result.error) {
          request.log.error({ code: result.error.code }, "account status lookup failed");
          throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el estado de la cuenta.");
        }
        data = result.data;
      }
      if (!data || data.account_status !== "activo") {
        throw new AppError(403, "ACCOUNT_NOT_ACTIVE", "La cuenta todavía no está habilitada.", {
          status: data?.account_status ?? "sin_perfil",
        });
      }
    },
  );

  app.decorate(
    "requireAdmin",
    async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await app.authenticate(request, reply);
      const user = request.authUser;
      if (!user) {
        throw new AppError(401, "AUTH_REQUIRED", "Debes iniciar sesión.");
      }

      if (app.getPowerRole(request) === "user") {
        throw new AppError(403, "ADMIN_REQUIRED", "Esta operación requiere permisos de administración.");
      }
    },
  );
}
