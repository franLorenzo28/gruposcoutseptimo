import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../app.js";
import { loadEnvironment } from "../config/environment.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("authentication hook", () => {
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
});
