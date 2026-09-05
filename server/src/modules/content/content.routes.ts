import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import {
  eventInputSchema,
  eventPatchSchema,
  idParamsSchema,
  narrativeInputSchema,
  narrativePatchSchema,
  narrativeQuerySchema,
} from "./content.schemas.js";

function readClient(app: FastifyInstance) {
  if (!app.supabase) throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de datos no está disponible.");
  return app.supabase;
}

function writeClient(app: FastifyInstance) {
  if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de escritura no está disponible.");
  return app.supabaseAdmin;
}

export async function contentRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  for (const path of ["/v1/events", "/events"] as const) {
    api.get(path, async () => {
      const { data, error } = await readClient(app)
        .from("eventos")
        .select("id,titulo,descripcion,fecha_inicio,fecha_fin,created_at,updated_at")
        .order("fecha_inicio", { ascending: true })
        .limit(500);
      if (error) throw new AppError(503, "EVENT_LIST_FAILED", "No se pudieron cargar los eventos.");
      return { data: data ?? [] };
    });

    api.post(path, { preHandler: app.requireAdmin, schema: { body: eventInputSchema } }, async (request, reply) => {
      const { data, error } = await writeClient(app).from("eventos").insert(request.body).select().single();
      if (error) throw new AppError(503, "EVENT_CREATE_FAILED", "No se pudo crear el evento.");
      return reply.status(201).send({ data });
    });
  }

  for (const path of ["/v1/events/:id", "/events/:id"] as const) {
    api.patch(path, { preHandler: app.requireAdmin, schema: { params: idParamsSchema, body: eventPatchSchema } }, async (request) => {
      const { data, error } = await writeClient(app)
        .from("eventos")
        .update({ ...request.body, updated_at: new Date().toISOString() })
        .eq("id", request.params.id)
        .select()
        .single();
      if (error) throw new AppError(503, "EVENT_UPDATE_FAILED", "No se pudo actualizar el evento.");
      return { data };
    });
    api.put(path, { preHandler: app.requireAdmin, schema: { params: idParamsSchema, body: eventPatchSchema } }, async (request) => {
      const { data, error } = await writeClient(app)
        .from("eventos")
        .update({ ...request.body, updated_at: new Date().toISOString() })
        .eq("id", request.params.id)
        .select()
        .single();
      if (error) throw new AppError(503, "EVENT_UPDATE_FAILED", "No se pudo actualizar el evento.");
      return { data };
    });
    api.delete(path, { preHandler: app.requireAdmin, schema: { params: idParamsSchema } }, async (request, reply) => {
      const { error } = await writeClient(app).from("eventos").delete().eq("id", request.params.id);
      if (error) throw new AppError(503, "EVENT_DELETE_FAILED", "No se pudo eliminar el evento.");
      return reply.status(204).send();
    });
  }

  for (const path of ["/v1/narratives", "/narrativas"] as const) {
    api.get(path, { schema: { querystring: narrativeQuerySchema } }, async (request) => {
      let query = readClient(app)
        .from("narrativas")
        .select("id,titulo,year_section,bloques,autor_id,fecha_publicacion,created_at,updated_at")
        .order("year_section", { ascending: false });
      if (request.query.year_section) query = query.eq("year_section", request.query.year_section);
      const { data, error } = await query;
      if (error) throw new AppError(503, "NARRATIVE_LIST_FAILED", "No se pudieron cargar las narrativas.");
      return { data: data ?? [] };
    });

    api.post(path, { preHandler: app.requireAdmin, schema: { body: narrativeInputSchema } }, async (request, reply) => {
      const { data, error } = await writeClient(app)
        .from("narrativas")
        .insert({ ...request.body, autor_id: request.authUser!.id })
        .select()
        .single();
      if (error) throw new AppError(503, "NARRATIVE_CREATE_FAILED", "No se pudo crear la narrativa.");
      return reply.status(201).send({ data });
    });
  }

  for (const path of ["/v1/narratives/:id", "/narrativas/:id"] as const) {
    api.get(path, { schema: { params: idParamsSchema } }, async (request) => {
      const { data, error } = await readClient(app)
        .from("narrativas")
        .select("id,titulo,year_section,bloques,autor_id,fecha_publicacion,created_at,updated_at")
        .eq("id", request.params.id)
        .maybeSingle();
      if (error) throw new AppError(503, "NARRATIVE_READ_FAILED", "No se pudo cargar la narrativa.");
      if (!data) throw new AppError(404, "NARRATIVE_NOT_FOUND", "La narrativa no existe.");
      return { data };
    });
    for (const method of ["put", "patch"] as const) {
      api[method](path, { preHandler: app.requireAdmin, schema: { params: idParamsSchema, body: narrativePatchSchema } }, async (request) => {
        const { data, error } = await writeClient(app)
          .from("narrativas")
          .update({ ...request.body, updated_at: new Date().toISOString() })
          .eq("id", request.params.id)
          .select()
          .single();
        if (error) throw new AppError(503, "NARRATIVE_UPDATE_FAILED", "No se pudo actualizar la narrativa.");
        return { data };
      });
    }
    api.delete(path, { preHandler: app.requireAdmin, schema: { params: idParamsSchema } }, async (request, reply) => {
      const { error } = await writeClient(app).from("narrativas").delete().eq("id", request.params.id);
      if (error) throw new AppError(503, "NARRATIVE_DELETE_FAILED", "No se pudo eliminar la narrativa.");
      return reply.status(204).send();
    });
  }
}
