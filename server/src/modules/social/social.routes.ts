import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import {
  conversationBodySchema,
  conversationParamsSchema,
  directMessageSchema,
  followBodySchema,
  followCountsQuerySchema,
  followsListQuerySchema,
  listQuerySchema,
  userParamsSchema,
} from "./social.schemas.js";

function adminDb(app: FastifyInstance) {
  if (!app.supabaseAdmin) throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio social no está disponible.");
  return app.supabaseAdmin;
}

async function assertConversationMember(app: FastifyInstance, conversationId: string, userId: string) {
  const { data, error } = await adminDb(app)
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError(503, "CONVERSATION_AUTH_FAILED", "No se pudo comprobar la conversación.");
  if (!data) throw new AppError(403, "CONVERSATION_MEMBER_REQUIRED", "No perteneces a esta conversación.");
}

async function assertCanViewFollowList(app: FastifyInstance, viewerId: string, targetId: string) {
  if (viewerId === targetId) return;
  const client = adminDb(app);
  const { data: profile, error } = await client.from("profiles").select("is_public")
    .eq("user_id", targetId).maybeSingle();
  if (error) throw new AppError(503, "FOLLOW_PRIVACY_FAILED", "No se pudo comprobar la privacidad.");
  if (profile?.is_public) return;
  const { data: relation } = await client.from("follows").select("status")
    .eq("follower_id", viewerId).eq("followed_id", targetId).eq("status", "accepted").maybeSingle();
  if (!relation) throw new AppError(403, "FOLLOW_LIST_PRIVATE", "La lista de este perfil es privada.");
}

function normalizedBranches(value: string | null | undefined): Set<string> {
  const result = new Set<string>();
  for (const raw of String(value || "").split(/[;,|]/g)) {
    const branch = raw.trim().toLowerCase();
    if (branch.includes("manada") || branch.includes("lobat")) result.add("manada");
    if (branch.includes("tropa") || branch.includes("camin")) result.add("tropa");
    if (branch.includes("pioner")) result.add("pioneros");
    if (branch.includes("rover")) result.add("rovers");
  }
  return result;
}

function profileBranch(profile: {
  edad: number | null;
  rama_que_educa: string | null;
  seisena: string | null;
  patrulla: string | null;
  equipo_pioneros: string | null;
  comunidad_rovers: string | null;
}): string | null {
  if (profile.edad !== null && profile.edad < 21) {
    if (profile.edad >= 18) return "rovers";
    if (profile.edad >= 15) return "pioneros";
    if (profile.edad >= 11) return "tropa";
    if (profile.edad >= 7) return "manada";
  }
  const explicit = normalizedBranches(profile.rama_que_educa).values().next().value;
  if (explicit) return explicit;
  if (profile.seisena) return "manada";
  if (profile.patrulla) return "tropa";
  if (profile.equipo_pioneros) return "pioneros";
  if (profile.comunidad_rovers) return "rovers";
  return null;
}

export async function socialRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.get("/follows/relation/:id", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request) => {
    const { data, error } = await adminDb(app)
      .from("follows")
      .select("follower_id,followed_id,status,created_at,accepted_at")
      .eq("follower_id", request.authUser!.id)
      .eq("followed_id", request.params.id)
      .maybeSingle();
    if (error) throw new AppError(503, "FOLLOW_READ_FAILED", "No se pudo consultar la relación.");
    return { data };
  });

  api.post("/follows/follow", { preHandler: app.requireActiveAccount, schema: { body: followBodySchema } }, async (request, reply) => {
    const me = request.authUser!.id;
    if (me === request.body.targetId) throw new AppError(400, "FOLLOW_SELF_FORBIDDEN", "No puedes seguirte a ti mismo.");
    const client = adminDb(app);
    const { data: target, error: targetError } = await client
      .from("profiles")
      .select("is_public,account_status")
      .eq("user_id", request.body.targetId)
      .maybeSingle();
    if (targetError) throw new AppError(503, "FOLLOW_TARGET_FAILED", "No se pudo comprobar el perfil.");
    if (!target || target.account_status !== "activo") throw new AppError(404, "PROFILE_NOT_FOUND", "El perfil no existe.");
    const status = target.is_public ? "accepted" : "pending";
    const { data, error } = await client
      .from("follows")
      .upsert(
        { follower_id: me, followed_id: request.body.targetId, status, accepted_at: status === "accepted" ? new Date().toISOString() : null },
        { onConflict: "follower_id,followed_id", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    if (error) throw new AppError(503, "FOLLOW_CREATE_FAILED", "No se pudo crear la solicitud.");
    return reply.status(201).send({ data: data ?? { follower_id: me, followed_id: request.body.targetId, status } });
  });

  api.delete("/follows/:id", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request, reply) => {
    const { error } = await adminDb(app).from("follows").delete().eq("follower_id", request.authUser!.id).eq("followed_id", request.params.id);
    if (error) throw new AppError(503, "FOLLOW_DELETE_FAILED", "No se pudo dejar de seguir.");
    return reply.status(204).send();
  });

  api.post("/follows/:id/accept", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request, reply) => {
    const { data, error } = await adminDb(app).from("follows")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("follower_id", request.params.id)
      .eq("followed_id", request.authUser!.id)
      .eq("status", "pending")
      .select("follower_id")
      .maybeSingle();
    if (error) throw new AppError(503, "FOLLOW_ACCEPT_FAILED", "No se pudo aceptar la solicitud.");
    if (!data) throw new AppError(404, "FOLLOW_REQUEST_NOT_FOUND", "La solicitud no existe.");
    return reply.status(204).send();
  });

  api.delete("/follows/:id/reject", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request, reply) => {
    const { error } = await adminDb(app).from("follows").delete()
      .eq("follower_id", request.params.id)
      .eq("followed_id", request.authUser!.id)
      .eq("status", "pending");
    if (error) throw new AppError(503, "FOLLOW_REJECT_FAILED", "No se pudo rechazar la solicitud.");
    return reply.status(204).send();
  });

  api.get("/follows/followers", { preHandler: app.requireActiveAccount, schema: { querystring: followsListQuerySchema } }, async (request) => {
    await assertCanViewFollowList(app, request.authUser!.id, request.query.userId);
    const { data, error } = await adminDb(app).from("follows").select("follower_id,created_at")
      .eq("followed_id", request.query.userId).eq("status", "accepted")
      .order("created_at", { ascending: false }).range(request.query.offset, request.query.offset + request.query.limit - 1);
    if (error) throw new AppError(503, "FOLLOW_LIST_FAILED", "No se pudo cargar la lista.");
    return { data: data ?? [] };
  });

  api.get("/follows/following", { preHandler: app.requireActiveAccount, schema: { querystring: followsListQuerySchema } }, async (request) => {
    await assertCanViewFollowList(app, request.authUser!.id, request.query.userId);
    const { data, error } = await adminDb(app).from("follows").select("followed_id,created_at")
      .eq("follower_id", request.query.userId).eq("status", "accepted")
      .order("created_at", { ascending: false }).range(request.query.offset, request.query.offset + request.query.limit - 1);
    if (error) throw new AppError(503, "FOLLOW_LIST_FAILED", "No se pudo cargar la lista.");
    return { data: data ?? [] };
  });

  api.get("/follows/counts", { preHandler: app.requireActiveAccount, schema: { querystring: followCountsQuerySchema } }, async (request) => {
    await assertCanViewFollowList(app, request.authUser!.id, request.query.userId);
    const client = adminDb(app);
    const [followersResult, followingResult] = await Promise.all([
      client.from("follows").select("follower_id", { count: "exact", head: true })
        .eq("followed_id", request.query.userId).eq("status", "accepted"),
      client.from("follows").select("followed_id", { count: "exact", head: true })
        .eq("follower_id", request.query.userId).eq("status", "accepted"),
    ]);
    if (followersResult.error || followingResult.error) {
      throw new AppError(503, "FOLLOW_COUNTS_FAILED", "No se pudieron cargar los contadores.");
    }
    return { data: { followers: followersResult.count ?? 0, following: followingResult.count ?? 0 } };
  });

  api.get("/follows/pending", { preHandler: app.requireActiveAccount }, async (request) => {
    const { data, error } = await adminDb(app).from("follows").select("follower_id,created_at")
      .eq("followed_id", request.authUser!.id).eq("status", "pending").order("created_at", { ascending: false }).limit(100);
    if (error) throw new AppError(503, "FOLLOW_LIST_FAILED", "No se pudieron cargar las solicitudes.");
    return { data: data ?? [] };
  });

  api.get("/social/contacts", { preHandler: app.requireActiveAccount }, async (request) => {
    const client = adminDb(app);
    const me = request.authUser!.id;
    const [profileResult, outgoingResult, incomingResult] = await Promise.all([
      client.from("profiles").select("rol_adulto,educador_aprobado,rama_que_educa")
        .eq("user_id", me).maybeSingle(),
      client.from("follows").select("followed_id").eq("follower_id", me).eq("status", "accepted"),
      client.from("follows").select("follower_id").eq("followed_id", me).eq("status", "accepted"),
    ]);
    if (profileResult.error || outgoingResult.error || incomingResult.error) {
      throw new AppError(503, "CONTACTS_READ_FAILED", "No se pudieron cargar los contactos.");
    }

    const outgoing = new Set((outgoingResult.data ?? []).map((row) => row.followed_id));
    const mutualIds = new Set(
      (incomingResult.data ?? []).map((row) => row.follower_id).filter((id) => outgoing.has(id)),
    );
    const adultRole = String(profileResult.data?.rol_adulto || "").toLowerCase();
    const isApprovedEducator = ["educador", "educador/a", "educadora"].includes(adultRole)
      && profileResult.data?.educador_aprobado !== false;
    const educatorBranches = isApprovedEducator
      ? normalizedBranches(profileResult.data?.rama_que_educa)
      : new Set<string>();

    const { data: profiles, error } = await client.from("profiles")
      .select("user_id,nombre_completo,username,avatar_url,edad,rama_que_educa,seisena,patrulla,equipo_pioneros,comunidad_rovers")
      .eq("account_status", "activo").neq("user_id", me).limit(1000);
    if (error) throw new AppError(503, "CONTACTS_READ_FAILED", "No se pudieron cargar los contactos.");

    return {
      data: (profiles ?? [])
        .filter((profile) => mutualIds.has(profile.user_id) || educatorBranches.has(profileBranch(profile) || ""))
        .map((profile) => ({
          user_id: profile.user_id,
          nombre_completo: profile.nombre_completo,
          username: profile.username,
          avatar_url: profile.avatar_url,
          source: mutualIds.has(profile.user_id) ? "mutual" : "rama",
        })),
    };
  });

  api.get("/dms/conversations", { preHandler: app.requireActiveAccount, schema: { querystring: listQuerySchema } }, async (request) => {
    const client = adminDb(app);
    const me = request.authUser!.id;
    const { data: ownParticipants, error: participantError } = await client.from("conversation_participants")
      .select("conversation_id").eq("user_id", me).range(request.query.offset, request.query.offset + request.query.limit - 1);
    if (participantError) throw new AppError(503, "CONVERSATION_LIST_FAILED", "No se pudieron cargar las conversaciones.");
    const ids = (ownParticipants ?? []).map((row) => row.conversation_id);
    if (!ids.length) return { data: [] };

    const [conversationsResult, participantsResult, messagesResult] = await Promise.all([
      client.from("conversations").select("id,last_message_at,created_at").in("id", ids),
      client.from("conversation_participants").select("conversation_id,user_id").in("conversation_id", ids),
      client.from("messages").select("conversation_id,content,sender_id,created_at")
        .in("conversation_id", ids).order("created_at", { ascending: false }).limit(1000),
    ]);
    if (conversationsResult.error || participantsResult.error || messagesResult.error) {
      throw new AppError(503, "CONVERSATION_LIST_FAILED", "No se pudieron cargar las conversaciones.");
    }
    const otherByConversation = new Map<string, string>();
    for (const participant of participantsResult.data ?? []) {
      if (participant.user_id !== me) otherByConversation.set(participant.conversation_id, participant.user_id);
    }
    const lastByConversation = new Map<string, { content: string; sender_id: string; created_at: string }>();
    for (const message of messagesResult.data ?? []) {
      if (!lastByConversation.has(message.conversation_id)) lastByConversation.set(message.conversation_id, message);
    }
    const summaries = (conversationsResult.data ?? []).flatMap((conversation) => {
      const otherUserId = otherByConversation.get(conversation.id);
      if (!otherUserId) return [];
      const last = lastByConversation.get(conversation.id);
      return [{
        id: conversation.id,
        last_message_at: last?.created_at ?? conversation.last_message_at ?? conversation.created_at,
        other_user_id: otherUserId,
        last_message_content: last?.content ?? null,
        last_message_sender_id: last?.sender_id ?? null,
      }];
    });
    summaries.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
    return { data: summaries };
  });

  api.post("/dms/conversations", { preHandler: app.requireActiveAccount, schema: { body: conversationBodySchema } }, async (request) => {
    const me = request.authUser!.id;
    const other = request.body.otherId;
    if (me === other) throw new AppError(400, "CONVERSATION_SELF_FORBIDDEN", "No puedes abrir un chat contigo mismo.");
    const client = adminDb(app);
    const [outgoing, incoming] = await Promise.all([
      client.from("follows").select("status").eq("follower_id", me).eq("followed_id", other).eq("status", "accepted").maybeSingle(),
      client.from("follows").select("status").eq("follower_id", other).eq("followed_id", me).eq("status", "accepted").maybeSingle(),
    ]);
    if (!outgoing.data || !incoming.data) {
      throw new AppError(403, "MUTUAL_FOLLOW_REQUIRED", "Sólo puedes iniciar chat con seguimiento mutuo.");
    }
    if (!request.userSupabase) throw new AppError(401, "AUTH_REQUIRED", "Debes iniciar sesión.");
    const { data, error } = await request.userSupabase.rpc("create_or_get_conversation", { other_user_id: other });
    if (error) throw new AppError(503, "CONVERSATION_CREATE_FAILED", "No se pudo crear la conversación.");
    return { data: { id: String(data), created_at: new Date().toISOString() } };
  });

  api.get("/dms/conversations/:id/messages", { preHandler: app.requireActiveAccount, schema: { params: conversationParamsSchema } }, async (request) => {
    await assertConversationMember(app, request.params.id, request.authUser!.id);
    const { data, error } = await adminDb(app).from("messages").select().eq("conversation_id", request.params.id).order("created_at", { ascending: true }).limit(500);
    if (error) throw new AppError(503, "MESSAGE_LIST_FAILED", "No se pudieron cargar los mensajes.");
    return { data: data ?? [] };
  });

  api.post("/dms/conversations/:id/messages", { preHandler: app.requireActiveAccount, schema: { params: conversationParamsSchema, body: directMessageSchema } }, async (request, reply) => {
    await assertConversationMember(app, request.params.id, request.authUser!.id);
    const { data, error } = await adminDb(app).from("messages").insert({
      conversation_id: request.params.id,
      sender_id: request.authUser!.id,
      content: request.body.content,
    }).select().single();
    if (error) throw new AppError(503, "MESSAGE_SEND_FAILED", "No se pudo enviar el mensaje.");
    return reply.status(201).send({ data });
  });

  api.get("/notifications", { preHandler: app.requireActiveAccount, schema: { querystring: listQuerySchema } }, async (request) => {
    const { data, error } = await adminDb(app).from("notifications")
      .select("id,type,entity_type,entity_id,data,read_at,created_at,actor_id")
      .eq("recipient_id", request.authUser!.id)
      .order("created_at", { ascending: false })
      .range(request.query.offset, request.query.offset + request.query.limit - 1);
    if (error) throw new AppError(503, "NOTIFICATION_LIST_FAILED", "No se pudieron cargar las notificaciones.");
    return { data: data ?? [] };
  });

  api.post("/notifications/mark-all-read", { preHandler: app.requireActiveAccount }, async (request, reply) => {
    const { error } = await adminDb(app).from("notifications").update({ read_at: new Date().toISOString() })
      .eq("recipient_id", request.authUser!.id).is("read_at", null);
    if (error) throw new AppError(503, "NOTIFICATION_UPDATE_FAILED", "No se pudieron actualizar las notificaciones.");
    return reply.status(204).send();
  });

  api.post("/notifications/:id/read", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request, reply) => {
    const { error } = await adminDb(app).from("notifications").update({ read_at: new Date().toISOString() })
      .eq("id", request.params.id).eq("recipient_id", request.authUser!.id);
    if (error) throw new AppError(503, "NOTIFICATION_UPDATE_FAILED", "No se pudo actualizar la notificación.");
    return reply.status(204).send();
  });

  api.delete("/notifications/:id", { preHandler: app.requireActiveAccount, schema: { params: userParamsSchema } }, async (request, reply) => {
    const { error } = await adminDb(app).from("notifications").delete().eq("id", request.params.id).eq("recipient_id", request.authUser!.id);
    if (error) throw new AppError(503, "NOTIFICATION_DELETE_FAILED", "No se pudo eliminar la notificación.");
    return reply.status(204).send();
  });
}
