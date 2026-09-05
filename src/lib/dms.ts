import { apiFetch } from "@/lib/backend";

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
  return apiFetch<Conversation>("/v1/dms/conversations", {
    method: "POST",
    body: JSON.stringify({ otherId: otherUserId }),
  });
}

export async function listDMs(conversationId: string): Promise<DMMessage[]> {
  return apiFetch<DMMessage[]>(`/v1/dms/conversations/${conversationId}/messages`);
}

export async function sendDM(conversationId: string, content: string): Promise<DMMessage> {
  return apiFetch<DMMessage>(`/v1/dms/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
