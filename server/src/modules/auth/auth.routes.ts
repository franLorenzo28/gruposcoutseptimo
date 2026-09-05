import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import type { EnvironmentConfig } from "../../config/environment.js";
import { AppError } from "../../core/errors.js";
import { hashSessionToken, localUserFromRow, type LocalUserRow } from "./local-auth.js";
import { authActionUrl, type AuthMailer } from "./auth-mailer.js";

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});

const requestResetSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const resetSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(256).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "La contraseña no puede superar 72 bytes."),
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

export const authRoutes: FastifyPluginAsyncZod<{ config: EnvironmentConfig; authMailer: AuthMailer }> = async (app, options) => {
  const config = options.config;

  app.post("/v1/auth/request-verification", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: requestResetSchema },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(501, "AUTH_EXTERNAL_PROVIDER", "La verificación corresponde al proveedor externo.");
    const admin = requireAdminClient(app);
    const token = randomBytes(32).toString("hex");
    const { data, error } = await admin.from("app_users").update({
      email_verification_token_hash: hashSessionToken(token),
      email_verification_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }).ilike("email", request.body.email.replace(/[\\%_]/g, "\\$&")).is("email_verified_at", null).select("id").maybeSingle();
    if (error) throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo procesar la solicitud.");
    if (data) {
      try { await options.authMailer(request.body.email, token, "verification"); }
      catch { request.log.error({ userId: data.id }, "verification email delivery failed"); }
    }
    return { data: { accepted: true, ...(data && config.NODE_ENV !== "production"
      ? { verificationUrl: authActionUrl(config, token, "verification") } : {}) } };
  });

  app.post("/v1/auth/verify-email", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }) },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(501, "AUTH_EXTERNAL_PROVIDER", "La verificación corresponde al proveedor externo.");
    const { data, error } = await requireAdminClient(app).rpc("verify_local_email", { p_token_hash: hashSessionToken(request.body.token) });
    if (error) {
      if (error.message.includes("verification_token_invalid")) throw new AppError(400, "VERIFICATION_TOKEN_INVALID", "El enlace no es válido o ha expirado.");
      throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo verificar el correo.");
    }
    return { data };
  });

  app.post("/v1/auth/resend-verification", {
    preHandler: app.authenticate,
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"] },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(501, "AUTH_EXTERNAL_PROVIDER", "La verificación corresponde al proveedor externo.");
    const user = request.authUser!;
    if (user.email_confirmed_at) return { data: { success: true, message: "El correo ya está verificado." } };
    if (!user.email) throw new AppError(400, "AUTH_EMAIL_REQUIRED", "La cuenta no tiene correo.");
    const token = randomBytes(32).toString("hex");
    const { error } = await requireAdminClient(app).from("app_users").update({
      email_verification_token_hash: hashSessionToken(token),
      email_verification_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }).eq("id", user.id).is("email_verified_at", null);
    if (error) throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo generar el enlace.");
    try {
      await options.authMailer(user.email, token, "verification");
    } catch {
      request.log.error({ userId: user.id }, "verification email delivery failed");
      throw new AppError(503, "AUTH_EMAIL_UNAVAILABLE", "No se pudo enviar el correo. Intenta nuevamente.");
    }
    return { data: { success: true, message: "Revisa tu correo para verificar la cuenta.",
      ...(config.NODE_ENV !== "production" ? { verificationUrl: authActionUrl(config, token, "verification"), developmentMode: true } : {}),
    } };
  });

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
        description: "Envía un enlace de un solo uso por correo. Nunca devuelve tokens en producción.",
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
      const { data: user, error } = await admin.from("app_users").select("id").ilike("email", email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
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
        try {
          await options.authMailer(email, token, "password-reset");
        } catch {
          // Match the response for unknown emails even when SMTP is unavailable.
          request.log.error({ userId: user.id }, "password reset email delivery failed");
        }
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
      const { error } = await admin.rpc("reset_local_password", {
        p_token_hash: hashSessionToken(token), p_password_hash: await bcrypt.hash(password, 12),
      });
      if (error) {
        if (error.message.includes("password_reset_token_invalid")) throw new AppError(400, "PASSWORD_RESET_TOKEN_INVALID", "El token de reset no es válido o ha expirado.");
        throw new AppError(503, "PASSWORD_RESET_FAILED", "No se pudo actualizar la contraseña.");
      }
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
