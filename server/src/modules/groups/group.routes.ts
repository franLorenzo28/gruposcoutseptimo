import type { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import {
  groupInputSchema,
  groupInviteSchema,
  groupMemberParamsSchema,
  groupMessageSchema,
  groupMessageIdParamsSchema,
  groupMessageParamsSchema,
  groupParamsSchema,
  groupPatchSchema,
  groupRoleBodySchema,
} from "./group.schemas.js";

function db(app: FastifyInstance) {
  if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de grupos no está disponible.");
  return app.supabaseAdmin;
}

async function membership(app: FastifyInstance, groupId: string, userId: string) {
  const { data, error } = await db(app)
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError(503, "GROUP_MEMBERSHIP_FAILED", "No se pudo comprobar la membresía.");
  return data?.role as "owner" | "admin" | "member" | undefined;
}

async function requireMember(app: FastifyInstance, request: FastifyRequest, groupId: string) {
  const role = await membership(app, groupId, request.authUser!.id);
  if (!role) throw new AppError(403, "GROUP_MEMBER_REQUIRED", "Debes pertenecer al grupo.");
  return role;
}

async function requireManager(app: FastifyInstance, request: FastifyRequest, groupId: string) {
  const role = await requireMember(app, request, groupId);
  if (!(["owner", "admin"] as const).includes(role as "owner" | "admin")) {
    throw new AppError(403, "GROUP_MANAGER_REQUIRED", "Debes administrar el grupo.");
  }
  return role;
}

export async function groupRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get("/groups", { preHandler: app.requireActiveAccount }, async (request) => {
    const client = db(app);
    const [{ data: groups, error }, { data: members, error: membersError }] = await Promise.all([
      client.from("groups").select("id,name,description,cover_image,creator_id,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
      client.from("group_members").select("group_id,user_id,role"),
    ]);
    if (error || membersError) throw new AppError(503, "GROUP_LIST_FAILED", "No se pudieron cargar los grupos.");
    const allMembers = members ?? [];
    return {
      data: (groups ?? []).map((group) => ({
        ...group,
        cover_url: group.cover_image,
        member_count: allMembers.filter((member) => member.group_id === group.id).length,
        my_role: allMembers.find((member) => member.group_id === group.id && member.user_id === request.authUser!.id)?.role ?? null,
      })),
    };
  });

  api.post("/groups", { preHandler: app.requireActiveAccount, schema: { body: groupInputSchema } }, async (request, reply) => {
    const client = db(app);
    const { data: group, error } = await client
      .from("groups")
      .insert({
        name: request.body.name,
        description: request.body.description ?? null,
        cover_image: request.body.cover_url ?? null,
        creator_id: request.authUser!.id,
      })
      .select()
      .single();
    if (error || !group) throw new AppError(503, "GROUP_CREATE_FAILED", "No se pudo crear el grupo.");
    const { error: ownerError } = await client.from("group_members").insert({
      group_id: group.id,
      user_id: request.authUser!.id,
      role: "owner",
    });
    if (ownerError) {
      await client.from("groups").delete().eq("id", group.id);
      throw new AppError(503, "GROUP_CREATE_FAILED", "No se pudo crear la membresía inicial.");
    }
    return reply.status(201).send({ data: { ...group, cover_url: group.cover_image, my_role: "owner", member_count: 1 } });
  });

  api.get("/groups/:id", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request) => {
    const { data, error } = await db(app).from("groups").select().eq("id", request.params.id).maybeSingle();
    if (error) throw new AppError(503, "GROUP_READ_FAILED", "No se pudo cargar el grupo.");
    if (!data) throw new AppError(404, "GROUP_NOT_FOUND", "El grupo no existe.");
    const role = await membership(app, request.params.id, request.authUser!.id);
    return { data: { ...data, cover_url: data.cover_image, my_role: role ?? null } };
  });

  api.patch("/groups/:id", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupPatchSchema } }, async (request) => {
    await requireManager(app, request, request.params.id);
    const { data, error } = await db(app)
      .from("groups")
      .update({
        ...(request.body.name === undefined ? {} : { name: request.body.name }),
        ...(request.body.description === undefined ? {} : { description: request.body.description }),
        ...(request.body.cover_url === undefined ? {} : { cover_image: request.body.cover_url }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.params.id)
      .select()
      .single();
    if (error) throw new AppError(503, "GROUP_UPDATE_FAILED", "No se pudo actualizar el grupo.");
    return { data };
  });

  api.put("/groups/:id", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupPatchSchema } }, async (request) => {
    await requireManager(app, request, request.params.id);
    const { data, error } = await db(app)
      .from("groups")
      .update({
        ...(request.body.name === undefined ? {} : { name: request.body.name }),
        ...(request.body.description === undefined ? {} : { description: request.body.description }),
        ...(request.body.cover_url === undefined ? {} : { cover_image: request.body.cover_url }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.params.id)
      .select()
      .single();
    if (error) throw new AppError(503, "GROUP_UPDATE_FAILED", "No se pudo actualizar el grupo.");
    return { data };
  });

  api.post("/groups/:id/join", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request, reply) => {
    const { error } = await db(app).from("group_members").insert({
      group_id: request.params.id,
      user_id: request.authUser!.id,
      role: "member",
    });
    if (error && error.code !== "23505") throw new AppError(503, "GROUP_JOIN_FAILED", "No se pudo unir al grupo.");
    return reply.status(204).send();
  });

  api.post("/groups/:id/leave", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request, reply) => {
    const role = await requireMember(app, request, request.params.id);
    if (role === "owner") throw new AppError(409, "GROUP_OWNER_CANNOT_LEAVE", "Transfiere o elimina el grupo antes de salir.");
    const { error } = await db(app).from("group_members").delete().eq("group_id", request.params.id).eq("user_id", request.authUser!.id);
    if (error) throw new AppError(503, "GROUP_LEAVE_FAILED", "No se pudo salir del grupo.");
    return reply.status(204).send();
  });

  api.get("/groups/:id/members", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request) => {
    await requireMember(app, request, request.params.id);
    const client = db(app);
    const { data: members, error } = await client.from("group_members").select("group_id,user_id,role,joined_at").eq("group_id", request.params.id);
    if (error) throw new AppError(503, "GROUP_MEMBERS_FAILED", "No se pudieron cargar los miembros.");
    const ids = (members ?? []).map((member) => member.user_id);
    const { data: profiles } = ids.length
      ? await client.from("profiles").select("user_id,nombre_completo,username,avatar_url").in("user_id", ids)
      : { data: [] };
    return { data: (members ?? []).map((member) => ({ ...member, profile: (profiles ?? []).find((profile) => profile.user_id === member.user_id) ?? null })) };
  });

  api.post("/groups/:id/admins/promote", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupRoleBodySchema } }, async (request, reply) => {
    const actorRole = await requireManager(app, request, request.params.id);
    if (actorRole !== "owner") throw new AppError(403, "GROUP_OWNER_REQUIRED", "Sólo el propietario puede promover administradores.");
    const { error } = await db(app).from("group_members").update({ role: "admin" }).eq("group_id", request.params.id).eq("user_id", request.body.userId).eq("role", "member");
    if (error) throw new AppError(503, "GROUP_ROLE_FAILED", "No se pudo cambiar el rol.");
    return reply.status(204).send();
  });

  api.post("/groups/:id/admins/demote", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupRoleBodySchema } }, async (request, reply) => {
    const actorRole = await requireManager(app, request, request.params.id);
    if (actorRole !== "owner") throw new AppError(403, "GROUP_OWNER_REQUIRED", "Sólo el propietario puede cambiar administradores.");
    const { error } = await db(app).from("group_members").update({ role: "member" }).eq("group_id", request.params.id).eq("user_id", request.body.userId).eq("role", "admin");
    if (error) throw new AppError(503, "GROUP_ROLE_FAILED", "No se pudo cambiar el rol.");
    return reply.status(204).send();
  });

  api.delete("/groups/:id/members/:userId", { preHandler: app.requireActiveAccount, schema: { params: groupMemberParamsSchema } }, async (request, reply) => {
    await requireManager(app, request, request.params.id);
    const targetRole = await membership(app, request.params.id, request.params.userId);
    if (targetRole === "owner") throw new AppError(409, "GROUP_OWNER_PROTECTED", "No se puede expulsar al propietario.");
    const { error } = await db(app).from("group_members").delete().eq("group_id", request.params.id).eq("user_id", request.params.userId);
    if (error) throw new AppError(503, "GROUP_MEMBER_DELETE_FAILED", "No se pudo quitar al miembro.");
    return reply.status(204).send();
  });

  api.post("/groups/:id/invite", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupInviteSchema } }, async (request) => {
    await requireManager(app, request, request.params.id);
    const client = db(app);
    const uniqueIds = Array.from(new Set(request.body.userIds)).filter((id) => id !== request.authUser!.id);
    const { data: existing, error: lookupError } = await client.from("group_members").select("user_id")
      .eq("group_id", request.params.id).in("user_id", uniqueIds);
    if (lookupError) throw new AppError(503, "GROUP_INVITE_FAILED", "No se pudieron comprobar los miembros.");
    const existingIds = new Set((existing ?? []).map((row) => row.user_id));
    const rows = uniqueIds.filter((id) => !existingIds.has(id)).map((userId) => ({ group_id: request.params.id, user_id: userId, role: "member" }));
    if (rows.length) {
      const { error } = await client.from("group_members").insert(rows);
      if (error) throw new AppError(503, "GROUP_INVITE_FAILED", "No se pudieron agregar los miembros.");
    }
    return { data: { inserted: rows.length, skipped: uniqueIds.length - rows.length } };
  });

  api.get("/groups/:id/messages", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request) => {
    await requireMember(app, request, request.params.id);
    const client = db(app);
    const { data, error } = await client.from("group_messages").select().eq("group_id", request.params.id).order("created_at", { ascending: true }).limit(500);
    if (error) throw new AppError(503, "GROUP_MESSAGES_FAILED", "No se pudieron cargar los mensajes.");
    const senderIds = Array.from(new Set((data ?? []).map((message) => message.sender_id)));
    const { data: profiles, error: profileError } = senderIds.length
      ? await client.from("profiles").select("user_id,nombre_completo,username,avatar_url").in("user_id", senderIds)
      : { data: [], error: null };
    if (profileError) throw new AppError(503, "GROUP_MESSAGES_FAILED", "No se pudieron cargar los autores.");
    return {
      data: (data ?? []).map((message) => ({
        ...message,
        profile: (profiles ?? []).find((profile) => profile.user_id === message.sender_id) ?? null,
      })),
    };
  });

  api.post("/groups/:id/messages", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema, body: groupMessageSchema } }, async (request, reply) => {
    await requireMember(app, request, request.params.id);
    const { data, error } = await db(app).from("group_messages").insert({
      group_id: request.params.id,
      sender_id: request.authUser!.id,
      content: request.body.content,
      image_url: request.body.image_url ?? null,
    }).select().single();
    if (error) throw new AppError(503, "GROUP_MESSAGE_FAILED", "No se pudo enviar el mensaje.");
    return reply.status(201).send({ data });
  });

  api.delete("/groups/:id/messages/:messageId", { preHandler: app.requireActiveAccount, schema: { params: groupMessageParamsSchema } }, async (request, reply) => {
    const actorRole = await requireMember(app, request, request.params.id);
    const client = db(app);
    const { data: message, error: lookupError } = await client.from("group_messages").select("sender_id")
      .eq("id", request.params.messageId).eq("group_id", request.params.id).maybeSingle();
    if (lookupError) throw new AppError(503, "GROUP_MESSAGE_DELETE_FAILED", "No se pudo comprobar el mensaje.");
    if (!message) throw new AppError(404, "GROUP_MESSAGE_NOT_FOUND", "El mensaje no existe.");
    if (message.sender_id !== request.authUser!.id && !["owner", "admin"].includes(actorRole)) {
      throw new AppError(403, "GROUP_MESSAGE_DELETE_FORBIDDEN", "No puedes eliminar ese mensaje.");
    }
    const { error } = await client.from("group_messages").delete().eq("id", request.params.messageId);
    if (error) throw new AppError(503, "GROUP_MESSAGE_DELETE_FAILED", "No se pudo eliminar el mensaje.");
    return reply.status(204).send();
  });

  api.delete("/group-messages/:messageId", { preHandler: app.requireActiveAccount, schema: { params: groupMessageIdParamsSchema } }, async (request, reply) => {
    const client = db(app);
    const { data: message, error: lookupError } = await client.from("group_messages")
      .select("group_id,sender_id").eq("id", request.params.messageId).maybeSingle();
    if (lookupError) throw new AppError(503, "GROUP_MESSAGE_DELETE_FAILED", "No se pudo comprobar el mensaje.");
    if (!message) throw new AppError(404, "GROUP_MESSAGE_NOT_FOUND", "El mensaje no existe.");
    const actorRole = await requireMember(app, request, message.group_id);
    if (message.sender_id !== request.authUser!.id && !["owner", "admin"].includes(actorRole)) {
      throw new AppError(403, "GROUP_MESSAGE_DELETE_FORBIDDEN", "No puedes eliminar ese mensaje.");
    }
    const { error } = await client.from("group_messages").delete().eq("id", request.params.messageId);
    if (error) throw new AppError(503, "GROUP_MESSAGE_DELETE_FAILED", "No se pudo eliminar el mensaje.");
    return reply.status(204).send();
  });

  api.delete("/groups/:id", { preHandler: app.requireActiveAccount, schema: { params: groupParamsSchema } }, async (request, reply) => {
    const role = await membership(app, request.params.id, request.authUser!.id);
    if (role !== "owner" && app.getPowerRole(request) !== "admin") {
      throw new AppError(403, "GROUP_OWNER_REQUIRED", "Sólo el propietario puede eliminar el grupo.");
    }
    const { error } = await db(app).from("groups").delete().eq("id", request.params.id);
    if (error) throw new AppError(503, "GROUP_DELETE_FAILED", "No se pudo eliminar el grupo.");
    return reply.status(204).send();
  });
}
