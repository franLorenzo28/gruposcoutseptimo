import { z } from "zod/v4";

export const idParamsSchema = z.object({ id: z.uuid() });

export const eventInputSchema = z.object({
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.union([z.string().trim().max(5000), z.null()]).optional(),
  fecha_inicio: z.iso.datetime({ offset: true }),
  fecha_fin: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
});
export const eventPatchSchema = eventInputSchema.partial().refine((value) => Object.keys(value).length > 0);

const narrativeBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),
  tipo: z.enum(["texto", "imagen"]),
  contenido: z.string().trim().min(1).max(20_000),
});
export const narrativeInputSchema = z.object({
  titulo: z.string().trim().min(5).max(200),
  year_section: z.string().trim().min(4).max(20),
  bloques: z.array(narrativeBlockSchema).min(1).max(100),
  fecha_publicacion: z.iso.datetime({ offset: true }).optional(),
});
export const narrativePatchSchema = narrativeInputSchema.partial().refine((value) => Object.keys(value).length > 0);
export const narrativeQuerySchema = z.object({ year_section: z.string().trim().max(20).optional() });
