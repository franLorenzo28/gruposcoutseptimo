import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";

import type { EnvironmentConfig } from "../config/environment.js";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient | null;
    supabaseAdmin: SupabaseClient | null;
    createPublicSupabase(): SupabaseClient;
    createUserSupabase(accessToken: string): SupabaseClient;
  }
}

function createStatelessClient(url: string, key: string, accessToken?: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "gruposcoutseptimo-api/0.2.0",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  });
}

export function installSupabaseClient(
  app: FastifyInstance,
  config: EnvironmentConfig,
): void {
  const client =
    config.SUPABASE_URL && config.SUPABASE_KEY
      ? createStatelessClient(config.SUPABASE_URL, config.SUPABASE_KEY)
      : null;

  const adminClient =
    config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY
      ? createStatelessClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
      : null;

  app.decorate("supabase", client);
  app.decorate("supabaseAdmin", adminClient);
  app.decorate("createPublicSupabase", () => {
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      throw new Error("Supabase no está configurado.");
    }
    return createStatelessClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  });
  app.decorate("createUserSupabase", (accessToken: string) => {
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      throw new Error("Supabase no está configurado.");
    }
    return createStatelessClient(config.SUPABASE_URL, config.SUPABASE_KEY, accessToken);
  });
}
