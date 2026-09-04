import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";

import type { EnvironmentConfig } from "../config/environment.js";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient | null;
  }
}

export function installSupabaseClient(
  app: FastifyInstance,
  config: EnvironmentConfig,
): void {
  const client =
    config.SUPABASE_URL && config.SUPABASE_KEY
      ? createClient(config.SUPABASE_URL, config.SUPABASE_KEY, {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
          global: {
            headers: { "X-Client-Info": "gruposcoutseptimo-api/0.1.0" },
          },
        })
      : null;

  app.decorate("supabase", client);
}
