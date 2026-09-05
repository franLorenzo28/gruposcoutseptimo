import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import {
  profileIdParamsSchema,
  legacyProfileListQuerySchema,
  profileBatchSchema,
  profileListQuerySchema,
  updateOwnProfileSchema,
} from "./profile.schemas.js";

const ownFields =
  "id,user_id,email,nombre_completo,username,avatar_url,telefono,descripcion_personal,profesion_ocupacion,fecha_nacimiento,edad,patrulla,seisena,adelanto,equipo_pioneros,comunidad_rovers,promesa,ppp_url,is_public,privacy_preferences,notification_preferences,rol_adulto,rama_que_educa,account_status,account_classification,email_verified,created_at,updated_at";
const publicFields =
  "user_id,nombre_completo,username,avatar_url,descripcion_personal,profesion_ocupacion,patrulla,seisena,adelanto,equipo_pioneros,comunidad_rovers,promesa,rol_adulto,rama_que_educa";

function requestClient(request: { userSupabase: unknown }) {
  if (!request.userSupabase) {
    throw new AppError(401, "AUTH_REQUIRED", "Debes iniciar sesión.");
  }
  return request.userSupabase as NonNullable<import("fastify").FastifyRequest["userSupabase"]>;
}

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get("/v1/me/profile", { preHandler: app.authenticate }, async (request) => {
    if (!app.supabaseAdmin) {
      throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de perfiles no está disponible.");
    }
    const { data, error } = await app.supabaseAdmin
      .from("profiles")
      .select(ownFields)
      .eq("user_id", request.authUser!.id)
      .maybeSingle();
    if (error) throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil.");
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.get("/v1/me/access", { preHandler: app.authenticate }, async (request) => {
    if (!app.supabaseAdmin) {
      throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de autorización no está disponible.");
    }
    const { data, error } = await app.supabaseAdmin
      .from("profiles")
      .select("account_status,account_classification")
      .eq("user_id", request.authUser!.id)
      .maybeSingle();
    if (error) throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el acceso.");
    const role = app.getPowerRole(request);
    return {
      data: {
        userId: request.authUser!.id,
        email: request.authUser!.email ?? null,
        role,
        accountStatus: data?.account_status ?? null,
        accountClassification: data?.account_classification ?? null,
        isSuperAdmin: role === "admin",
        isMod: role === "mod",
        canOpenAdminPanel: role !== "user",
        canManageEducators: role !== "user",
        canManageRoles: role !== "user",
        canDeleteUsers: role === "admin",
      },
    };
  });

  api.patch(
    "/v1/me/profile",
    { preHandler: app.authenticate, schema: { body: updateOwnProfileSchema } },
    async (request) => {
      const { data, error } = await requestClient(request)
        .from("profiles")
        .update(request.body)
        .eq("user_id", request.authUser!.id)
        .select(ownFields)
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new AppError(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.");
        }
        throw new AppError(503, "PROFILE_UPDATE_FAILED", "No se pudo actualizar el perfil.");
      }
      return { data };
    },
  );

  api.get("/profiles/me", { preHandler: app.authenticate }, async (request) => {
    if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de perfiles no está disponible.");
    const { data, error } = await app.supabaseAdmin.from("profiles").select(ownFields).eq("user_id", request.authUser!.id).maybeSingle();
    if (error) throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil.");
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.put("/profiles/me", { preHandler: app.authenticate, schema: { body: updateOwnProfileSchema } }, async (request) => {
    const { data, error } = await requestClient(request).from("profiles").update(request.body)
      .eq("user_id", request.authUser!.id).select(ownFields).single();
    if (error) throw new AppError(503, "PROFILE_UPDATE_FAILED", "No se pudo actualizar el perfil.");
    return { data };
  });

  api.get("/profiles/directory", { preHandler: app.requireActiveAccount, schema: { querystring: legacyProfileListQuerySchema } }, async (request) => {
    let query = requestClient(request).from("profiles").select(publicFields).eq("is_public", true)
      .order("nombre_completo", { ascending: true }).range(request.query.offset, request.query.offset + request.query.limit - 1);
    if (request.query.q) {
      const escaped = request.query.q.replace(/[%_,()]/g, "");
      query = query.or(`nombre_completo.ilike.%${escaped}%,username.ilike.%${escaped}%`);
    }
    const { data, error } = await query;
    if (error) throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudo cargar el directorio.");
    return { data: data ?? [] };
  });

  api.post("/profiles/batch", { preHandler: app.requireActiveAccount, schema: { body: profileBatchSchema } }, async (request) => {
    const { data, error } = await requestClient(request).from("profiles").select(publicFields).in("user_id", request.body.ids);
    if (error) throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudieron cargar los perfiles.");
    return { data: data ?? [] };
  });

  api.get("/profiles/:id", { preHandler: app.requireActiveAccount, schema: { params: profileIdParamsSchema } }, async (request) => {
    const { data, error } = await requestClient(request).from("profiles").select(publicFields)
      .eq("user_id", request.params.id).eq("is_public", true).maybeSingle();
    if (error) throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil.");
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.get(
    "/v1/profiles",
    { preHandler: app.requireActiveAccount, schema: { querystring: profileListQuerySchema } },
    async (request) => {
      let query = requestClient(request)
        .from("profiles")
        .select(publicFields)
        .eq("is_public", true)
        .order("nombre_completo", { ascending: true })
        .range(request.query.offset, request.query.offset + request.query.limit - 1);
      if (request.query.search) {
        const escaped = request.query.search.replace(/[%_,()]/g, "");
        query = query.or(`nombre_completo.ilike.%${escaped}%,username.ilike.%${escaped}%`);
      }
      const { data, error } = await query;
      if (error) throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudo cargar el directorio.");
      return { data: data ?? [] };
    },
  );

  api.get(
    "/v1/profiles/:id",
    { preHandler: app.requireActiveAccount, schema: { params: profileIdParamsSchema } },
    async (request) => {
      const { data, error } = await requestClient(request)
        .from("profiles")
        .select(publicFields)
        .eq("user_id", request.params.id)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil.");
      if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
      return { data };
    },
  );
}
