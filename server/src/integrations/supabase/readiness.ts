import type { EnvironmentConfig } from "../../config/environment.js";

export type DependencyState = "up" | "down" | "not_configured";

export interface DependencyCheck {
  status: DependencyState;
  latencyMs: number;
  reason?: string;
}

export interface SupabaseReadinessChecks {
  auth: DependencyCheck;
  database: DependencyCheck;
}

export interface ReadinessProbe {
  check(): Promise<SupabaseReadinessChecks>;
}

export interface PostgreSqlQuery {
  query(text: string): Promise<unknown>;
}

export type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function createSupabaseReadinessProbe(
  config: EnvironmentConfig,
  fetchImplementation: FetchImplementation = globalThis.fetch,
): ReadinessProbe {
  let cached: { value: SupabaseReadinessChecks; expiresAt: number } | null = null;
  let inFlight: Promise<SupabaseReadinessChecks> | null = null;
  async function checkEndpoint(url: string): Promise<DependencyCheck> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.SUPABASE_TIMEOUT_MS);

    try {
      const response = await fetchImplementation(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          apikey: config.SUPABASE_KEY ?? config.SUPABASE_SERVICE_ROLE_KEY!,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          status: "down",
          latencyMs: Date.now() - startedAt,
          reason: `HTTP ${response.status}`,
        };
      }

      return { status: "up", latencyMs: Date.now() - startedAt };
    } catch (error: unknown) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? "Timeout"
          : "No se pudo establecer conexión";
      return { status: "down", latencyMs: Date.now() - startedAt, reason };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async check(): Promise<SupabaseReadinessChecks> {
      const databaseKey = config.SUPABASE_KEY ?? config.SUPABASE_SERVICE_ROLE_KEY;
      if (!config.SUPABASE_URL || !databaseKey) {
        const notConfigured = { status: "not_configured" as const, latencyMs: 0 };
        return { auth: notConfigured, database: notConfigured };
      }

      if (cached && cached.expiresAt > Date.now()) return cached.value;
      if (inFlight) return inFlight;

      inFlight = (async () => {
        const baseUrl = config.SUPABASE_URL!.replace(/\/$/, "");
        const [auth, database] = await Promise.all([
          checkEndpoint(`${baseUrl}/auth/v1/health`),
          checkEndpoint(`${baseUrl}/rest/v1/profiles?select=id&limit=1`),
        ]);
        const value = { auth, database };
        cached = { value, expiresAt: Date.now() + config.READINESS_CACHE_MS };
        return value;
      })();

      try {
        return await inFlight;
      } finally {
        inFlight = null;
      }
    },
  };
}

export function createPostgresReadinessProbe(
  config: EnvironmentConfig,
  database: PostgreSqlQuery,
): ReadinessProbe {
  let cached: { value: SupabaseReadinessChecks; expiresAt: number } | null = null;
  let inFlight: Promise<SupabaseReadinessChecks> | null = null;

  return {
    async check() {
      if (cached && cached.expiresAt > Date.now()) return cached.value;
      if (inFlight) return inFlight;
      inFlight = (async () => {
        const startedAt = Date.now();
        let databaseCheck: DependencyCheck;
        try {
          await database.query("select 1");
          databaseCheck = { status: "up", latencyMs: Date.now() - startedAt };
        } catch {
          databaseCheck = { status: "down", latencyMs: Date.now() - startedAt, reason: "No se pudo ejecutar SELECT 1" };
        }
        const auth: DependencyCheck = config.AUTH_MODE === "local" && config.JWT_SECRET
          ? { status: "up", latencyMs: 0 }
          : { status: "not_configured", latencyMs: 0 };
        const value = { auth, database: databaseCheck };
        cached = { value, expiresAt: Date.now() + config.READINESS_CACHE_MS };
        return value;
      })();
      try { return await inFlight; }
      finally { inFlight = null; }
    },
  };
}
