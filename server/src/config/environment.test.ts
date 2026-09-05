import { describe, expect, it } from "vitest";

import { loadEnvironment } from "./environment.js";

describe("loadEnvironment", () => {
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
});
