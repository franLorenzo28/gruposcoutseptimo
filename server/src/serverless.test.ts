import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";
import { createServerlessHandler, loadVercelEnvironment } from "./serverless.js";

let server: Server | undefined;
let app: FastifyInstance | undefined;

async function start(createApp: () => Promise<FastifyInstance>) {
  server = createServer(createServerlessHandler(createApp));
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

async function buildTestApp() {
  app = await buildApp({ config: loadEnvironment({ NODE_ENV: "test" }), logger: false });
  return app;
}

afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
    server = undefined;
  }
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
});

describe("Vercel HTTP adapter", () => {
  it("shares cold starts and preserves URLs, queries and JSON request bodies", async () => {
    const factory = vi.fn(async () => {
      const instance = await buildTestApp();
      instance.post("/echo", async (request) => ({ query: request.query, body: request.body }));
      return instance;
    });
    const base = await start(factory);
    const responses = await Promise.all([
      fetch(`${base}/api/health`),
      fetch(`${base}/api/echo?name=a%2Bb`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: "hola" }),
      }),
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(responses[0].status).toBe(200);
    expect(await responses[1].json()).toEqual({ query: { name: "a+b" }, body: { value: "hola" } });
  });

  it("enforces authentication and registration validation through the deployed entrypoint", async () => {
    const base = await start(buildTestApp);
    for (const path of ["/v1/me/access", "/v1/admin/users", "/v1/admin/dashboard-data"]) {
      const result = await fetch(`${base}/api${path}`);
      expect(result.status).toBe(401);
      expect(result.headers.get("content-type")).toContain("application/json");
    }
    const result = await fetch(`${base}/api/v1/registration-requests`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    expect(result.status).toBe(400);
    const missing = await fetch(`${base}/api/nonexistent`);
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("application/json");
  });

  it("returns a sanitized JSON failure and retries initialization on the next request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const factory = vi.fn().mockRejectedValueOnce(new Error("private-config-value")).mockImplementationOnce(buildTestApp);
    const base = await start(factory);
    const failure = await fetch(`${base}/api/health`);
    expect(failure.status).toBe(503);
    expect(failure.headers.get("cache-control")).toBe("no-store");
    expect(await failure.text()).not.toContain("private-config-value");
    expect((await fetch(`${base}/api/health`)).status).toBe(200);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("Vercel environment", () => {
  const source = {
    VITE_SUPABASE_URL: "https://project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "public-key",
    SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    VERCEL_PROJECT_PRODUCTION_URL: "scouts.vercel.app",
  };

  it("reuses existing public configuration and keeps the service key server-only", () => {
    expect(loadVercelEnvironment(source)).toMatchObject({
      NODE_ENV: "production", AUTH_MODE: "supabase",
      SUPABASE_URL: source.VITE_SUPABASE_URL, SUPABASE_KEY: "public-key",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
      APP_URL: "https://scouts.vercel.app", CORS_ORIGINS: ["https://scouts.vercel.app"],
    });
  });

  it("requires the private server key even when public configuration exists", () => {
    expect(() => loadVercelEnvironment({ ...source, SUPABASE_SERVICE_ROLE_KEY: undefined }))
      .toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("gives explicit server configuration precedence over frontend variables", () => {
    expect(loadVercelEnvironment({ ...source, SUPABASE_URL: "https://other.supabase.co",
      SUPABASE_ANON_KEY: "other-public", APP_URL: "https://scouts.example.com", ORIGIN: "https://allowed.example.com" }))
      .toMatchObject({ SUPABASE_URL: "https://other.supabase.co", SUPABASE_KEY: "other-public",
        APP_URL: "https://scouts.example.com", CORS_ORIGINS: ["https://allowed.example.com"] });
  });
});
