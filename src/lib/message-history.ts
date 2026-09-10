import { supabase } from "@/integrations/supabase/client";
import type { DMMessage } from "@/lib/dms";

export const MESSAGE_PAGE_SIZE = 50;
export type MessageCursor = Pick<DMMessage, "created_at" | "id">;

function microsecondsWithinMillisecond(iso: string) {
  return Number((iso.match(/\.(\d+)/)?.[1] ?? "").padEnd(6, "0").slice(3, 6));
}

export function mergeMessages(current: DMMessage[], incoming: DMMessage[]): DMMessage[] {
  return [...new Map([...current, ...incoming].map(message => [message.id, message])).values()]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
      || microsecondsWithinMillisecond(a.created_at) - microsecondsWithinMillisecond(b.created_at)
      || a.id.localeCompare(b.id));
}

export async function fetchMessagePage(conversationId: string, before?: MessageCursor) {
  let query = supabase.from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);
  if (before) {
    // The cursor originates in database rows; validate before building the OR filter.
    if (!/^[a-f\d-]{36}$/i.test(before.id) || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before.created_at)) {
      throw new Error("Cursor de mensajes inválido");
    }
    query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data || []) as DMMessage[];
  return { messages: rows.slice(0, MESSAGE_PAGE_SIZE).reverse(), hasMore: rows.length > MESSAGE_PAGE_SIZE };
}

export type ConversationSummary = {
  id: string;
  last_message_at: string | null;
  other_user_id: string;
  last_message_content: string | null;
  last_message_sender_id: string | null;
};

type ConversationRow = {
  id: string; created_at: string; last_message_at: string | null;
  messages: Array<Pick<DMMessage, "content" | "sender_id" | "created_at">>;
  conversation_participants: Array<{ user_id: string }>;
};

export async function fetchConversationSummaries(userId: string): Promise<ConversationSummary[]> {
  // The inner membership filter restricts parents; the separate embedding keeps the other participant.
  const { data, error } = await supabase.from("conversations")
    .select("id, created_at, last_message_at, membership:conversation_participants!inner(user_id), conversation_participants(user_id), messages(content, sender_id, created_at)")
    .eq("membership.user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .order("id", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });
  if (error) throw error;
  return ((data || []) as unknown as ConversationRow[]).flatMap(row => {
    const other = row.conversation_participants.find(participant => participant.user_id !== userId);
    if (!other) return [];
    const last = row.messages[0];
    return [{
      id: row.id, other_user_id: other.user_id,
      last_message_at: last?.created_at ?? row.last_message_at ?? row.created_at,
      last_message_content: last?.content ?? null, last_message_sender_id: last?.sender_id ?? null,
    }];
  });
}
