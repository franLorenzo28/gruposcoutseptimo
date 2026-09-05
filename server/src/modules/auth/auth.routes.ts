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
import { recordAuthAudit } from "./auth-audit.js";
import { LocalAuthRepository } from "./local-auth.repository.js";
import type { GoogleOAuthClient } from "./google-oauth.js";

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "La contraseña no puede superar 72 bytes."),
});

const requestResetSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const resetSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(256).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "La contraseña no puede superar 72 bytes."),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(256).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  new_password: z.string().min(8).max(256).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "La contraseña no puede superar 72 bytes."),
});
const googleStartSchema = z.object({ intent: z.enum(["login", "signup"]).default("login") });
const googleCallbackSchema = z.object({
  code: z.string().min(1).max(4096).optional(),
  state: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  error: z.string().max(200).optional(),
});
const oauthTicketSchema = z.object({ ticket: z.string().regex(/^[a-f0-9]{64}$/) });
const GOOGLE_BROWSER_COOKIE = "grupo7_google_oauth";

type SessionClaims = { sub: string; jti: string; typ: "access"; exp?: number };

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
  const repository = new LocalAuthRepository(app);
  let row;
  try { row = await repository.findCredentialsByEmail(email); }
  catch { throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo iniciar sesión."); }
  if (!row?.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
    throw new AppError(401, "AUTH_CREDENTIALS_INVALID", "El correo o la contraseña no son válidos.");
  }
  if (row.password_reset_required) {
    throw new AppError(403, "PASSWORD_RESET_REQUIRED", "Debes establecer una nueva contraseña antes de continuar.");
  }
  if (!row.email_verified_at) {
    throw new AppError(403, "EMAIL_VERIFICATION_REQUIRED", "Debes verificar tu correo antes de continuar.");
  }
  if (row.account_status !== "activo") {
    const rejected = row.account_status === "rechazado";
    throw new AppError(
      403,
      rejected ? "ACCOUNT_REJECTED" : "ACCOUNT_PENDING_APPROVAL",
      rejected
        ? "La solicitud de acceso fue rechazada. Contacta a administración si necesitas ayuda."
        : "Tu cuenta está pendiente de aprobación por administración.",
      { status: row.account_status ?? "pendiente_aprobacion" },
    );
  }

  const session = signLocalToken(row.id, config);
  try {
    await repository.createSession({ id: session.sessionId, user_id: row.id,
      token_hash: hashSessionToken(session.token), expires_at: session.expiresAt });
  } catch { throw new AppError(503, "AUTH_SESSION_CREATE_FAILED", "No se pudo crear la sesión."); }

  const user = localUserFromRow(row as LocalUserRow);
  return {
    access_token: session.token,
    token_type: "bearer",
    expires_at: session.expiresAt,
    user: publicUser(user),
  };
}

export const authRoutes: FastifyPluginAsyncZod<{
  config: EnvironmentConfig;
  authMailer: AuthMailer;
  googleOAuthClient: GoogleOAuthClient | null;
}> = async (app, options) => {
  const config = options.config;
  const localRepository = new LocalAuthRepository(app);

  app.post("/v1/auth/request-verification", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: requestResetSchema },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(501, "AUTH_EXTERNAL_PROVIDER", "La verificación corresponde al proveedor externo.");
    const token = randomBytes(32).toString("hex");
    let userId: string | null;
    try {
      userId = await localRepository.setVerificationTokenByEmail(request.body.email, hashSessionToken(token), new Date(Date.now() + 86_400_000).toISOString());
    } catch { throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo procesar la solicitud."); }
    if (userId) {
      try { await options.authMailer(request.body.email, token, "verification"); }
      catch { request.log.error({ userId }, "verification email delivery failed"); }
    }
    await recordAuthAudit(app, request, {
      eventType: "email_verification_requested", success: true,
      subjectUserId: userId, email: request.body.email,
    });
    return { data: { accepted: true, ...(userId && config.NODE_ENV !== "production"
      ? { verificationUrl: authActionUrl(config, token, "verification") } : {}) } };
  });

  app.post("/v1/auth/verify-email", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }) },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(501, "AUTH_EXTERNAL_PROVIDER", "La verificación corresponde al proveedor externo.");
    try {
      const data = await localRepository.verifyEmail(hashSessionToken(request.body.token));
      await recordAuthAudit(app, request, {
        eventType: "email_verified", success: true,
        subjectUserId: typeof data.userId === "string" ? data.userId : null,
      });
      return { data };
    } catch (error) {
      await recordAuthAudit(app, request, {
        eventType: "email_verified", success: false,
        details: { code: error instanceof Error && error.message.includes("verification_token_invalid")
          ? "VERIFICATION_TOKEN_INVALID" : "VERIFICATION_UNAVAILABLE" },
      });
      if (error instanceof Error && error.message.includes("verification_token_invalid")) throw new AppError(400, "VERIFICATION_TOKEN_INVALID", "El enlace no es válido o ha expirado.");
      throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo verificar el correo.");
    }
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
    try { await localRepository.setVerificationTokenById(user.id, hashSessionToken(token), new Date(Date.now() + 86_400_000).toISOString()); }
    catch { throw new AppError(503, "VERIFICATION_UNAVAILABLE", "No se pudo generar el enlace."); }
    try {
      await options.authMailer(user.email, token, "verification");
    } catch {
      request.log.error({ userId: user.id }, "verification email delivery failed");
      throw new AppError(503, "AUTH_EMAIL_UNAVAILABLE", "No se pudo enviar el correo. Intenta nuevamente.");
    }
    await recordAuthAudit(app, request, {
      eventType: "email_verification_requested", success: true,
      subjectUserId: user.id, email: user.email,
    });
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
      if (config.AUTH_MODE === "local") {
        try {
          const data = await localLogin(app, config, email, password);
          await recordAuthAudit(app, request, {
            eventType: "login", success: true, subjectUserId: data.user.id, email,
          });
          return { data };
        } catch (error) {
          await recordAuthAudit(app, request, {
            eventType: "login", success: false, email,
            details: { code: error instanceof AppError ? error.code : "LOGIN_FAILED" },
          });
          throw error;
        }
      }

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
        if (request.authSessionId) {
          try { await localRepository.revokeSession(request.authSessionId, request.authUser!.id); }
          catch { throw new AppError(503, "AUTH_LOGOUT_FAILED", "No se pudo cerrar la sesión."); }
        }
        await recordAuthAudit(app, request, {
          eventType: "logout", success: true, subjectUserId: request.authUser!.id,
        });
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

      let userId: string | null;
      try { userId = await localRepository.findUserIdByEmail(email); }
      catch { throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo procesar la solicitud."); }
      const response: { accepted: boolean; reset_token?: string } = { accepted: true };
      if (userId) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + config.PASSWORD_RESET_TTL_MINUTES * 60_000).toISOString();
        try { await localRepository.setPasswordResetToken(userId, hashSessionToken(token), expiresAt); }
        catch { throw new AppError(503, "PASSWORD_RESET_CREATE_FAILED", "No se pudo procesar la solicitud."); }
        try {
          await options.authMailer(email, token, "password-reset");
        } catch {
          // Match the response for unknown emails even when SMTP is unavailable.
          request.log.error({ userId }, "password reset email delivery failed");
        }
        if (config.NODE_ENV !== "production") response.reset_token = token;
      }
      await recordAuthAudit(app, request, {
        eventType: "password_reset_requested", success: true, subjectUserId: userId, email,
      });
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
      const { token, password } = request.body;
      try {
        await localRepository.resetPassword(hashSessionToken(token), await bcrypt.hash(password, 12));
      } catch (error) {
        await recordAuthAudit(app, request, {
          eventType: "password_reset_completed", success: false,
          details: { code: error instanceof Error && error.message.includes("password_reset_token_invalid")
            ? "PASSWORD_RESET_TOKEN_INVALID" : "PASSWORD_RESET_FAILED" },
        });
        if (error instanceof Error && error.message.includes("password_reset_token_invalid")) throw new AppError(400, "PASSWORD_RESET_TOKEN_INVALID", "El token de reset no es válido o ha expirado.");
        throw new AppError(503, "PASSWORD_RESET_FAILED", "No se pudo actualizar la contraseña.");
      }
      await recordAuthAudit(app, request, { eventType: "password_reset_completed", success: true });
      return { data: { reset: true } };
    },
  );

  app.post(
    "/v1/auth/change-password",
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: { tags: ["auth"], summary: "Cambia la contraseña local y revoca todas las sesiones", body: changePasswordSchema },
    },
    async (request) => {
      if (config.AUTH_MODE !== "local") throw new AppError(501, "PASSWORD_CHANGE_EXTERNAL_PROVIDER", "El cambio corresponde al proveedor externo.");
      let passwordHash: string | null;
      try { passwordHash = await localRepository.findPasswordHash(request.authUser!.id); }
      catch { throw new AppError(503, "AUTH_DATABASE_UNAVAILABLE", "No se pudo cambiar la contraseña."); }
      if (!passwordHash || !(await bcrypt.compare(request.body.current_password, passwordHash))) {
        throw new AppError(401, "AUTH_CREDENTIALS_INVALID", "La contraseña actual no es válida.");
      }
      try { await localRepository.changePassword(request.authUser!.id, await bcrypt.hash(request.body.new_password, 12)); }
      catch { throw new AppError(503, "PASSWORD_CHANGE_FAILED", "No se pudo cambiar la contraseña."); }
      await recordAuthAudit(app, request, {
        eventType: "password_changed", success: true, subjectUserId: request.authUser!.id,
      });
      return { data: { changed: true, sessions_revoked: true } };
    },
  );

  app.post(
    "/v1/auth/logout-all",
    { preHandler: app.authenticate, schema: { tags: ["auth"], summary: "Revoca todas las sesiones locales" } },
    async (request) => {
      if (config.AUTH_MODE !== "local") throw new AppError(501, "SESSION_REVOCATION_EXTERNAL_PROVIDER", "La revocación corresponde al proveedor externo.");
      try { await localRepository.revokeAllSessions(request.authUser!.id); }
      catch { throw new AppError(503, "AUTH_LOGOUT_FAILED", "No se pudieron cerrar las sesiones."); }
      await recordAuthAudit(app, request, {
        eventType: "sessions_revoked", success: true, subjectUserId: request.authUser!.id,
      });
      return { data: { logged_out: true, all_sessions: true } };
    },
  );

  const oauthRedirect = (values: Record<string, string>) => {
    const target = new URL("/interno/auth/callback", config.APP_URL);
    target.hash = new URLSearchParams(values).toString();
    return target.toString();
  };

  app.get("/v1/auth/google", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], summary: "Inicia Google OAuth local", querystring: googleStartSchema },
  }, async (request, reply) => {
    if (config.AUTH_MODE !== "local" || !options.googleOAuthClient) {
      throw new AppError(503, "GOOGLE_OAUTH_NOT_CONFIGURED", "El acceso con Google no está configurado.");
    }
    const state = randomBytes(32).toString("hex");
    const browser = randomBytes(32).toString("hex");
    const nonce = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + config.GOOGLE_OAUTH_TTL_MINUTES * 60_000).toISOString();
    try {
      await localRepository.createOAuthState(hashSessionToken(state), hashSessionToken(browser), nonce, request.query.intent, expiresAt);
    } catch {
      throw new AppError(503, "GOOGLE_OAUTH_UNAVAILABLE", "No se pudo iniciar el acceso con Google.");
    }
    await recordAuthAudit(app, request, {
      eventType: "google_oauth_started", success: true, details: { intent: request.query.intent },
    });
    reply.setCookie(GOOGLE_BROWSER_COOKIE, browser, {
      httpOnly: true, secure: config.NODE_ENV === "production", sameSite: "lax",
      path: "/v1/auth/google/callback", maxAge: config.GOOGLE_OAUTH_TTL_MINUTES * 60,
    });
    return reply.redirect(options.googleOAuthClient.authorizationUrl(state, nonce), 302);
  });

  app.get("/v1/auth/google/callback", {
    config: { rateLimit: { max: 20, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], summary: "Completa Google OAuth local", querystring: googleCallbackSchema },
  }, async (request, reply) => {
    const fail = async (code: string) => {
      await recordAuthAudit(app, request, {
        eventType: "google_oauth_callback", success: false, details: { code },
      });
      return reply.redirect(oauthRedirect({ oauth_error: code }), 302);
    };
    const browser = request.cookies[GOOGLE_BROWSER_COOKIE];
    reply.clearCookie(GOOGLE_BROWSER_COOKIE, { path: "/v1/auth/google/callback" });
    if (request.query.error) return fail("access_denied");
    if (config.AUTH_MODE !== "local" || !options.googleOAuthClient || !request.query.code || !request.query.state || !browser) {
      return fail("invalid_oauth_response");
    }
    let state;
    try {
      state = await localRepository.consumeOAuthState(hashSessionToken(request.query.state), hashSessionToken(browser));
    } catch {
      return fail("oauth_unavailable");
    }
    if (!state) return fail("invalid_oauth_state");
    try {
      const identity = await options.googleOAuthClient.exchangeAndVerify(request.query.code, state.nonce);
      if (!identity.emailVerified) return fail("google_email_not_verified");
      const metadata = {
        name: identity.name, full_name: identity.name, given_name: identity.givenName,
        family_name: identity.familyName, avatar_url: identity.picture,
      };
      const linked = await localRepository.linkGoogleIdentity(identity.email, identity.subject, metadata, state.intent);
      if (linked.account_missing || !linked.user_id) return fail("account_not_found");
      if (linked.status === "rechazado") return fail("account_rejected");
      const ticketIntent: "login" | "signup" = linked.status === "activo" ? "login" : "signup";
      if (ticketIntent === "signup" && state.intent !== "signup") return fail("account_pending_approval");
      const ticket = randomBytes(32).toString("hex");
      await localRepository.createOAuthTicket(hashSessionToken(ticket), linked.user_id, ticketIntent,
        new Date(Date.now() + config.GOOGLE_OAUTH_TTL_MINUTES * 60_000).toISOString());
      await recordAuthAudit(app, request, {
        eventType: "google_oauth_callback", success: true,
        subjectUserId: linked.user_id, email: identity.email,
        details: { intent: state.intent, ticketIntent, isNew: Boolean(linked.is_new) },
      });
      return reply.redirect(oauthRedirect({ oauth_ticket: ticket, oauth_intent: ticketIntent }), 302);
    } catch (error) {
      request.log.warn({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Google OAuth callback failed");
      return fail("oauth_verification_failed");
    }
  });

  app.post("/v1/auth/google/ticket", {
    config: { rateLimit: { max: 20, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: oauthTicketSchema },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(404, "ROUTE_NOT_FOUND", "La ruta no está disponible.");
    const ticket = await localRepository.findOAuthTicket(hashSessionToken(request.body.ticket));
    if (!ticket) throw new AppError(400, "OAUTH_TICKET_INVALID", "La sesión de Google no es válida o ha expirado.");
    return { data: { intent: ticket.intent, email: ticket.email, user_metadata: ticket.user_metadata } };
  });

  app.post("/v1/auth/google/exchange", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    schema: { tags: ["auth"], body: oauthTicketSchema },
  }, async (request) => {
    if (config.AUTH_MODE !== "local") throw new AppError(404, "ROUTE_NOT_FOUND", "La ruta no está disponible.");
    let subjectUserId: string | null = null;
    try {
      const ticket = await localRepository.consumeOAuthTicket(hashSessionToken(request.body.ticket), "login");
      if (!ticket) throw new AppError(400, "OAUTH_TICKET_INVALID", "La sesión de Google no es válida o ha expirado.");
      subjectUserId = ticket.user_id;
      const user = await localRepository.findUserById(ticket.user_id);
      if (!user || !user.email_verified_at || user.account_status !== "activo") {
        throw new AppError(403, "ACCOUNT_NOT_ACTIVE", "La cuenta todavía no está habilitada.");
      }
      const session = signLocalToken(user.id, config);
      await localRepository.createSession({ id: session.sessionId, user_id: user.id,
        token_hash: hashSessionToken(session.token), expires_at: session.expiresAt });
      await recordAuthAudit(app, request, {
        eventType: "google_oauth_session_created", success: true, subjectUserId: user.id, email: user.email,
      });
      return { data: { access_token: session.token, token_type: "bearer", expires_at: session.expiresAt,
        user: publicUser(localUserFromRow(user)) } };
    } catch (error) {
      await recordAuthAudit(app, request, {
        eventType: "google_oauth_session_created", success: false, subjectUserId,
        details: { code: error instanceof AppError ? error.code : "OAUTH_EXCHANGE_FAILED" },
      });
      throw error;
    }
  });
};
