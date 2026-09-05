import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import type { EnvironmentConfig } from "../../config/environment.js";
import { AppError } from "../../core/errors.js";
import { hashSessionToken, localUserFromRow, type LocalUserRow } from "./local-auth.js";

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});

const requestResetSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const resetSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(256),
});

type SessionClaims = { sub: string; jti: string; typ: "access"; exp?: number };

function requireAdminClient(app: FastifyInstance) {
  if (!app.supabaseAdmin) {
    throw new AppError(503, "AUTH_DATABASE_NOT_CONFIGURED", "La base de autenticación no está disponible.");
  }
  return app.supabaseAdmin;
}

function publicUser(user: NonNullable<FastifyInstance["authenticate"]> extends never ? never : any) {
  return {
    id: user.id,
    email: user.email ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    email_confirmed_at: user.email_confirmed_at ?? null,
  };
}

function signLocalToken(userId: string, config: EnvironmentConfig): { token: string; sessionId: string; expiresAt: string } {
  if (!config.JWT_SECRET) {
    throw new AppError(503, "LOCAL_AUTH_NOT_CONFIGURED", "La autenticación local no está disponible.");
  }
  const sessionId = randomUUID();
  const token = jwt.sign(
    { sub: userId, jti: sessionId, typ: "access" },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] },
  );
  const claims = jwt.decode(token) as SessionClaims | null;
  if (!claims?.exp) throw new AppError(503, "LOCAL_AUTH_TOKEN_FAILED", "No se pudo crear la sesión.");
  return { token, sessionId, expiresAt: new Date(claims.exp * 1_000).toISOString() };
}

async function localLogin(app: FastifyInstance, config: EnvironmentConfig, email: string, password: string) {
  const admin = requireAdminClient(app);
  const { data: row, error } = await admin
    .from("app_users")
    .select("id,email,password_hash,password_reset_required,email_verified_at,account_status,app_metadata,user_metadata")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo iniciar sesión.");
  if (!row?.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
    throw new AppError(401, "AUTH_CREDENTIALS_INVALID", "El correo o la contraseña no son válidos.");
  }
  if (row.password_reset_required) {
    throw new AppError(403, "PASSWORD_RESET_REQUIRED", "Debes establecer una nueva contraseña antes de continuar.");
  }

  const session = signLocalToken(row.id, config);
  const { error: sessionError } = await admin.from("app_sessions").insert({
    id: session.sessionId,
    user_id: row.id,
    token_hash: hashSessionToken(session.token),
    expires_at: session.expiresAt,
  });
  if (sessionError) throw new AppError(503, "AUTH_SESSION_CREATE_FAILED", "No se pudo crear la sesión.");

  const user = localUserFromRow(row as LocalUserRow);
  return {
    access_token: session.token,
    token_type: "bearer",
    expires_at: session.expiresAt,
    user: publicUser(user),
  };
}

export const authRoutes: FastifyPluginAsyncZod<{ config: EnvironmentConfig }> = async (app, options) => {
  const config = options.config;

  app.post(
    "/v1/auth/login",
    {
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: {
        tags: ["auth"],
        summary: "Inicia una sesión en el proveedor configurado",
        body: credentialsSchema,
      },
    },
    async (request) => {
      const { email, password } = request.body;
      if (config.AUTH_MODE === "local") return { data: await localLogin(app, config, email, password) };

      if (!app.supabase) {
        throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de identidad no está disponible.");
      }
      const { data, error } = await app.createPublicSupabase().auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) {
        const status = error && "status" in error && Number(error.status) === 429 ? 429 : 401;
        throw new AppError(status, status === 429 ? "AUTH_RATE_LIMITED" : "AUTH_CREDENTIALS_INVALID", "No se pudo iniciar sesión.");
      }
      return {
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          token_type: data.session.token_type,
          expires_at: data.session.expires_at,
          user: publicUser(data.user),
        },
      };
    },
  );

  app.get(
    "/v1/auth/session",
    {
      preHandler: app.authenticate,
      schema: { tags: ["auth"], summary: "Devuelve la sesión autenticada actual" },
    },
    async (request) => ({ data: { user: publicUser(request.authUser!) } }),
  );

  app.post(
    "/v1/auth/logout",
    {
      preHandler: app.authenticate,
      schema: { tags: ["auth"], summary: "Cierra la sesión autenticada actual" },
    },
    async (request) => {
      if (config.AUTH_MODE === "local") {
        const admin = requireAdminClient(app);
        if (request.authSessionId) {
          const { error } = await admin
            .from("app_sessions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("id", request.authSessionId)
            .eq("user_id", request.authUser!.id)
            .is("revoked_at", null);
          if (error) throw new AppError(503, "AUTH_LOGOUT_FAILED", "No se pudo cerrar la sesión.");
        }
      } else if (request.authToken) {
        const { error } = await app.createUserSupabase(request.authToken).auth.signOut();
        if (error) throw new AppError(503, "AUTH_LOGOUT_FAILED", "No se pudo cerrar la sesión.");
      }
      return { data: { logged_out: true } };
    },
  );

  app.post(
    "/v1/auth/request-password-reset",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: {
        tags: ["auth"],
        summary: "Solicita un reset de contraseña sin revelar si existe la cuenta",
        description: "En local genera un token para el canal de correo pendiente de integrar. Nunca se devuelve en producción.",
        body: requestResetSchema,
      },
    },
    async (request) => {
      const { email } = request.body;
      if (config.AUTH_MODE === "supabase") {
        if (!app.supabase) throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de identidad no está disponible.");
        const { error } = await app.createPublicSupabase().auth.resetPasswordForEmail(email);
        if (error) {
          const status = "status" in error && Number(error.status) === 429 ? 429 : 503;
          throw new AppError(status, status === 429 ? "AUTH_RATE_LIMITED" : "AUTH_RESET_UNAVAILABLE", "No se pudo procesar la solicitud.");
        }
        return { data: { accepted: true } };
      }

      const admin = requireAdminClient(app);
      const { data: user, error } = await admin.from("app_users").select("id").eq("email", email).maybeSingle();
      if (error) throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo procesar la solicitud.");
      const response: { accepted: boolean; reset_token?: string } = { accepted: true };
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + config.PASSWORD_RESET_TTL_MINUTES * 60_000).toISOString();
        const { error: updateError } = await admin
          .from("app_users")
          .update({ password_reset_token_hash: hashSessionToken(token), password_reset_expires_at: expiresAt })
          .eq("id", user.id);
        if (updateError) throw new AppError(503, "PASSWORD_RESET_CREATE_FAILED", "No se pudo procesar la solicitud.");
        if (config.NODE_ENV !== "production") response.reset_token = token;
      }
      return { data: response };
    },
  );

  app.post(
    "/v1/auth/password-reset",
    {
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: {
        tags: ["auth"],
        summary: "Establece una nueva contraseña usando un token de reset local",
        body: resetSchema,
      },
    },
    async (request) => {
      if (config.AUTH_MODE !== "local") {
        throw new AppError(501, "PASSWORD_RESET_EXTERNAL_PROVIDER", "El reset de Supabase se completa mediante su flujo hospedado.");
      }
      const admin = requireAdminClient(app);
      const { token, password } = request.body;
      const { data: user, error } = await admin
        .from("app_users")
        .select("id,password_reset_expires_at")
        .eq("password_reset_token_hash", hashSessionToken(token))
        .maybeSingle();
      if (error) throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo completar el reset.");
      if (!user || !user.password_reset_expires_at || new Date(user.password_reset_expires_at).getTime() <= Date.now()) {
        throw new AppError(400, "PASSWORD_RESET_TOKEN_INVALID", "El token de reset no es válido o ha expirado.");
      }
      const { error: updateError } = await admin
        .from("app_users")
        .update({
          password_hash: await bcrypt.hash(password, 12),
          password_reset_required: false,
          password_reset_token_hash: null,
          password_reset_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (updateError) throw new AppError(503, "PASSWORD_RESET_FAILED", "No se pudo actualizar la contraseña.");
      const { error: revokeError } = await admin
        .from("app_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("revoked_at", null);
      if (revokeError) throw new AppError(503, "PASSWORD_RESET_FAILED", "No se pudo invalidar las sesiones anteriores.");
      return { data: { reset: true } };
    },
  );

  app.get(
    "/v1/auth/google",
    {
      schema: {
        tags: ["auth"],
        summary: "Contrato reservado para Google OAuth",
        description: "No implementado todavía. Requiere GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.",
      },
    },
    async () => {
      throw new AppError(501, "GOOGLE_OAUTH_NOT_IMPLEMENTED", "Google OAuth está reservado para una fase posterior.");
    },
  );
};
