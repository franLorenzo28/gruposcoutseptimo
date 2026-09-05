import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import { adminProfileUpdateSchema, adminResourceParamsSchema, adminUserParamsSchema, conversationAdminParamsSchema, educatorDecisionParamsSchema, educatorDecisionSchema, educatorRequestSchema, educatorUpdateSchema, roleUpdateSchema, sitePageInputSchema, sitePageParamsSchema } from "./admin.schemas.js";

function adminClient(app: FastifyInstance) {
  if (!app.supabaseAdmin) {
    throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio administrativo no está disponible.");
  }
  return app.supabaseAdmin;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get("/v1/admin/users", { preHandler: app.requireAdmin }, async () => {
    const { data, error } = await adminClient(app)
      .from("profiles")
      .select("user_id,email,nombre_completo,username,avatar_url,role,rol_adulto,rama_que_educa,account_status,account_classification,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new AppError(503, "ADMIN_USERS_FAILED", "No se pudieron cargar los usuarios.");
    return { data: data ?? [] };
  });

  api.get("/v1/admin/dashboard-data", { preHandler: app.requireAdmin }, async () => {
    const client = adminClient(app);
    const [users, groups, events, messages, groupMessages, pages, follows, notifications] = await Promise.all([
      client.from("profiles").select("user_id,email,nombre_completo,username,avatar_url,role,rol_adulto,rama_que_educa,account_status,account_classification,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
      client.from("groups").select().order("created_at", { ascending: false }).limit(200),
      client.from("eventos").select().order("fecha_inicio", { ascending: false }).limit(200),
      client.from("messages").select().order("created_at", { ascending: false }).limit(200),
      client.from("group_messages").select().order("created_at", { ascending: false }).limit(200),
      client.from("site_pages").select().order("updated_at", { ascending: false }).limit(200),
      client.from("follows").select().order("created_at", { ascending: false }).limit(500),
      client.from("notifications").select().order("created_at", { ascending: false }).limit(500),
    ]);
    const failed = [users, groups, events, messages, groupMessages, pages, follows, notifications].find((result) => result.error);
    if (failed?.error) throw new AppError(503, "ADMIN_DASHBOARD_FAILED", "No se pudo cargar el panel administrativo.");
    return {
      data: {
        users: users.data ?? [],
        groups: groups.data ?? [],
        events: events.data ?? [],
        messages: messages.data ?? [],
        groupMessages: groupMessages.data ?? [],
        pages: pages.data ?? [],
        follows: follows.data ?? [],
        notifications: notifications.data ?? [],
      },
    };
  });

  api.delete(
    "/v1/admin/resources/:resource/:id",
    { preHandler: app.requireAdmin, schema: { params: adminResourceParamsSchema } },
    async (request, reply) => {
      const { error } = await adminClient(app)
        .from(request.params.resource)
        .delete()
        .eq("id", request.params.id);
      if (error) throw new AppError(503, "ADMIN_DELETE_FAILED", "No se pudo eliminar el registro.");
      return reply.status(204).send();
    },
  );

  api.post("/v1/admin/pages", { preHandler: app.requireAdmin, schema: { body: sitePageInputSchema } }, async (request, reply) => {
    const { data, error } = await adminClient(app).from("site_pages").insert(request.body).select().single();
    if (error) throw new AppError(503, "PAGE_CREATE_FAILED", "No se pudo crear la página.");
    return reply.status(201).send({ data });
  });

  api.patch(
    "/v1/admin/pages/:id",
    { preHandler: app.requireAdmin, schema: { params: sitePageParamsSchema, body: sitePageInputSchema.partial() } },
    async (request) => {
      const { data, error } = await adminClient(app).from("site_pages")
        .update({ ...request.body, updated_at: new Date().toISOString() })
        .eq("id", request.params.id).select().single();
      if (error) throw new AppError(503, "PAGE_UPDATE_FAILED", "No se pudo actualizar la página.");
      return { data };
    },
  );

  api.post(
    "/v1/me/educator-permission-requests",
    { preHandler: app.requireActiveAccount, schema: { body: educatorRequestSchema } },
    async (request, reply) => {
      const client = adminClient(app);
      const { data: requester, error: requesterError } = await client.from("profiles")
        .select("nombre_completo,username,rol_adulto")
        .eq("user_id", request.authUser!.id).single();
      if (requesterError) throw new AppError(503, "EDUCATOR_REQUEST_FAILED", "No se pudo comprobar el perfil.");
      if (!["educador", "educador/a", "educadora"].includes(String(requester.rol_adulto || "").toLowerCase())) {
        throw new AppError(403, "EDUCATOR_ROLE_REQUIRED", "Tu perfil debe estar marcado como educador/a.");
      }
      const { data: reviewers, error: reviewersError } = await client.from("profiles")
        .select("user_id").in("role", ["admin", "mod"]).neq("user_id", request.authUser!.id);
      if (reviewersError) throw new AppError(503, "EDUCATOR_REQUEST_FAILED", "No se pudieron resolver los revisores.");
      if (!reviewers?.length) throw new AppError(409, "NO_REVIEWERS_AVAILABLE", "No hay revisores disponibles.");
      const now = new Date().toISOString();
      const rows = reviewers.map((reviewer) => ({
        recipient_id: reviewer.user_id,
        actor_id: request.authUser!.id,
        type: "message",
        entity_type: "educator_permission_request",
        entity_id: request.authUser!.id,
        data: {
          kind: "educator_permission_request",
          requester_id: request.authUser!.id,
          requester_name: requester.nombre_completo || requester.username,
          requested_units: request.body.units,
          note: request.body.note || null,
          status: "pending",
          requested_at: now,
        },
      }));
      const { error } = await client.from("notifications").insert(rows);
      if (error) throw new AppError(503, "EDUCATOR_REQUEST_FAILED", "No se pudo enviar la solicitud.");
      return reply.status(202).send({ data: { sentCount: rows.length } });
    },
  );

  api.get("/v1/admin/educator-permission-requests", { preHandler: app.requireAdmin }, async (request) => {
    const { data, error } = await adminClient(app).from("notifications")
      .select("id,actor_id,recipient_id,type,entity_type,entity_id,data,created_at,read_at")
      .eq("recipient_id", request.authUser!.id)
      .eq("entity_type", "educator_permission_request")
      .is("read_at", null)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new AppError(503, "EDUCATOR_REQUEST_LIST_FAILED", "No se pudieron cargar las solicitudes.");
    return { data: data ?? [] };
  });

  api.post(
    "/v1/admin/educator-permission-requests/:id/decision",
    { preHandler: app.requireAdmin, schema: { params: educatorDecisionParamsSchema, body: educatorDecisionSchema } },
    async (request) => {
      if (request.body.approve && request.body.units.length === 0) {
        throw new AppError(400, "EDUCATOR_UNITS_REQUIRED", "Selecciona al menos una unidad.");
      }
      const client = adminClient(app);
      const { data: notification, error: lookupError } = await client.from("notifications")
        .select("id,actor_id,recipient_id,data,read_at")
        .eq("id", request.params.id).eq("recipient_id", request.authUser!.id).maybeSingle();
      if (lookupError) throw new AppError(503, "EDUCATOR_DECISION_FAILED", "No se pudo comprobar la solicitud.");
      if (!notification || notification.actor_id !== request.body.requesterId) {
        throw new AppError(404, "EDUCATOR_REQUEST_NOT_FOUND", "La solicitud no existe.");
      }
      if (notification.read_at) throw new AppError(409, "EDUCATOR_REQUEST_REVIEWED", "La solicitud ya fue revisada.");
      const now = new Date().toISOString();
      const { error: profileError } = await client.from("profiles").update({
        rol_adulto: request.body.approve ? "Educador/a" : null,
        rama_que_educa: request.body.approve ? request.body.units.join(",") : null,
      }).eq("user_id", request.body.requesterId);
      if (profileError) throw new AppError(503, "EDUCATOR_DECISION_FAILED", "No se pudo actualizar el perfil.");
      const originalData = typeof notification.data === "object" && notification.data ? notification.data : {};
      const { error: notificationError } = await client.from("notifications").update({
        read_at: now,
        data: { ...originalData, status: "reviewed", approved: request.body.approve, reviewed_at: now, note: request.body.note || null },
      }).eq("id", request.params.id).is("read_at", null);
      if (notificationError) throw new AppError(503, "EDUCATOR_DECISION_FAILED", "El perfil cambió, pero no se pudo cerrar la solicitud.");
      return { data: { requesterId: request.body.requesterId, approved: request.body.approve, units: request.body.units } };
    },
  );

  api.get(
    "/v1/admin/conversations/:id",
    { preHandler: app.requireAdmin, schema: { params: conversationAdminParamsSchema } },
    async (request) => {
      const client = adminClient(app);
      const [{ data: messages, error }, { data: participants, error: participantError }] = await Promise.all([
        client.from("messages").select().eq("conversation_id", request.params.id).order("created_at", { ascending: true }).limit(1000),
        client.from("conversation_participants").select("user_id").eq("conversation_id", request.params.id),
      ]);
      if (error || participantError) throw new AppError(503, "ADMIN_CONVERSATION_FAILED", "No se pudo cargar la conversación.");
      return { data: { messages: messages ?? [], participants: participants ?? [] } };
    },
  );

  api.patch(
    "/v1/admin/users/:id/profile",
    { preHandler: app.requireAdmin, schema: { params: adminUserParamsSchema, body: adminProfileUpdateSchema } },
    async (request) => {
      const { data, error } = await adminClient(app).from("profiles").update(request.body)
        .eq("user_id", request.params.id)
        .select("user_id,email,nombre_completo,username,role,rol_adulto,rama_que_educa,account_status")
        .single();
      if (error?.code === "23505") throw new AppError(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.");
      if (error) throw new AppError(503, "ADMIN_PROFILE_UPDATE_FAILED", "No se pudo actualizar el usuario.");
      return { data };
    },
  );

  api.patch(
    "/v1/admin/users/:id/role",
    { preHandler: app.requireAdmin, schema: { params: adminUserParamsSchema, body: roleUpdateSchema } },
    async (request) => {
      const actorRole = app.getPowerRole(request);
      if (request.params.id === request.authUser!.id) {
        throw new AppError(409, "SELF_ROLE_CHANGE_FORBIDDEN", "No puedes cambiar tu propio rol.");
      }
      if (actorRole !== "admin" && request.body.role === "admin") {
        throw new AppError(403, "SUPER_ADMIN_REQUIRED", "Sólo un administrador puede asignar ese rol.");
      }

      const client = adminClient(app);
      const { data: target, error: userError } = await client.auth.admin.getUserById(request.params.id);
      if (userError || !target.user) throw new AppError(404, "USER_NOT_FOUND", "El usuario no existe.");
      const targetRole = String(target.user.app_metadata?.role || "user").toLowerCase();
      if (actorRole !== "admin" && targetRole === "admin") {
        throw new AppError(403, "SUPER_ADMIN_REQUIRED", "Un moderador no puede cambiar a un administrador.");
      }
      const { error: metadataError } = await client.auth.admin.updateUserById(request.params.id, {
        app_metadata: { ...target.user.app_metadata, role: request.body.role },
      });
      if (metadataError) throw new AppError(503, "ROLE_UPDATE_FAILED", "No se pudo actualizar el rol.");

      const { error: profileError } = await client
        .from("profiles")
        .update({ role: request.body.role })
        .eq("user_id", request.params.id);
      if (profileError) {
        request.log.error({ code: profileError.code, userId: request.params.id }, "profile role mirror failed");
      }
      return { data: { userId: request.params.id, role: request.body.role } };
    },
  );

  api.patch(
    "/v1/admin/users/:id/educator-permissions",
    { preHandler: app.requireAdmin, schema: { params: adminUserParamsSchema, body: educatorUpdateSchema } },
    async (request) => {
      if (request.body.enabled && request.body.units.length === 0) {
        throw new AppError(400, "EDUCATOR_UNITS_REQUIRED", "Selecciona al menos una unidad.");
      }
      const { data, error } = await adminClient(app)
        .from("profiles")
        .update({
          rol_adulto: request.body.enabled ? "Educador/a" : null,
          rama_que_educa: request.body.enabled ? request.body.units.join(",") : null,
        })
        .eq("user_id", request.params.id)
        .select("user_id,rol_adulto,rama_que_educa")
        .single();
      if (error) throw new AppError(503, "EDUCATOR_UPDATE_FAILED", "No se pudieron actualizar los permisos.");
      return { data };
    },
  );

  api.delete(
    "/v1/admin/users/:id",
    { preHandler: app.requireAdmin, schema: { params: adminUserParamsSchema } },
    async (request, reply) => {
      if (app.getPowerRole(request) !== "admin") {
        throw new AppError(403, "SUPER_ADMIN_REQUIRED", "Sólo un administrador puede eliminar usuarios.");
      }
      if (request.params.id === request.authUser!.id) {
        throw new AppError(409, "SELF_DELETE_USE_ACCOUNT_ENDPOINT", "Usa el flujo de eliminación de tu cuenta.");
      }
      const { error } = await adminClient(app).auth.admin.deleteUser(request.params.id);
      if (error) throw new AppError(503, "USER_DELETE_FAILED", "No se pudo eliminar el usuario.");
      return reply.status(204).send();
    },
  );

  api.delete("/v1/me", { preHandler: app.authenticate }, async (request, reply) => {
    const { error } = await adminClient(app).auth.admin.deleteUser(request.authUser!.id);
    if (error) throw new AppError(503, "ACCOUNT_DELETE_FAILED", "No se pudo eliminar la cuenta.");
    return reply.status(204).send();
  });

  api.delete("/users/me", { preHandler: app.authenticate }, async (request, reply) => {
    const { error } = await adminClient(app).auth.admin.deleteUser(request.authUser!.id);
    if (error) throw new AppError(503, "ACCOUNT_DELETE_FAILED", "No se pudo eliminar la cuenta.");
    return reply.status(204).send();
  });
}
