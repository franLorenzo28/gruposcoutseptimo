import type { PGlite } from "@electric-sql/pglite";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";
import type { GoogleOAuthClient } from "./google-oauth.js";
import { LocalAuthRepository } from "./local-auth.repository.js";
import { createLocalAuthTestDatabase } from "./local-auth.test-database.js";

let app: FastifyInstance;
let db: PGlite;
let google: GoogleOAuthClient;
let authorizationUrl: GoogleOAuthClient["authorizationUrl"];
let exchangeAndVerify: GoogleOAuthClient["exchangeAndVerify"];

function cookieFrom(response: { headers: Record<string, string | string[] | number | undefined> }): string {
  const header = response.headers["set-cookie"];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== "string") throw new Error("OAuth cookie was not set");
  return value.split(";", 1)[0];
}

async function start(intent: "login" | "signup") {
  const response = await app.inject({ method: "GET", url: `/v1/auth/google?intent=${intent}` });
  expect(response.statusCode).toBe(302);
  const authorization = new URL(response.headers.location!);
  return {
    cookie: cookieFrom(response),
    state: authorization.searchParams.get("state")!,
    nonce: authorization.searchParams.get("nonce")!,
  };
}

beforeEach(async () => {
  db = await createLocalAuthTestDatabase();
  authorizationUrl = vi.fn((state: string, nonce: string) => {
    const url = new URL("https://accounts.example.test/authorize");
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", nonce);
    return url.toString();
  });
  exchangeAndVerify = vi.fn(async () => ({
    subject: "google-subject", email: "google@example.com", emailVerified: true,
    name: "Grace Hopper", givenName: "Grace", familyName: "Hopper",
  }));
  google = { authorizationUrl, exchangeAndVerify };
  app = await buildApp({
    logger: false,
    authMailer: vi.fn(),
    googleOAuthClient: google,
    config: loadEnvironment({
      NODE_ENV: "test", AUTH_MODE: "local", APP_URL: "https://app.example.test",
      SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE_KEY: "service-key",
      JWT_SECRET: "a-secret-with-at-least-32-characters-long",
      GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "client-secret",
      GOOGLE_REDIRECT_URI: "https://api.example.test/v1/auth/google/callback",
    }),
  });
  app.db = db as unknown as FastifyInstance["db"];
});

afterEach(async () => {
  await app?.close();
  await db?.close();
});

describe("local Google OAuth HTTP flow", () => {
  it("binds the callback to state, browser cookie and nonce, then completes signup once", async () => {
    const initiated = await start("signup");
    const response = await app.inject({
      method: "GET",
      url: `/v1/auth/google/callback?code=authorization-code&state=${initiated.state}`,
      headers: { cookie: initiated.cookie },
    });
    expect(response.statusCode).toBe(302);
    expect(exchangeAndVerify).toHaveBeenCalledWith("authorization-code", initiated.nonce);
    const redirect = new URL(response.headers.location!);
    expect(`${redirect.origin}${redirect.pathname}`).toBe("https://app.example.test/interno/auth/callback");
    const ticket = new URLSearchParams(redirect.hash.slice(1)).get("oauth_ticket")!;
    expect(ticket).toMatch(/^[a-f0-9]{64}$/);

    const inspection = await app.inject({
      method: "POST", url: "/v1/auth/google/ticket", payload: { ticket },
    });
    expect(inspection.statusCode).toBe(200);
    expect(inspection.json().data).toMatchObject({ intent: "signup", email: "google@example.com" });

    const profile = { ticket, nombre: "Grace", apellido: "Hopper", grupo_scout: "septimo" };
    const completed = await app.inject({
      method: "POST", url: "/v1/registration-requests/oauth/local", payload: profile,
    });
    expect(completed.statusCode).toBe(202);
    const repeated = await app.inject({
      method: "POST", url: "/v1/registration-requests/oauth/local", payload: profile,
    });
    expect(repeated.statusCode).toBe(400);
    expect(repeated.json().error.code).toBe("OAUTH_TICKET_INVALID");
  });

  it("rejects a callback whose state does not match before exchanging the code", async () => {
    const initiated = await start("signup");
    const response = await app.inject({
      method: "GET",
      url: `/v1/auth/google/callback?code=authorization-code&state=${"a".repeat(64)}`,
      headers: { cookie: initiated.cookie },
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain("oauth_error=invalid_oauth_state");
    expect(exchangeAndVerify).not.toHaveBeenCalled();
  });

  it("exchanges an active Google account ticket for a revocable local session", async () => {
    const repository = new LocalAuthRepository(app);
    const linked = await repository.linkGoogleIdentity("google@example.com", "google-subject", { name: "Grace Hopper" }, "signup");
    await db.query("update public.app_users set account_status = 'activo', app_metadata = app_metadata || '{\"account_status\":\"activo\"}' where id = $1", [linked.user_id]);

    const initiated = await start("login");
    const callback = await app.inject({
      method: "GET",
      url: `/v1/auth/google/callback?code=authorization-code&state=${initiated.state}`,
      headers: { cookie: initiated.cookie },
    });
    const ticket = new URLSearchParams(new URL(callback.headers.location!).hash.slice(1)).get("oauth_ticket")!;
    const exchange = await app.inject({
      method: "POST", url: "/v1/auth/google/exchange", payload: { ticket },
    });
    expect(exchange.statusCode).toBe(200);
    expect(exchange.json().data).toMatchObject({ token_type: "bearer" });
    expect(exchange.json().data.access_token).toEqual(expect.any(String));
    expect((await db.query("select id from public.app_sessions where revoked_at is null")).rows).toHaveLength(1);

    const repeated = await app.inject({
      method: "POST", url: "/v1/auth/google/exchange", payload: { ticket },
    });
    expect(repeated.statusCode).toBe(400);
  });
});
