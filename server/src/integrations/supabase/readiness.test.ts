import { describe, expect, it, vi } from "vitest";

import { loadEnvironment } from "../../config/environment.js";
import { createSupabaseReadinessProbe } from "./readiness.js";

const config = loadEnvironment({
  NODE_ENV: "test",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_TIMEOUT_MS: "1000",
});

describe("Supabase readiness probe", () => {
  it("consulta el health check oficial de Auth", async () => {
    const fetchImplementation = vi.fn(async () => new Response("{}", { status: 200 }));
    const probe = createSupabaseReadinessProbe(config, fetchImplementation);

    await expect(probe.check()).resolves.toMatchObject({
      auth: { status: "up" },
      database: { status: "up" },
    });
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      "https://example.supabase.co/auth/v1/health",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ apikey: "publishable-key" }),
      }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      "https://example.supabase.co/rest/v1/profiles?select=id&limit=1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("marca la dependencia como caída ante una respuesta no exitosa", async () => {
    const probe = createSupabaseReadinessProbe(
      config,
      async (input) =>
        new Response("{}", {
          status: String(input).includes("/rest/v1/") ? 503 : 200,
        }),
    );

    await expect(probe.check()).resolves.toMatchObject({
      auth: { status: "up" },
      database: { status: "down", reason: "HTTP 503" },
    });
  });

  it("cachea brevemente el resultado para no golpear Supabase por cada sonda", async () => {
    const fetchImplementation = vi.fn(async () => new Response("{}", { status: 200 }));
    const probe = createSupabaseReadinessProbe(config, fetchImplementation);

    await Promise.all([probe.check(), probe.check(), probe.check()]);
    await probe.check();

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });
});
