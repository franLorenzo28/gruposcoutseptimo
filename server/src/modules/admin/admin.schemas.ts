import { z } from "zod/v4";

export const adminUserParamsSchema = z.object({ id: z.uuid() });
export const roleUpdateSchema = z.object({ role: z.enum(["user", "mod", "admin"]) });
export const educatorUpdateSchema = z.object({
  enabled: z.boolean(),
  units: z.array(z.enum(["manada", "tropa", "pioneros", "rovers"])).max(4).default([]),
});
export const adminResourceParamsSchema = z.object({
  resource: z.enum(["groups", "eventos", "messages", "group_messages", "site_pages", "notifications"]),
  id: z.uuid(),
});
export const adminProfileUpdateSchema = z.object({
  nombre_completo: z.string().trim().min(1).max(160).optional(),
  username: z.union([z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/), z.null()]).optional(),
  rol_adulto: z.union([z.string().trim().max(80), z.null()]).optional(),
  rama_que_educa: z.union([z.string().trim().max(120), z.null()]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
export const sitePageInputSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9/_-]+$/),
  title: z.string().trim().min(1).max(200),
  content: z.string().max(100_000).default(""),
  updated_at: z.iso.datetime({ offset: true }).optional(),
});
export const sitePageParamsSchema = z.object({ id: z.uuid() });
export const educatorRequestSchema = z.object({
  units: z.array(z.enum(["manada", "tropa", "pioneros", "rovers"])).min(1).max(4),
  note: z.string().trim().max(1000).optional(),
});
export const educatorDecisionParamsSchema = z.object({ id: z.uuid() });
export const educatorDecisionSchema = z.object({
  requesterId: z.uuid(),
  approve: z.boolean(),
  units: z.array(z.enum(["manada", "tropa", "pioneros", "rovers"])).max(4).default([]),
  note: z.string().trim().max(1000).optional(),
});
export const conversationAdminParamsSchema = z.object({ id: z.uuid() });
