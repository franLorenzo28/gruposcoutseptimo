import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";

import { buildApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";

export function loadVercelEnvironment(source: NodeJS.ProcessEnv = process.env) {
  const appUrl = source.APP_URL || source.VITE_APP_URL ||
    (source.VERCEL_PROJECT_PRODUCTION_URL ? `https://${source.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  return loadEnvironment({
    ...source,
    NODE_ENV: "production",
    SUPABASE_URL: source.SUPABASE_URL || source.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: source.SUPABASE_ANON_KEY || source.VITE_SUPABASE_ANON_KEY,
    APP_URL: appUrl,
    ORIGIN: source.ORIGIN || appUrl,
  });
}

export function createServerlessHandler(
  createApp: () => Promise<FastifyInstance> = () => buildApp({ config: loadVercelEnvironment() }),
) {
  // Concurrent cold-start requests must share a single initialization.
  let appPromise: Promise<FastifyInstance> | undefined;

  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      appPromise ??= (async () => {
        const app = await createApp();
        try {
          await app.ready();
          return app;
        } catch (error) {
          await app.close();
          throw error;
        }
      })().catch((error: unknown) => {
        appPromise = undefined;
        throw error;
      });
      const app = await appPromise;
      // Vercel preserves the incoming URL when applying the /api rewrite.
      request.url = (request.url || "/").replace(/^\/api(?=\/|\?|$)/, "") || "/";
      if (request.url.startsWith("?")) request.url = `/${request.url}`;
      await new Promise<void>((resolve) => {
        const complete = () => {
          response.off("finish", complete);
          response.off("close", complete);
          resolve();
        };
        response.once("finish", complete);
        response.once("close", complete);
        app.server.emit("request", request, response);
      });
    } catch {
      // Never include configuration values or credentials in public errors.
      console.error("No se pudo iniciar la API. Revisa las variables de servidor en Vercel.");
      if (!response.headersSent) {
        response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        response.end(JSON.stringify({ error: {
          code: "API_UNAVAILABLE",
          message: "El servicio del sitio no está disponible. Intenta nuevamente más tarde.",
        } }));
      } else {
        response.end();
      }
    }
  };
}

export default createServerlessHandler();
