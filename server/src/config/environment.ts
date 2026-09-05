import { z } from "zod/v4";

const optionalString = z.string().trim().min(1).optional();

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const rawEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().trim().min(1).default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    ORIGIN: z
      .string()
      .default("http://localhost:5173,http://127.0.0.1:5173")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.url()).min(1)),
    BODY_LIMIT_BYTES: z.coerce.number().int().min(1_024).max(10_485_760).default(1_048_576),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(100),
    RATE_LIMIT_WINDOW: z.string().trim().min(1).default("1 minute"),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_PUBLISHABLE_KEY: optionalString,
    SUPABASE_ANON_KEY: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_TIMEOUT_MS: z.coerce.number().int().min(250).max(30_000).default(3_000),
    READINESS_CACHE_MS: z.coerce.number().int().min(0).max(60_000).default(5_000),
    ADMIN_USER_IDS: csv.pipe(z.array(z.uuid())),
    ADMIN_EMAILS: csv.transform((emails) => emails.map((email) => email.toLowerCase())),
  })
  .transform(({ ORIGIN, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, ...environment }) => ({
    ...environment,
    CORS_ORIGINS: ORIGIN,
    SUPABASE_KEY: SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_ANON_KEY,
  }))
  .superRefine((environment, context) => {
    const hasUrl = Boolean(environment.SUPABASE_URL);
    const hasKey = Boolean(environment.SUPABASE_KEY);

    if (hasUrl !== hasKey) {
      context.addIssue({
        code: "custom",
        message: "SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY (o SUPABASE_ANON_KEY) deben configurarse juntas.",
        path: [hasUrl ? "SUPABASE_KEY" : "SUPABASE_URL"],
      });
    }

    if (environment.NODE_ENV === "production" && (!hasUrl || !hasKey)) {
      context.addIssue({
        code: "custom",
        message: "Supabase debe estar configurado en producción.",
        path: ["SUPABASE_URL"],
      });
    }

    if (environment.NODE_ENV === "production" && !environment.SUPABASE_SERVICE_ROLE_KEY) {
      context.addIssue({
        code: "custom",
        message: "SUPABASE_SERVICE_ROLE_KEY es obligatoria para los módulos de negocio.",
        path: ["SUPABASE_SERVICE_ROLE_KEY"],
      });
    }
  });

export type EnvironmentConfig = z.output<typeof rawEnvironmentSchema>;

export function loadEnvironment(
  source: Record<string, string | undefined> = process.env,
): EnvironmentConfig {
  const result = rawEnvironmentSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración inválida: ${details}`);
  }

  return result.data;
}
