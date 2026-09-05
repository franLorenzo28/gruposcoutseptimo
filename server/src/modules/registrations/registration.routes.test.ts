import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

const validBody = {
  email: "scout@example.com",
  password: "a-strong-password",
  nombre: "Ada",
  apellido: "Lovelace",
  grupo_scout: "septimo",
  rama: "rovers",
  nombre_scout_relacionado: null,
};

describe("registration routes", () => {
  it("entrega el password sólo a Auth y nunca lo persiste", async () => {
    const insert = vi.fn(async (_value: unknown) => ({ error: null }));
    const signUp = vi.fn(async () => ({
      data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } },
      error: null,
    }));
    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      }),
      logger: false,
    });

    (app as any).supabaseAdmin = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert,
      }),
    };
    (app as any).createPublicSupabase = () => ({ auth: { signUp } });

    const response = await app.inject({ method: "POST", url: "/v1/registration-requests", payload: validBody });

    expect(response.statusCode).toBe(202);
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ password: validBody.password }));
    expect(insert).toHaveBeenCalledOnce();
    const persisted = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(persisted).not.toHaveProperty("password");
    expect(persisted).not.toHaveProperty("password_hash");
    expect(persisted).toMatchObject({
      auth_user_id: "550e8400-e29b-41d4-a716-446655440000",
      email: "scout@example.com",
      status: "pending",
    });
  });

  it("responde de forma genérica ante una solicitud existente", async () => {
    const signUp = vi.fn();
    app = await buildApp({
      config: loadEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      }),
      logger: false,
    });
    (app as any).supabaseAdmin = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "existing" }, error: null }) }) }),
      }),
    };
    (app as any).createPublicSupabase = () => ({ auth: { signUp } });

    const response = await app.inject({ method: "POST", url: "/v1/registration-requests", payload: validBody });

    expect(response.statusCode).toBe(202);
    expect(signUp).not.toHaveBeenCalled();
    expect(response.json().data).not.toHaveProperty("exists");
  });
});
