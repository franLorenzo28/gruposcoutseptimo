import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../../app.js";
import { loadEnvironment } from "../../config/environment.js";

const config = loadEnvironment({ NODE_ENV: "test" });
let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("operational routes", () => {
  it("expone liveness sin depender de Supabase", async () => {
    app = await buildApp({ config, logger: false });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "gruposcoutseptimo-api",
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("responde 503 cuando Supabase no está listo", async () => {
    app = await buildApp({
      config,
      logger: false,
      readinessProbe: {
        async check() {
          return {
            auth: { status: "up", latencyMs: 2 },
            database: { status: "down", latencyMs: 7, reason: "test failure" },
          };
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/ready" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      status: "not_ready",
      checks: {
        supabaseAuth: { status: "up", latencyMs: 2 },
        supabaseDatabase: { status: "down", latencyMs: 7 },
      },
    });
  });

  it("responde 200 cuando Supabase está listo", async () => {
    app = await buildApp({
      config,
      logger: false,
      readinessProbe: {
        async check() {
          return {
            auth: { status: "up", latencyMs: 3 },
            database: { status: "up", latencyMs: 4 },
          };
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/ready" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ready",
      checks: {
        supabaseAuth: { status: "up", latencyMs: 3 },
        supabaseDatabase: { status: "up", latencyMs: 4 },
      },
    });
  });

  it("usa un error consistente para rutas inexistentes", async () => {
    app = await buildApp({ config, logger: false });

    const response = await app.inject({ method: "GET", url: "/no-existe" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "ROUTE_NOT_FOUND",
        requestId: expect.any(String),
      },
    });
  });

  it("solo habilita CORS para un origen configurado", async () => {
    app = await buildApp({ config, logger: false });

    const allowed = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:5173" },
    });
    const rejected = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://example.invalid" },
    });

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("publica OpenAPI solo en desarrollo", async () => {
    app = await buildApp({
      config: loadEnvironment({ NODE_ENV: "development" }),
      logger: false,
    });

    const response = await app.inject({ method: "GET", url: "/docs/json" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      info: { title: "Grupo Scout Séptimo API", version: "0.1.0" },
    });
  });
});
