import { randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import { signUploadSchema, storageObjectSchema } from "./media.schemas.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
]);

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

function client(app: FastifyInstance) {
  if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio multimedia no está disponible.");
  return app.supabaseAdmin;
}

function safeSegment(value: string | undefined, fallback: string): string {
  const normalized = (value || fallback).normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return normalized || fallback;
}

async function canWriteBucket(app: FastifyInstance, request: FastifyRequest, bucket: string): Promise<boolean> {
  if (bucket === "avatars") return true;
  if (app.getPowerRole(request) !== "user") return true;
  if (bucket !== "rama-documentos") return false;
  const { data } = await client(app).from("profiles").select("rol_adulto,account_status")
    .eq("user_id", request.authUser!.id).maybeSingle();
  return data?.account_status === "activo" && ["educador", "educador/a", "educadora"].includes(String(data.rol_adulto || "").toLowerCase());
}

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.post("/v1/media/uploads/sign", { preHandler: app.requireActiveAccount, schema: { body: signUploadSchema } }, async (request) => {
    if (!allowedMimeTypes.has(request.body.content_type)) {
      throw new AppError(400, "MEDIA_TYPE_NOT_ALLOWED", "El tipo de archivo no está permitido.");
    }
    if (!(await canWriteBucket(app, request, request.body.bucket))) {
      throw new AppError(403, "MEDIA_WRITE_FORBIDDEN", "No tienes permisos para subir a ese espacio.");
    }
    const maxSize = request.body.bucket === "rama-documentos" ? 52_428_800 : 10_485_760;
    if (request.body.size > maxSize) throw new AppError(400, "MEDIA_TOO_LARGE", "El archivo supera el límite permitido.");

    const folder = request.body.bucket === "avatars"
      ? request.authUser!.id
      : safeSegment(request.body.folder, request.authUser!.id);
    const path = `${folder}/${randomUUID()}.${extensions[request.body.content_type]}`;
    const { data, error } = await client(app).storage.from(request.body.bucket).createSignedUploadUrl(path, { upsert: false });
    if (error) throw new AppError(503, "SIGNED_UPLOAD_FAILED", "No se pudo autorizar la subida.");
    return { data: { bucket: request.body.bucket, path, token: data.token, signedUrl: data.signedUrl } };
  });

  api.post("/v1/media/downloads/sign", { preHandler: app.requireActiveAccount, schema: { body: storageObjectSchema } }, async (request) => {
    const { data, error } = await client(app).storage.from(request.body.bucket).createSignedUrl(request.body.path, 300);
    if (error) throw new AppError(404, "MEDIA_NOT_FOUND", "No se pudo autorizar la descarga.");
    return { data: { signedUrl: data.signedUrl, expiresIn: 300 } };
  });

  api.delete("/v1/media/objects", { preHandler: app.requireActiveAccount, schema: { body: storageObjectSchema } }, async (request, reply) => {
    const ownsAvatar = request.body.bucket === "avatars" && request.body.path.startsWith(`${request.authUser!.id}/`);
    if (!ownsAvatar && !(await canWriteBucket(app, request, request.body.bucket))) {
      throw new AppError(403, "MEDIA_DELETE_FORBIDDEN", "No tienes permisos para eliminar ese archivo.");
    }
    const { error } = await client(app).storage.from(request.body.bucket).remove([request.body.path]);
    if (error) throw new AppError(503, "MEDIA_DELETE_FAILED", "No se pudo eliminar el archivo.");
    return reply.status(204).send();
  });
}
