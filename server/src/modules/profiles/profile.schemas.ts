import { z } from "zod/v4";

const nullableText = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional();
const jsonObject = z.record(z.string(), z.unknown());

export const updateOwnProfileSchema = z
  .object({
    nombre_completo: z.string().trim().min(1).max(160).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    telefono: nullableText(40),
    descripcion_personal: nullableText(1000),
    profesion_ocupacion: nullableText(160),
    fecha_nacimiento: z.union([z.iso.date(), z.null()]).optional(),
    avatar_url: nullableText(2048),
    is_public: z.boolean().optional(),
    privacy_preferences: z.union([jsonObject, z.null()]).optional(),
    notification_preferences: z.union([jsonObject, z.null()]).optional(),
    patrulla: nullableText(80),
    seisena: nullableText(80),
    adelanto: nullableText(120),
    equipo_pioneros: nullableText(120),
    comunidad_rovers: nullableText(120),
    promesa: z.union([z.boolean(), z.null()]).optional(),
    ppp_url: nullableText(2048),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Debes enviar al menos un campo.");

export const profileIdParamsSchema = z.object({ id: z.uuid() });

export const profileListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  search: z.string().trim().max(80).optional(),
});

export const legacyProfileListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  q: z.string().trim().max(80).optional(),
});
export const profileBatchSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });
