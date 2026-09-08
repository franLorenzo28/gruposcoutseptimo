import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { EnvironmentConfig } from "../config/environment.js";

import { AppError } from "../core/errors.js";

import { hashSessionToken, localUserFromRow, type LocalUserRow } from "../modules/auth/local-auth.js";
import { LocalAuthRepository } from "../modules/auth/local-auth.repository.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    authUser: User | null;
    authToken: string | null;
    authSessionId: string | null;
    authProfileRole: string | null;
    userSupabase: SupabaseClient | null;
  }
}

async function profileRoleFromAdminClient(app: FastifyInstance, userId: string): Promise<string | null> {
  if (!app.supabaseAdmin) return null;
  const { data } = await app.supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return typeof data?.role === "string" ? data.role : null;
}

function tokenFromRequest(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function authenticateLocal(
  app: FastifyInstance,
  request: FastifyRequest,
  accessToken: string,
  config: EnvironmentConfig,
): Promise<void> {
  if (!config.JWT_SECRET || (!app.db && !app.supabaseAdmin)) {
    throw new AppError(503, "LOCAL_AUTH_NOT_CONFIGURED", "La autenticación local no está disponible.");
  }

  let claims: JwtPayload;
  try {
    claims = jwt.verify(accessToken, config.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, "AUTH_TOKEN_INVALID", "El token de acceso no es válido.");
  }

  if (typeof claims.sub !== "string" || typeof claims.jti !== "string" || claims.typ !== "access") {
    throw new AppError(401, "AUTH_TOKEN_INVALID", "El token de acceso no es válido.");
  }

  const repository = new LocalAuthRepository(app);
  let session;
  try { session = await repository.findSession(claims.jti, claims.sub, hashSessionToken(accessToken)); }
  catch (error) {
    request.log.error({ err: error }, "local auth session lookup failed");
    throw new AppError(503, "LOCAL_AUTH_DATABASE_UNAVAILABLE", "No se pudo validar la sesión.");
  }
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
    throw new AppError(401, "AUTH_TOKEN_INVALID", "El token de acceso no es válido.");
  }

  let row;
  try { row = await repository.findUserById(claims.sub); }
  catch (error) {
    request.log.error({ err: error }, "local auth user lookup failed");
    throw new AppError(503, "LOCAL_AUTH_DATABASE_UNAVAILABLE", "No se pudo validar la cuenta.");
  }
  if (!row) throw new AppError(401, "AUTH_TOKEN_INVALID", "El token de acceso no es válido.");

  request.authUser = localUserFromRow(row as LocalUserRow);
  request.authToken = accessToken;
  request.authSessionId = claims.jti;
  // Local JWTs do not carry an RLS identity. Business routes are already guarded
  // by this plugin, so they use the server-only client until their repositories
  // are migrated to direct PostgreSQL access.
  request.userSupabase = app.supabaseAdmin;
}

export function installAuthentication(app: FastifyInstance, config: EnvironmentConfig): void {
  app.decorateRequest("authUser", null);
  app.decorateRequest("authToken", null);
  app.decorateRequest("authSessionId", null);
  app.decorateRequest("authProfileRole", null);
  app.decorateRequest("userSupabase", null);

  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest): Promise<void> {
      const accessToken = tokenFromRequest(request);

      if (!accessToken) {
        throw new AppError(401, "AUTH_TOKEN_MISSING", "Falta el token de acceso.");
      }

      if (config.AUTH_MODE === "local") {
        await authenticateLocal(app, request, accessToken, config);
        return;
      }

      if (!app.supabase) {
        throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de identidad no está disponible.");
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
      request.authToken = accessToken;
      request.authSessionId = null;
      request.userSupabase = app.createUserSupabase(accessToken);
    },
  );
}
