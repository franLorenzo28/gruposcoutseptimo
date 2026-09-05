import { supabase } from "@/integrations/supabase/client";
import { createDMNotification } from "@/lib/notifications";
import { apiFetch, isLocalBackend } from "@/lib/backend";

export type Conversation = {
  id: string;
  user_a?: string;
  user_b?: string;
  created_at: string;
};

export type DMMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
};

export async function createOrGetConversation(otherUserId: string): Promise<Conversation> {
  if (isLocalBackend()) {
    return apiFetch<Conversation>("/v1/dms/conversations", {
      method: "POST",
      body: JSON.stringify({ otherId: otherUserId }),
    });
  }

  const { data, error } = await supabase.rpc("create_or_get_conversation", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
  return {
    id: String(data),
    user_a: "",
    user_b: "",
    created_at: new Date().toISOString(),
  };
}

export async function listDMs(conversationId: string): Promise<DMMessage[]> {
  if (isLocalBackend()) {
    return apiFetch<DMMessage[]>(`/v1/dms/conversations/${conversationId}/messages`);
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as DMMessage[];
}

export async function sendDM(conversationId: string, content: string): Promise<DMMessage> {
  if (isLocalBackend()) {
    return apiFetch<DMMessage>(`/v1/dms/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  const { data: userData } = await supabase.auth.getUser();
  const senderId = userData.user?.id;
  if (!senderId) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) {
    if (error.message?.includes("row-level security")) {
      throw new Error(
        "No autorizado para enviar mensaje. Verifica que la conversación se creó correctamente y eres participante.",
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
      const recipientId = participants?.find((participant) => participant.user_id !== senderId)?.user_id;
      if (!recipientId) return;

      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("nombre_completo, username, avatar_url")
        .eq("user_id", senderId)
        .maybeSingle();

      await createDMNotification({
        senderId,
        recipientId,
        conversationId,
        messageId: data.id,
        content,
        senderDisplayName: senderProfile?.nombre_completo || senderProfile?.username || "Scout",
        senderUsername: senderProfile?.username ?? null,
        senderAvatarUrl: senderProfile?.avatar_url ?? null,
      });
    } catch (notificationError) {
      console.warn("Failed to create DM notification:", notificationError);
    }
  })();

  return data as DMMessage;
}
