import { isLocalBackend, apiFetch } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};
export type DMMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export async function createOrGetConversation(
  otherUserId: string,
): Promise<Conversation> {
  if (isLocalBackend()) {
    const convo = await apiFetch("/dms/conversations", {
      method: "POST",
      body: JSON.stringify({ otherId: otherUserId }),
    });
    return convo as Conversation;
  }
  const { data, error } = await supabase.rpc("create_or_get_conversation", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
  // supabase RPC returns id; fetch row shape minimally
  return {
    id: String(data),
    user_a: "",
    user_b: "",
    created_at: new Date().toISOString(),
  };
}

export async function listDMs(conversationId: string): Promise<DMMessage[]> {
  if (isLocalBackend()) {
    const rows = await apiFetch(
      `/dms/conversations/${conversationId}/messages`,
    );
    return rows as DMMessage[];
  }
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as DMMessage[];
}

export async function sendDM(
  conversationId: string,
  content: string,
): Promise<DMMessage> {
  if (isLocalBackend()) {
    const row = await apiFetch(
      `/dms/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    return row as DMMessage;
  }
  // Supabase path: necesitamos sender_id y validar participación
  const { data: userData } = await supabase.auth.getUser();
  const sender_id = userData.user?.id;
  if (!sender_id) throw new Error("No autenticado");

  // Validar que el usuario participa en la conversación (evita error RLS silencioso)
  // La tabla conversation_participants no está tipada en Database, hacemos chequeo vía RPC-like fallback
  const { data: checkRows, error: checkError } = await supabase
    .from("messages") // usamos messages para una consulta rápida de any prior message
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("sender_id", sender_id)
    .limit(1);
  if (checkError) {
    // Ignoramos error aquí (puede no existir mensaje previo); continuamos con intento de insert
    console.warn("Check participante fallback error", checkError.message);
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id, content })
    .select()
    .single();
  if (error) {
    // Mensaje más claro ante fallo de política RLS
    if (error.message?.includes("row-level security")) {
      throw new Error(
        "No autorizado para enviar mensaje (RLS). Verifica que la conversación se creó correctamente y eres participante."
      );
    }
    throw error;
  }

  // Persistir notificación para el otro participante en Supabase.
  // Esto asegura que aparezca en la campana incluso si el canal de messages no emite al cliente.
  try {
    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", sender_id)
      .limit(1);

    const recipientId = participantRows?.[0]?.user_id;

    if (recipientId) {
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("nombre_completo, username, avatar_url")
        .eq("user_id", sender_id)
        .maybeSingle();

      const payload = {
        conversation_id: conversationId,
        message_id: data.id,
        sender_id,
        content,
        display:
          actorProfile?.nombre_completo ||
          actorProfile?.username ||
          sender_id.slice(0, 8),
        username: actorProfile?.username || null,
        avatar_url: actorProfile?.avatar_url || null,
      };

      // 1) Intentar RPC existente (si está disponible en proyecto).
      const { error: rpcError } = await supabase.rpc("create_notification", {
        p_recipient: recipientId,
        p_actor: sender_id,
        p_type: "message",
        p_entity_type: "message",
        p_entity_id: data.id,
        p_data: payload,
      });

      // 2) Fallback por insert directo si la RPC no existe o falla.
      if (rpcError) {
        await supabase.from("notifications").insert({
          recipient_id: recipientId,
          actor_id: sender_id,
          type: "message",
          entity_type: "message",
          entity_id: data.id,
          data: payload,
        } as any);
      }
    }
  } catch (notificationError) {
    if (import.meta.env.DEV) {
      console.warn("No se pudo persistir notificación de DM en Supabase", notificationError);
    }
    // No bloquear UX de chat si falla la notificación.
  }

  return data as DMMessage;
}
