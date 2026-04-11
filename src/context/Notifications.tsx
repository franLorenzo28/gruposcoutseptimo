import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { listAlbums, listImages } from "@/lib/gallery";
import { apiFetch, getAuthUser, isLocalBackend } from "@/lib/backend";

export type AppNotification = {
  id: string;
  type:
    | "message"
    | "follow_request"
    | "follow_accepted"
    | "thread_comment"
    | "thread_new"
    | "mention"
    | "group_invite"
    | "gallery_upload";
  created_at: string;
  read: boolean;
  data: Record<string, any>;
};

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  removeNotification: (id: string) => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  return ctx;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseUser();
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [oldestPersistedTimestamp, setOldestPersistedTimestamp] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const knownGalleryPathsRef = useRef<Set<string>>(new Set());
  const persistedKeysRef = useRef<Set<string>>(new Set());
  const localInitializedRef = useRef(false);
  const localSeenIdsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const isLocal = isLocalBackend();
  const effectiveUserId = isLocal ? localUserId : user?.id || null;

  useEffect(() => {
    if (!isLocal) return;
    let mounted = true;
    (async () => {
      const auth = await getAuthUser();
      if (!mounted) return;
      setLocalUserId(auth?.id || null);
    })();
    return () => {
      mounted = false;
    };
  }, [isLocal]);

  const normalizePersistentNotification = useCallback((r: any): AppNotification => {
    const kind = r?.data?.kind;
    const mappedType =
      r.type === "message" &&
      (kind === "follow_accepted" || kind === "thread_new" || kind === "group_invite" || kind === "gallery_upload")
        ? kind
        : r.type;
    return {
      id: r.id,
      type: mappedType,
      created_at: r.created_at,
      read: !!r.read_at,
      data: { ...(r.data || {}), _persistent: true },
    } as AppNotification;
  }, []);

  const persistNotification = useCallback(
    async (args: {
      persistKey: string;
      recipientId: string;
      actorId: string;
      type: AppNotification["type"];
      entityType?: string;
      entityId?: string;
      data?: Record<string, any>;
      createdAt?: string;
    }) => {
      if (!effectiveUserId) return;
      if (persistedKeysRef.current.has(args.persistKey)) return;
      persistedKeysRef.current.add(args.persistKey);

      const allowedTypes = new Set(["thread_comment", "mention", "message", "follow_request"]);
      const effectiveType = allowedTypes.has(args.type) ? args.type : "message";
      const payloadData =
        effectiveType === "message" && args.type !== "message"
          ? { ...(args.data || {}), kind: args.type }
          : args.data || {};

      try {
        if (isLocal) {
          await apiFetch("/notifications", {
            method: "POST",
            body: JSON.stringify({
              recipientId: args.recipientId,
              actorId: args.actorId,
              type: effectiveType,
              entityType: args.entityType,
              entityId: args.entityId,
              data: payloadData,
              createdAt: args.createdAt || new Date().toISOString(),
            }),
          });
          return;
        }

        await supabase.from("notifications").insert({
          recipient_id: args.recipientId,
          actor_id: args.actorId,
          type: effectiveType as any,
          entity_type: args.entityType || null,
          entity_id: args.entityId || null,
          data: payloadData as any,
          created_at: args.createdAt || new Date().toISOString(),
        } as any);
      } catch {
        // Silencioso: no cortar UX si falla persistencia.
      }
    },
    [effectiveUserId, isLocal],
  );

  const addNotification = useCallback((n: AppNotification) => {
    setNotifications(prev => {
      if (prev.some((x) => x.id === n.id)) return prev;
      return [n, ...prev].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    });
  }, []);

  const markAllRead = useCallback(async () => {
    if (!effectiveUserId) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    if (isLocal) {
      await apiFetch("/notifications/mark-all-read", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return;
    }
    const persistentIds = unread.filter((n: any) => n?.data?._persistent).map(n => n.id);
    if (persistentIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", persistentIds);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [effectiveUserId, notifications, isLocal]);

  const markRead = useCallback(async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    if (isLocal) {
      if (!target.read) {
        await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    if (!target.read && (target as any)?.data?._persistent) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [notifications, isLocal]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!isLocal || !effectiveUserId) return;
    let cancelled = false;

    const fetchLocalNotifications = async () => {
      try {
        const rows = (await apiFetch("/notifications?limit=50&offset=0")) as Array<{
          id: string;
          type: AppNotification["type"];
          created_at: string;
          read_at?: string | null;
          data?: Record<string, unknown>;
        }>;

        const mapped = (rows || []).map((r) => ({
          id: r.id,
          type: r.type,
          created_at: r.created_at,
          read: !!r.read_at,
          data: { ...(r.data || {}), _persistent: true },
        })) as AppNotification[];

        const pendingFollows = (await apiFetch("/follows/pending")) as Array<{
          follower_id: string;
          created_at: string;
        }>;

        let pendingProfiles: Array<{
          user_id: string;
          nombre_completo?: string;
          username?: string;
          avatar_url?: string;
        }> = [];

        if (pendingFollows.length > 0) {
          pendingProfiles = (await apiFetch("/profiles/batch", {
            method: "POST",
            body: JSON.stringify({ ids: pendingFollows.map((f) => f.follower_id) }),
          })) as Array<{
            user_id: string;
            nombre_completo?: string;
            username?: string;
            avatar_url?: string;
          }>;
        }

        const mergedMap = new Map(mapped.map((n) => [n.id, n] as const));
        for (const f of pendingFollows) {
          const alreadyExists = Array.from(mergedMap.values()).some((n) => {
            if (n.type !== "follow_request") return false;
            return (n.data as any)?.follower_id === f.follower_id;
          });
          if (alreadyExists) continue;

          const prof = pendingProfiles.find((p) => p.user_id === f.follower_id);
          const display =
            prof?.nombre_completo || prof?.username || f.follower_id.slice(0, 8);

          mergedMap.set(`follow-pending-local-${f.follower_id}-${f.created_at}`, {
            id: `follow-pending-local-${f.follower_id}-${f.created_at}`,
            type: "follow_request",
            created_at: f.created_at,
            read: false,
            data: {
              follower_id: f.follower_id,
              display,
              username: prof?.username || null,
              avatar_url: prof?.avatar_url || null,
              _fallback_from_follows: true,
            },
          });
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1,
        );

        if (!localInitializedRef.current) {
          merged.forEach((n) => localSeenIdsRef.current.add(n.id));
          localInitializedRef.current = true;
        } else {
          merged.forEach((n) => {
            if (!localSeenIdsRef.current.has(n.id)) {
              localSeenIdsRef.current.add(n.id);
              if (n.type === "follow_request") {
                const display = (n.data as any)?.display || "Alguien";
                toast({
                  title: "Nueva solicitud de seguimiento",
                  description: `${display} quiere seguirte`,
                });
              }
            }
          });
        }

        if (!cancelled) {
          setNotifications(merged);
          setHasMore(false);
        }
      } catch {
        // Silencioso en local polling
      }
    };

    void fetchLocalNotifications();
    const timer = setInterval(() => {
      void fetchLocalNotifications();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isLocal, effectiveUserId, toast]);

  // Suscripción a solicitudes de seguimiento nuevas
  useEffect(() => {
    if (!user || isLocal) return;
    const channelFollowsToMe = supabase
      .channel(`follows:pending:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows", filter: `followed_id=eq.${user.id}` },
        async payload => {
          const row: any = payload.new;
          if (row.status === "pending") {
            // Obtener perfil del seguidor
            const { data: prof } = await supabase
              .from("profiles")
              .select("nombre_completo, username, avatar_url")
              .eq("user_id", row.follower_id)
              .maybeSingle();
            const display = prof?.nombre_completo || prof?.username || row.follower_id.slice(0, 8);
            const notif: AppNotification = {
              id: `follow-${row.follower_id}-${row.created_at}`,
              type: "follow_request",
              created_at: row.created_at || new Date().toISOString(),
              read: false,
              data: {
                follower_id: row.follower_id,
                display,
                username: prof?.username || null,
                avatar_url: prof?.avatar_url || null,
              }
            };
            addNotification(notif);
            toast({ title: "Nueva solicitud de seguimiento", description: `${display} quiere seguirte` });
            await persistNotification({
              persistKey: `follow-pending-${row.follower_id}-${row.created_at}`,
              recipientId: user.id,
              actorId: row.follower_id,
              type: "follow_request",
              entityType: "follow",
              entityId: `${row.follower_id}:${user.id}`,
              data: notif.data,
              createdAt: notif.created_at,
            });
            return;
          }

          if (row.status === "accepted") {
            const { data: prof } = await supabase
              .from("profiles")
              .select("nombre_completo, username, avatar_url")
              .eq("user_id", row.follower_id)
              .maybeSingle();
            const display = prof?.nombre_completo || prof?.username || row.follower_id.slice(0, 8);
            const notif: AppNotification = {
              id: `follow-accepted-${row.follower_id}-${row.created_at}`,
              type: "follow_accepted",
              created_at: row.created_at || new Date().toISOString(),
              read: false,
              data: {
                follower_id: row.follower_id,
                display,
                username: prof?.username || null,
                avatar_url: prof?.avatar_url || null,
              }
            };
            addNotification(notif);
            toast({ title: "Nuevo seguidor", description: `${display} ahora te sigue` });
            await persistNotification({
              persistKey: `follow-accepted-${row.follower_id}-${row.created_at}`,
              recipientId: user.id,
              actorId: row.follower_id,
              type: "follow_accepted",
              entityType: "follow",
              entityId: `${row.follower_id}:${user.id}`,
              data: notif.data,
              createdAt: notif.created_at,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "follows", filter: `followed_id=eq.${user.id}` },
        async payload => {
          const row: any = payload.new;
          const oldRow: any = payload.old;
          if (!oldRow || oldRow.status === row.status) return;
          if (row.status !== "accepted") return;

          const { data: prof } = await supabase
            .from("profiles")
            .select("nombre_completo, username, avatar_url")
            .eq("user_id", row.follower_id)
            .maybeSingle();
          const display = prof?.nombre_completo || prof?.username || row.follower_id.slice(0, 8);
          const notif: AppNotification = {
            id: `follow-accepted-update-${row.follower_id}-${row.created_at}`,
            type: "follow_accepted",
            created_at: new Date().toISOString(),
            read: false,
            data: {
              follower_id: row.follower_id,
              display,
              username: prof?.username || null,
              avatar_url: prof?.avatar_url || null,
            }
          };
          addNotification(notif);
          toast({ title: "Nuevo seguidor", description: `${display} ahora te sigue` });
          await persistNotification({
            persistKey: `follow-accepted-update-${row.follower_id}-${row.created_at}`,
            recipientId: user.id,
            actorId: row.follower_id,
            type: "follow_accepted",
            entityType: "follow",
            entityId: `${row.follower_id}:${user.id}`,
            data: notif.data,
            createdAt: notif.created_at,
          });
        }
      )
      .subscribe();

    const channelThreads = supabase
      .channel(`threads:new:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threads" },
        async (payload) => {
          const row: any = payload.new;
          if (!row || row.author_id === user.id) return;

          const { data: prof } = await supabase
            .from("profiles")
            .select("nombre_completo, username, avatar_url")
            .eq("user_id", row.author_id)
            .maybeSingle();
          const display = prof?.nombre_completo || prof?.username || "Scout";

          const notif: AppNotification = {
            id: `thread-new-${row.id}`,
            type: "thread_new",
            created_at: row.created_at || new Date().toISOString(),
            read: false,
            data: {
              thread_id: row.id,
              author_id: row.author_id,
              display,
              avatar_url: prof?.avatar_url || null,
              content: row.content || "",
            },
          };
          addNotification(notif);
          toast({ title: "Nuevo hilo", description: `${display} publicó un hilo` });
          await persistNotification({
            persistKey: `thread-new-${row.id}-${user.id}`,
            recipientId: user.id,
            actorId: row.author_id,
            type: "thread_new",
            entityType: "thread",
            entityId: row.id,
            data: notif.data,
            createdAt: notif.created_at,
          });
        }
      )
      .subscribe();

    const channelGroupInvites = supabase
      .channel(`groups:member:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_members", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const row: any = payload.new;
          if (!row?.group_id) return;

          const { data: group } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", row.group_id)
            .maybeSingle();

          const notif: AppNotification = {
            id: `group-member-${row.group_id}-${row.joined_at || row.user_id}`,
            type: "group_invite",
            created_at: row.joined_at || new Date().toISOString(),
            read: false,
            data: {
              group_id: row.group_id,
              group_name: group?.name || "Grupo",
              role: row.role,
            },
          };
          addNotification(notif);
          toast({ title: "Nuevo grupo", description: `Ahora formas parte de ${group?.name || "un grupo"}` });
          await persistNotification({
            persistKey: `group-invite-${row.group_id}-${row.user_id}-${row.joined_at || ""}`,
            recipientId: user.id,
            actorId: row.user_id,
            type: "group_invite",
            entityType: "group",
            entityId: row.group_id,
            data: notif.data,
            createdAt: notif.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelFollowsToMe);
      supabase.removeChannel(channelThreads);
      supabase.removeChannel(channelGroupInvites);
    };
  }, [user, addNotification, toast, persistNotification, isLocal]);

  // Notificación de nuevas fotos en galería (sondeo liviano)
  useEffect(() => {
    if (!user || isLocal) return;
    let cancelled = false;

    const scanGallery = async (notify = false) => {
      try {
        const albums = await listAlbums();
        if (!albums.length) return;

        const current = new Set<string>();
        for (const album of albums.slice(0, 12)) {
          const imgs = await listImages(album.name).catch(() => []);
          imgs.forEach((img) => current.add(img.path));
        }

        if (!notify) {
          if (!cancelled) knownGalleryPathsRef.current = current;
          return;
        }

        const newPaths = Array.from(current).filter((p) => !knownGalleryPathsRef.current.has(p));
        if (newPaths.length > 0) {
          const first = newPaths[0];
          const albumName = first.split("/")[0] || "Galería";
          const notif: AppNotification = {
            id: `gallery-new-${albumName}-${Date.now()}`,
            type: "gallery_upload",
            created_at: new Date().toISOString(),
            read: false,
            data: {
              album: albumName,
              count: newPaths.length,
            },
          };
          addNotification(notif);
          toast({
            title: "Nuevas fotos en galería",
            description:
              newPaths.length === 1
                ? `Se subió una foto nueva en ${albumName}`
                : `Se subieron ${newPaths.length} fotos nuevas en ${albumName}`,
          });
          await persistNotification({
            persistKey: `gallery-upload-${albumName}-${newPaths.length}-${Math.floor(Date.now() / 120000)}`,
            recipientId: user.id,
            actorId: user.id,
            type: "gallery_upload",
            entityType: "gallery",
            entityId: albumName,
            data: notif.data,
            createdAt: notif.created_at,
          });
        }

        if (!cancelled) knownGalleryPathsRef.current = current;
      } catch {
        // Silencioso: no interrumpir UX si falla el sondeo
      }
    };

    scanGallery(false);
    const timer = setInterval(() => scanGallery(true), 120000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user, addNotification, toast, persistNotification, isLocal]);

  // Suscripción a mensajes nuevos en cualquier conversación del usuario
  useEffect(() => {
    if (!user || isLocal) return;
    // Suscribirse a todos los mensajes: filtrar en el handler
    const channelMessages = supabase
      .channel(`messages:any:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        payload => {
          const row: any = payload.new;
          if (row.sender_id === user.id) return; // ignorar propios
          // Crear notificación optimista sin validar conversación
          const notif: AppNotification = {
            id: `msg-${row.id}`,
            type: "message",
            created_at: row.created_at || new Date().toISOString(),
            read: false,
            data: { conversation_id: row.conversation_id, sender_id: row.sender_id, content: row.content }
          };
          addNotification(notif);
          toast({ title: "Nuevo mensaje", description: row.content?.slice(0, 80) || "Mensaje recibido" });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channelMessages); };
  }, [user, addNotification, toast, isLocal]);

  // Cargar notificaciones persistentes (thread_comment, mention) y suscribirse a nuevas
  useEffect(() => {
    if (!user || isLocal) return;
    let channel: any;
    (async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, created_at, read_at, data")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setNotifications(prev => {
          // Mantener existentes (mensajes, follows en memoria) y combinar con persistentes evitando duplicados por id
          const map = new Map(prev.map(n => [n.id, n] as const));
          for (const r of data as any[]) {
            map.set(r.id, {
              id: r.id,
              type: r.type,
              created_at: r.created_at,
              read: !!r.read_at,
              data: r.data || {}
            });
          }
          return Array.from(map.values()).sort((a,b) => (a.created_at < b.created_at ? 1 : -1));
        });
        if (data.length === 50) {
          setHasMore(true);
          const oldest = data[data.length - 1];
          setOldestPersistedTimestamp(oldest.created_at);
        } else {
          setHasMore(false);
        }
      }

      // Fallback: si hay solicitudes pendientes en follows sin registro en notifications,
      // mostrarlas igual en la campanita para no perder señal cuando el usuario no estaba online.
      const { data: pendingFollows } = await supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("followed_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50)
        .catch(() => ({ data: null }));

      if (pendingFollows && pendingFollows.length > 0) {
        const followerIds = pendingFollows.map((f) => f.follower_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nombre_completo, username, avatar_url")
          .in("user_id", followerIds)
          .catch(() => ({ data: null }));

        setNotifications((prev) => {
          const map = new Map(prev.map((n) => [n.id, n] as const));

          for (const f of pendingFollows) {
            const alreadyExists = Array.from(map.values()).some((n) => {
              if (n.type !== "follow_request") return false;
              return (n.data as any)?.follower_id === f.follower_id;
            });
            if (alreadyExists) continue;

            const prof = profiles?.find((p) => p.user_id === f.follower_id);
            const display = prof?.nombre_completo || prof?.username || f.follower_id.slice(0, 8);

            map.set(`follow-pending-${f.follower_id}-${f.created_at}`, {
              id: `follow-pending-${f.follower_id}-${f.created_at}`,
              type: "follow_request",
              created_at: f.created_at,
              read: false,
              data: {
                follower_id: f.follower_id,
                display,
                username: prof?.username || null,
                avatar_url: prof?.avatar_url || null,
                _fallback_from_follows: true,
              },
            });
          }

          return Array.from(map.values()).sort((a, b) =>
            a.created_at < b.created_at ? 1 : -1,
          );
        });
      }

      channel = supabase
        .channel(`notifications:ins:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
          (payload) => {
            const row: any = payload.new;
            const notif: AppNotification = {
              id: row.id,
              type: normalizePersistentNotification(row).type,
              created_at: row.created_at,
              read: false,
              data: { ...(row.data || {}), _persistent: true }
            };
            addNotification(notif);
            if (row.type === "thread_comment") {
              toast({ title: "Nuevo comentario en tu hilo", description: (row.data?.content || "").slice(0,80) });
            } else if (row.type === "mention") {
              const uname = row.data?.username ? `@${row.data.username}` : "";
              toast({ title: "Te mencionaron", description: `${uname} ${(row.data?.content || "").slice(0,70)}`.trim() });
            }
          }
        )
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user, addNotification, toast, normalizePersistentNotification, isLocal]);

  const loadMore = useCallback(async () => {
    if (isLocal) return;
    if (!user || !hasMore || loadingMore || !oldestPersistedTimestamp) return;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, created_at, read_at, data')
        .eq('recipient_id', user.id)
        .lt('created_at', oldestPersistedTimestamp)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) {
        setNotifications(prev => {
          const map = new Map(prev.map(n => [n.id, n] as const));
          for (const r of data as any[]) {
            map.set(r.id, normalizePersistentNotification(r));
          }
          return Array.from(map.values()).sort((a,b) => (a.created_at < b.created_at ? 1 : -1));
        });
        if (data.length === 50) {
          const oldest = data[data.length - 1];
          setOldestPersistedTimestamp(oldest.created_at);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } else if (!error && data && data.length === 0) {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [user, hasMore, loadingMore, oldestPersistedTimestamp, normalizePersistentNotification, isLocal]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, removeNotification, loadMore, hasMore, loadingMore }}>
      {children}
    </NotificationsContext.Provider>
  );
};
