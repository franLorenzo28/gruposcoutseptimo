import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

import { buildApp } from "../app.js";
import { loadEnvironment } from "../config/environment.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("authentication hook", () => {
  it("rechaza los datos del panel admin sin una sesión aunque la ruta se abra directamente", async () => {
    app = await buildApp({ config: loadEnvironment({ NODE_ENV: "test" }), logger: false });
    for (const url of ["/v1/me/access", "/v1/admin/users", "/v1/admin/dashboard-data", "/v1/admin/registration-requests", "/v1/admin/educator-permission-requests"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(401);
      expect(response.json()).toMatchObject({ error: { code: "AUTH_TOKEN_MISSING" } });
    }
  });
  it("rechaza una ruta protegida cuando falta el bearer token", async () => {
    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
      logger: false,
    });
    app.get("/protected", { preHandler: app.authenticate }, async () => ({ ok: true }));

    const response = await app.inject({ method: "GET", url: "/protected" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "AUTH_TOKEN_MISSING",
        requestId: expect.any(String),
      },
    });
  });

  it("no acepta un rol admin autodeclarado en user_metadata", async () => {
    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      }),
      logger: false,
    });
    (app as any).supabase = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              email: "member@example.com",
              app_metadata: {},
              user_metadata: { role: "admin" },
            },
          },
          error: null,
        }),
      },
    };

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/users",
      headers: { authorization: "Bearer valid-user-token" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: { code: "ADMIN_REQUIRED" } });
  });

  it("selecciona JWT local y persiste la sesión sin usar Supabase Auth", async () => {
    const user = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "member@example.com",
      password_hash: bcrypt.hashSync("correct-password", 4),
      password_reset_required: false,
      email_verified_at: new Date().toISOString(),
      account_status: "activo",
      app_metadata: {},
      user_metadata: {},
    };
    let session: Record<string, string> | undefined;

    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test",
        AUTH_MODE: "local",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
        JWT_SECRET: "a-secret-with-at-least-32-characters-long",
      }),
      logger: false,
    });
    (app as any).supabaseAdmin = {
      from: (table: string) => {
        const filters: Record<string, string> = {};
        const query = {
          select: () => query,
          eq: (field: string, value: string) => {
            filters[field] = value;
            return query;
          },
          maybeSingle: async () => {
            if (table === "app_users") return { data: user, error: null };
            if (table === "app_sessions") {
              return {
                data: session && Object.entries(filters).every(([key, value]) => session?.[key] === value)
                  ? { ...session, revoked_at: null }
                  : null,
                error: null,
              };
            }
            return { data: null, error: null };
          },
          insert: async (value: Record<string, string>) => {
            if (table === "app_sessions") session = value;
            return { error: null };
          },
        };
        return query;
      },
    };

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: user.email, password: "correct-password" },
    });

    expect(login.statusCode).toBe(200);
    expect(login.json()).toMatchObject({ data: { token_type: "bearer", user: { id: user.id } } });
    expect(session?.user_id).toBe(user.id);

    const currentSession = await app.inject({
      method: "GET",
      url: "/v1/auth/session",
      headers: { authorization: `Bearer ${login.json().data.access_token}` },
    });

    expect(currentSession.statusCode).toBe(200);
    expect(currentSession.json()).toMatchObject({ data: { user: { id: user.id, email: user.email } } });
  });

  it("no crea sesiones locales para cuentas sin verificar o aún pendientes", async () => {
    const sessionInsert = vi.fn();
    const auditInsert = vi.fn(async () => ({ error: null }));
    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test", AUTH_MODE: "local",
        SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key",
        JWT_SECRET: "a-secret-with-at-least-32-characters-long",
      }),
      logger: false,
    });
    let userRow = {
      id: "550e8400-e29b-41d4-a716-446655440000", email: "member@example.com",
      password_hash: bcrypt.hashSync("correct-password", 4), password_reset_required: false,
      email_verified_at: null as string | null, account_status: "pendiente_email",
      app_metadata: {}, user_metadata: {},
    };
    (app as any).supabaseAdmin = { from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: userRow, error: null }),
        insert: table === "app_sessions" ? sessionInsert : auditInsert,
      };
      return query;
    } };

    const response = await app.inject({ method: "POST", url: "/v1/auth/login", payload: {
      email: "member@example.com", password: "correct-password",
    } });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    expect(sessionInsert).not.toHaveBeenCalled();

    userRow = { ...userRow, email_verified_at: new Date().toISOString(), account_status: "pendiente_aprobacion" };
    const pending = await app.inject({ method: "POST", url: "/v1/auth/login", payload: {
      email: "member@example.com", password: "correct-password",
    } });
    expect(pending.statusCode).toBe(403);
    expect(pending.json().error.code).toBe("ACCOUNT_PENDING_APPROVAL");
    expect(sessionInsert).not.toHaveBeenCalled();
  });
});
