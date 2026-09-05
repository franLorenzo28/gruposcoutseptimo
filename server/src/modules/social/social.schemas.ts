import { z } from "zod/v4";

export const userParamsSchema = z.object({ id: z.uuid() });
export const conversationParamsSchema = z.object({ id: z.uuid() });
export const followBodySchema = z.object({ targetId: z.uuid() });
export const conversationBodySchema = z.object({ otherId: z.uuid() });
export const directMessageSchema = z.object({ content: z.string().trim().min(1).max(4000) });
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});
export const followsListQuerySchema = listQuerySchema.extend({ userId: z.uuid() });
export const followCountsQuerySchema = z.object({ userId: z.uuid() });
