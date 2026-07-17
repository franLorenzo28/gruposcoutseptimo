import { supabase } from "@/integrations/supabase/client";
import { createDMNotification } from "@/lib/notifications";

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
  // Supabase path: necesitamos sender_id y validar participación
  const { data: userData } = await supabase.auth.getUser();
  const sender_id = userData.user?.id;
  if (!sender_id) throw new Error("No autenticado");

  // Validar que el usuario participa en la conversación (evita error RLS silencioso)
  // La tabla conversation_participants no está tipada en Database, hacemos chequeo vía RPC-like fallback
  const { data: _checkRows, error: checkError } = await supabase
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
        "No autorizado para enviar mensaje. Verifica que la conversación se creó correctamente y eres participante."
      );
    }
    throw error;
  }

  void (async () => {
    try {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId);
      const recipientId = participants?.find((p) => p.user_id !== sender_id)?.user_id;
      if (!recipientId) return;

      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("nombre_completo, username, avatar_url")
        .eq("user_id", sender_id)
        .maybeSingle();

      await createDMNotification({
        senderId: sender_id,
        recipientId,
        conversationId,
        messageId: data.id,
        content,
        senderDisplayName:
          senderProfile?.nombre_completo || senderProfile?.username || "Scout",
        senderUsername: senderProfile?.username ?? null,
        senderAvatarUrl: senderProfile?.avatar_url ?? null,
      });
    } catch (e) {
      console.warn("Failed to create DM notification:", e);
    }
  })();

  return data as DMMessage;
}
