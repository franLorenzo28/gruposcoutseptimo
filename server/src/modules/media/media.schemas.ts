import { z } from "zod/v4";

export const mediaBucketSchema = z.enum([
  "avatars",
  "gallery",
  "group-covers",
  "rama-documentos",
  "cancionero-audios",
  "lagerfeuer-files",
]);

export const signUploadSchema = z.object({
  bucket: mediaBucketSchema,
  file_name: z.string().trim().min(1).max(180),
  content_type: z.string().trim().min(3).max(120),
  size: z.number().int().positive().max(52_428_800),
  folder: z.string().trim().max(100).optional(),
});

export const storageObjectSchema = z.object({
  bucket: mediaBucketSchema,
  path: z.string().trim().min(3).max(500).refine((path) => !path.includes("..") && !path.startsWith("/")),
});
