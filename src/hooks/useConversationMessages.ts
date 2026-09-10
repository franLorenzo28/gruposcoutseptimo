import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessagePage, mergeMessages } from "@/lib/message-history";
import type { DMMessage } from "@/lib/dms";

type HistoryState = {
  id: string | null; messages: DMMessage[]; hasMore: boolean;
  loading: boolean; loadingOlder: boolean; error: string | null;
};
const empty: HistoryState = { id: null, messages: [], hasMore: false, loading: false, loadingOlder: false, error: null };

export function useConversationMessages(conversationId: string | null) {
  const [state, setState] = useState<HistoryState>(empty);
  const generation = useRef(0);
  const olderRequest = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const request = ++generation.current;
    olderRequest.current = false;
    if (!conversationId) { setState(empty); return; }
    let active = true;
    setState({ ...empty, id: conversationId, loading: true });
    const channel = supabase.channel(`message-history:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const message = payload.new as DMMessage;
        if (!active || message.conversation_id !== conversationId) return;
        setState(prev => prev.id !== conversationId ? prev : { ...prev, messages: mergeMessages(prev.messages, [message]) });
      })
      .subscribe();
    void fetchMessagePage(conversationId).then(page => {
      if (active && request === generation.current) {
        setState(prev => ({ ...prev, messages: mergeMessages(page.messages, prev.messages), hasMore: page.hasMore, loading: false }));
      }
    }).catch((error: unknown) => {
      if (active) setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : "No se pudieron cargar los mensajes." }));
    });
    return () => { active = false; ++generation.current; void supabase.removeChannel(channel); };
  }, [conversationId, retryCount]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || state.id !== conversationId || state.loading || !state.hasMore || olderRequest.current) return false;
    const before = state.messages[0];
    if (!before) return false;
    const request = generation.current;
    olderRequest.current = true;
    setState(prev => ({ ...prev, loadingOlder: true, error: null }));
    try {
      const page = await fetchMessagePage(conversationId, before);
      if (request !== generation.current) return false;
      setState(prev => ({ ...prev, messages: mergeMessages(page.messages, prev.messages), hasMore: page.hasMore, loadingOlder: false }));
      return true;
    } catch (error) {
      if (request === generation.current) setState(prev => ({ ...prev, loadingOlder: false, error: error instanceof Error ? error.message : "No se pudieron cargar mensajes anteriores." }));
      return false;
    } finally {
      if (request === generation.current) olderRequest.current = false;
    }
  }, [conversationId, state]);

  const append = useCallback((message: DMMessage) => {
    setState(prev => prev.id === message.conversation_id ? { ...prev, messages: mergeMessages(prev.messages, [message]) } : prev);
  }, []);
  return { ...(state.id === conversationId ? state : { ...empty, loading: !!conversationId }), loadOlder, append, retry: () => setRetryCount(count => count + 1) };
}
