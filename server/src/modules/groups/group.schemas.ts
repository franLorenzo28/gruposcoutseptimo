import { z } from "zod/v4";

export const groupParamsSchema = z.object({ id: z.uuid() });
export const groupMemberParamsSchema = z.object({ id: z.uuid(), userId: z.uuid() });
export const groupMessageParamsSchema = z.object({ id: z.uuid(), messageId: z.uuid() });
export const groupMessageIdParamsSchema = z.object({ messageId: z.uuid() });
export const groupInputSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.union([z.string().trim().max(500), z.null()]).optional(),
  cover_url: z.union([z.url(), z.null()]).optional(),
});
export const groupPatchSchema = groupInputSchema.partial().refine((value) => Object.keys(value).length > 0);
export const groupMessageSchema = z.object({
  content: z.string().trim().max(4000).default(""),
  image_url: z.union([z.url(), z.null()]).optional(),
}).refine((value) => value.content.length > 0 || Boolean(value.image_url), "El mensaje no puede estar vacío.");
export const groupRoleBodySchema = z.object({ userId: z.uuid() });
export const groupInviteSchema = z.object({ userIds: z.array(z.uuid()).min(1).max(100) });
