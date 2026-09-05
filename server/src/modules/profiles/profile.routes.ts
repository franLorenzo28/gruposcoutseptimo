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
import { ProfileRepository } from "./profile.repository.js";

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();
  const profiles = new ProfileRepository(app);

  api.get("/v1/me/profile", { preHandler: app.authenticate }, async (request) => {
    let data;
    try { data = await profiles.getOwn(request.authUser!.id); }
    catch { throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil."); }
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.get("/v1/me/access", { preHandler: app.authenticate }, async (request) => {
    let data;
    try { data = await profiles.getAccess(request.authUser!.id); }
    catch { throw new AppError(503, "AUTHORIZATION_UNAVAILABLE", "No se pudo comprobar el acceso."); }
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
      let data;
      try {
        data = await profiles.updateOwn(request.authUser!.id, request.body, request.userSupabase ?? null);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
          throw new AppError(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.");
        }
        throw new AppError(503, "PROFILE_UPDATE_FAILED", "No se pudo actualizar el perfil.");
      }
      if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
      return { data };
    },
  );

  api.get("/profiles/me", { preHandler: app.authenticate }, async (request) => {
    let data;
    try { data = await profiles.getOwn(request.authUser!.id); }
    catch { throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil."); }
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.put("/profiles/me", { preHandler: app.authenticate, schema: { body: updateOwnProfileSchema } }, async (request) => {
    let data;
    try { data = await profiles.updateOwn(request.authUser!.id, request.body, request.userSupabase ?? null); }
    catch { throw new AppError(503, "PROFILE_UPDATE_FAILED", "No se pudo actualizar el perfil."); }
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.get("/profiles/directory", { preHandler: app.requireActiveAccount, schema: { querystring: legacyProfileListQuerySchema } }, async (request) => {
    try {
      return { data: await profiles.listPublic(request.query.q, request.query.limit, request.query.offset, request.userSupabase ?? null) };
    } catch { throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudo cargar el directorio."); }
  });

  api.post("/profiles/batch", { preHandler: app.requireActiveAccount, schema: { body: profileBatchSchema } }, async (request) => {
    try { return { data: await profiles.getPublicBatch(request.body.ids, request.userSupabase ?? null) }; }
    catch { throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudieron cargar los perfiles."); }
  });

  api.get("/profiles/:id", { preHandler: app.requireActiveAccount, schema: { params: profileIdParamsSchema } }, async (request) => {
    let data;
    try { data = await profiles.getPublic(request.params.id, request.userSupabase ?? null); }
    catch { throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil."); }
    if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
    return { data };
  });

  api.get(
    "/v1/profiles",
    { preHandler: app.requireActiveAccount, schema: { querystring: profileListQuerySchema } },
    async (request) => {
      try {
        return { data: await profiles.listPublic(request.query.search, request.query.limit, request.query.offset, request.userSupabase ?? null) };
      } catch { throw new AppError(503, "PROFILE_DIRECTORY_FAILED", "No se pudo cargar el directorio."); }
    },
  );

  api.get(
    "/v1/profiles/:id",
    { preHandler: app.requireActiveAccount, schema: { params: profileIdParamsSchema } },
    async (request) => {
      let data;
      try { data = await profiles.getPublic(request.params.id, request.userSupabase ?? null); }
      catch { throw new AppError(503, "PROFILE_READ_FAILED", "No se pudo cargar el perfil."); }
      if (!data) throw new AppError(404, "PROFILE_NOT_FOUND", "No se encontró el perfil.");
      return { data };
    },
  );
}
