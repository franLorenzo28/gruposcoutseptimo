/**
 * Hooks de React Query personalizados para fetching optimizado
 * Caché automático, retry, deduplicación de requests
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { listGroups } from "@/lib/groups";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// PROFILES
// ============================================================================

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      if (isLocalBackend()) {
        return apiFetch("/profiles/directory?limit=200&offset=0");
      }
      const { data, error } = await supabase.rpc("list_profiles_directory");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      if (isLocalBackend()) {
        return apiFetch(`/profiles/${userId}`);
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============================================================================
// FOLLOWS
// ============================================================================

export function useFollows(userId: string | null) {
  return useQuery({
    queryKey: ["follows", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      
      if (isLocalBackend()) {
        const iFollow = await apiFetch(`/follows?follower_id=${userId}&status=accepted`);
        const followsMe = await apiFetch(`/follows?followed_id=${userId}&status=accepted`);
        return { iFollow: iFollow || [], followsMe: followsMe || [] };
      }

      const [iFollowRes, followsMeRes] = await Promise.all([
        supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", userId)
          .eq("status", "accepted"),
        supabase
          .from("follows")
          .select("follower_id")
          .eq("followed_id", userId)
          .eq("status", "accepted"),
      ]);

      if (iFollowRes.error) throw iFollowRes.error;
      if (followsMeRes.error) throw followsMeRes.error;

      return {
        iFollow: iFollowRes.data || [],
        followsMe: followsMeRes.data || [],
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// THREADS (Comuni 7)
// ============================================================================

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      if (isLocalBackend()) {
        return apiFetch("/threads");
      }
      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto (más dinámico)
  });
}

export function useThreadComments(threadId: string | null) {
  return useQuery({
    queryKey: ["thread-comments", threadId],
    queryFn: async () => {
      if (!threadId) throw new Error("Thread ID required");
      if (isLocalBackend()) {
        return apiFetch(`/threads/${threadId}/comments`);
      }
      const { data, error } = await supabase
        .from("thread_comments")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!threadId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// ============================================================================
// GROUPS
// ============================================================================

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => listGroups(),
    staleTime: 3 * 60 * 1000,
  });
}

// ============================================================================
// MENSAJES / CONVERSATIONS
// ============================================================================

export function useConversations(userId: string | null) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      if (isLocalBackend()) {
        return apiFetch("/conversations");
      }
      // @ts-ignore - conversations table not in generated types
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("Conversation ID required");
      if (isLocalBackend()) {
        return apiFetch(`/conversations/${conversationId}/messages`);
      }
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 segundos (mensajería es tiempo real)
    refetchInterval: 5000, // Polling cada 5s (más conservador que 1.5s)
  });
}

// ============================================================================
// GALERÍA / ALBUMS
// ============================================================================

export function useAlbums() {
  return useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      if (isLocalBackend()) {
        return apiFetch("/albums");
      }
      const { data, error } = await supabase
        // @ts-ignore - albums table not in generated types
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false});
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlbumImages(albumId: string | null) {
  return useQuery({
    queryKey: ["album-images", albumId],
    queryFn: async () => {
      if (!albumId) throw new Error("Album ID required");
      if (isLocalBackend()) {
        return apiFetch(`/albums/${albumId}/images`);
      }
      // @ts-ignore - gallery_images table not in generated types
      const { data, error } = await supabase
        // @ts-ignore
        .from("gallery_images")
        .select("*")
        .eq("album_id", albumId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!albumId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS (operaciones que modifican datos)
// ============================================================================

export function useFollowMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      action,
      targetUserId,
      currentUserId,
    }: {
      action: "follow" | "unfollow";
      targetUserId: string;
      currentUserId: string;
    }) => {
      if (isLocalBackend()) {
        if (action === "follow") {
          return apiFetch("/follows", {
            method: "POST",
            body: JSON.stringify({ followed_id: targetUserId }),
          });
        } else {
          return apiFetch(`/follows/${targetUserId}`, { method: "DELETE" });
        }
      }

      if (action === "follow") {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          followed_id: targetUserId,
          status: "accepted",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", targetUserId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar caché de follows para refrescar
      queryClient.invalidateQueries({ queryKey: ["follows", variables.currentUserId] });
      toast({
        title: variables.action === "follow" ? "Siguiendo" : "Dejaste de seguir",
        description: "Cambio realizado con éxito",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      if (isLocalBackend()) {
        return apiFetch(`/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
      }

      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userData.user?.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caché de mensajes para refrescar
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
