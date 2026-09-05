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
    AUTH_MODE: z.enum(["supabase", "local"]).default("supabase"),
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
    DATABASE_URL: optionalString,
    DATABASE_SSL: z.enum(["disable", "require", "verify-full"]).default("verify-full"),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    DATABASE_TIMEOUT_MS: z.coerce.number().int().min(250).max(30_000).default(5_000),
    JWT_SECRET: z.string().trim().min(32).optional(),
    JWT_ACCESS_TTL: z
      .string()
      .trim()
      .regex(/^\d+(?:[smhd])?$/, "JWT_ACCESS_TTL debe ser una duración como 900, 15m, 1h o 7d")
      .default("1h"),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1_440).default(60),
    APP_URL: z.url().default("http://localhost:5173"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
    SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM: z.email().optional(),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: z.url().optional(),
    GOOGLE_OAUTH_TTL_MINUTES: z.coerce.number().int().min(5).max(30).default(10),
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

    if (environment.AUTH_MODE === "supabase" && hasUrl !== hasKey) {
      context.addIssue({
        code: "custom",
        message: "SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY (o SUPABASE_ANON_KEY) deben configurarse juntas.",
        path: [hasUrl ? "SUPABASE_KEY" : "SUPABASE_URL"],
      });
    }

    if (environment.AUTH_MODE === "supabase" && environment.NODE_ENV === "production" && (!hasUrl || !hasKey)) {
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

    if (environment.AUTH_MODE === "local") {
      const googleValues = [environment.GOOGLE_CLIENT_ID, environment.GOOGLE_CLIENT_SECRET, environment.GOOGLE_REDIRECT_URI];
      if (googleValues.some(Boolean) && !googleValues.every(Boolean)) {
        context.addIssue({ code: "custom", path: ["GOOGLE_CLIENT_ID"], message: "Google OAuth requiere CLIENT_ID, CLIENT_SECRET y REDIRECT_URI juntos." });
      }
      if (environment.NODE_ENV === "production" && environment.GOOGLE_REDIRECT_URI
        && !environment.GOOGLE_REDIRECT_URI.startsWith("https://")) {
        context.addIssue({ code: "custom", path: ["GOOGLE_REDIRECT_URI"], message: "GOOGLE_REDIRECT_URI debe usar HTTPS en producción." });
      }
      if (Boolean(environment.SMTP_HOST) !== Boolean(environment.SMTP_FROM)) {
        context.addIssue({ code: "custom", path: ["SMTP_HOST"], message: "SMTP_HOST y SMTP_FROM deben configurarse juntos." });
      }
      if (Boolean(environment.SMTP_USER) !== Boolean(environment.SMTP_PASSWORD)) {
        context.addIssue({ code: "custom", path: ["SMTP_USER"], message: "SMTP_USER y SMTP_PASSWORD deben configurarse juntos." });
      }
      if (environment.NODE_ENV === "production" && (!environment.SMTP_HOST || !environment.SMTP_FROM || !environment.APP_URL.startsWith("https://"))) {
        context.addIssue({ code: "custom", path: ["SMTP_HOST"], message: "Auth local en producción requiere SMTP_HOST, SMTP_FROM y APP_URL con HTTPS." });
      }
      if (!environment.SUPABASE_URL || !environment.SUPABASE_SERVICE_ROLE_KEY) {
        context.addIssue({
          code: "custom",
          message: "El modo local requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para la base de datos.",
          path: ["SUPABASE_SERVICE_ROLE_KEY"],
        });
      }
      if (!environment.JWT_SECRET) {
        context.addIssue({
          code: "custom",
          message: "JWT_SECRET es obligatorio en modo local y debe tener al menos 32 caracteres.",
          path: ["JWT_SECRET"],
        });
      }
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
