import { z } from "zod/v4";

const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => value || null);

export const registrationProfileSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  apellido: z.string().trim().min(1).max(80),
  grupo_scout: z.string().trim().min(1).max(120).default("septimo"),
  rama: optionalText(60),
  nombre_scout_relacionado: optionalText(160),
});

export const emailRegistrationSchema = registrationProfileSchema.extend({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export const registrationListQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.iso.datetime({ offset: true }).optional(),
});

export const registrationDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  admin_notes: optionalText(1000),
});

export const registrationIdParamsSchema = z.object({
  id: z.uuid(),
});

export type RegistrationProfileInput = z.infer<typeof registrationProfileSchema>;
export type EmailRegistrationInput = z.infer<typeof emailRegistrationSchema>;
