import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { EnvironmentConfig } from "../config/environment.js";
import { AppError } from "../core/errors.js";

declare module "fastify" {
  interface FastifyInstance {
    getPowerRole(request: FastifyRequest): "user" | "mod" | "admin";
    requireActiveAccount(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    requireInternalMember(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

function profileRole(request: FastifyRequest): "user" | "mod" | "admin" {
  const role = request.authProfileRole?.trim().toLowerCase();
  if (role === "admin") return "admin";
  if (role === "mod") return "mod";
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
    return profileRole(request);
  });

  app.decorate(
    "requireInternalMember",
    async function requireInternalMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await app.requireActiveAccount(request, reply);
      let allowed = false;
      if (app.db) {
        try {
          const result = await app.db.query<{ internal_access: boolean }>(
            "select internal_access from public.profiles where user_id = $1 limit 1", [request.authUser!.id],
          );
          allowed = result.rows[0]?.internal_access === true;
        } catch { throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el acceso interno."); }
      } else {
        if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "La autorización no está disponible.");
        const result = await app.supabaseAdmin.from("profiles").select("internal_access")
          .eq("user_id", request.authUser!.id).maybeSingle();
        if (result.error) throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el acceso interno.");
        allowed = result.data?.internal_access === true;
      }
      if (!allowed) throw new AppError(403, "INTERNAL_ACCESS_REQUIRED", "El acceso interno requiere habilitación del administrador.");
    },
  );

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
