import { z } from "zod/v4";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("gruposcoutseptimo-api"),
  version: z.string(),
  timestamp: z.string(),
});

const dependencyCheckSchema = z.object({
  status: z.enum(["up", "down", "not_configured"]),
  latencyMs: z.number().int().nonnegative(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.object({
    supabaseAuth: dependencyCheckSchema,
    supabaseDatabase: dependencyCheckSchema,
  }),
  timestamp: z.string(),
});
