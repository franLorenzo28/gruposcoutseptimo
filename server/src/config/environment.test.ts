import { describe, expect, it } from "vitest";

import { loadEnvironment } from "./environment.js";

describe("loadEnvironment", () => {
  it("requires mail and HTTPS for production local auth", () => {
    expect(() => loadEnvironment({
      NODE_ENV: "production", AUTH_MODE: "local", SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-key", JWT_SECRET: "a-secret-with-at-least-32-characters-long",
    })).toThrow("SMTP_HOST, SMTP_FROM y APP_URL con HTTPS");
  });
  it("aplica valores seguros para desarrollo", () => {
    const config = loadEnvironment({ NODE_ENV: "test" });

    expect(config.PORT).toBe(4000);
    expect(config.BODY_LIMIT_BYTES).toBe(1_048_576);
    expect(config.READINESS_CACHE_MS).toBe(5_000);
    expect(config.CORS_ORIGINS).toEqual([
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]);
    expect(config.SUPABASE_KEY).toBeUndefined();
    expect(config.AUTH_MODE).toBe("supabase");
    expect(config.ADMIN_USER_IDS).toEqual([]);
    expect(config.ADMIN_EMAILS).toEqual([]);
  });

  it("acepta la anon key como transición", () => {
    const config = loadEnvironment({
      NODE_ENV: "test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    expect(config.SUPABASE_KEY).toBe("anon-key");
  });

  it("rechaza una configuración parcial de Supabase", () => {
    expect(() =>
      loadEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("deben configurarse juntas");
  });

  it("exige Supabase en producción", () => {
    expect(() => loadEnvironment({ NODE_ENV: "production" })).toThrow(
      "Supabase debe estar configurado",
    );
  });

  it("normaliza las listas de administradores", () => {
    const config = loadEnvironment({
      NODE_ENV: "test",
      ADMIN_USER_IDS: "550e8400-e29b-41d4-a716-446655440000",
      ADMIN_EMAILS: " Admin@Example.com,other@example.com ",
    });

    expect(config.ADMIN_USER_IDS).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
    expect(config.ADMIN_EMAILS).toEqual(["admin@example.com", "other@example.com"]);
  });

  it("valida la configuración mínima del modo local", () => {
    const config = loadEnvironment({
      NODE_ENV: "test",
      AUTH_MODE: "local",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
      JWT_SECRET: "a-secret-with-at-least-32-characters-long",
    });

    expect(config.AUTH_MODE).toBe("local");
    expect(config.JWT_ACCESS_TTL).toBe("1h");
  });

  it("rechaza modo local sin secreto JWT", () => {
    expect(() =>
      loadEnvironment({
        NODE_ENV: "test",
        AUTH_MODE: "local",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      }),
    ).toThrow("JWT_SECRET es obligatorio");
  });
});
