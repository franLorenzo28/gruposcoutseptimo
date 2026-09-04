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
});
