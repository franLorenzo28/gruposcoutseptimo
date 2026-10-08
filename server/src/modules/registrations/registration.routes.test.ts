import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";

let app: FastifyInstance | undefined;
afterEach(async () => { await app?.close(); app = undefined; });

describe("public registration boundary", () => {
  it("creates a public account without an internal registration request", async () => {
    const signUp = vi.fn(async () => ({ data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } }, error: null }));
    app = await buildApp({
      config: loadEnvironment({ NODE_ENV: "test", SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key", SUPABASE_SERVICE_ROLE_KEY: "service-key" }),
      logger: false,
    });
    (app as any).createPublicSupabase = () => ({ auth: { signUp } });
    const response = await app.inject({ method: "POST", url: "/v1/public/register",
      payload: { nombre_completo: "Ada Lovelace", email: "ada@example.com", password: "strong-password" } });
    expect(response.statusCode).toBe(202);
    expect(signUp).toHaveBeenCalledWith({ email: "ada@example.com", password: "strong-password",
      options: { data: { nombre_completo: "Ada Lovelace", account_kind: "publico" } } });
    expect(response.json().data).toEqual({ accepted: true });
  });

  it("rejects self-registration for internal access", async () => {
    app = await buildApp({
      config: loadEnvironment({ NODE_ENV: "test", SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key", SUPABASE_SERVICE_ROLE_KEY: "service-key" }),
      logger: false,
    });
    const attempts = [
      { url: "/v1/registration-requests", payload: { nombre: "Ada", apellido: "Lovelace", email: "ada@example.com", password: "strong-password" } },
      { url: "/v1/registration-requests/oauth", payload: { nombre: "Ada", apellido: "Lovelace" } },
      { url: "/v1/registration-requests/oauth/local", payload: { nombre: "Ada", apellido: "Lovelace", ticket: "a".repeat(64) } },
    ];
    for (const { url, payload } of attempts) {
      const response = await app.inject({ method: "POST", url, payload });
      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("INTERNAL_REGISTRATION_CLOSED");
    }
  });
});
