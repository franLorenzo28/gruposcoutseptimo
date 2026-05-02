import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/providers/AppProviders";
import { useToast } from "@/hooks/use-toast";
import { listAlbums, listImages } from "@/lib/gallery";
import { querySilent } from "@/lib/supabase-logger";
import { getPendingRequestsForMe } from "@/lib/follows";

// Module-level state survives StrictMode remounts AND HMR
const _subscribedUsers = new Set<string>();

// Cleanup channels before HMR replaces the module
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    supabase.getChannels().forEach((ch) => {
      void supabase.removeChannel(ch);
    });
    _subscribedUsers.clear();
  });
}

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
    | "gallery_upload"
    | "new_follower"
    | "rama_broadcast";
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [oldestPersistedTimestamp, setOldestPersistedTimestamp] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const knownGalleryPathsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const effectiveUserId = user?.id || null;
  const notificationPreferences = useMemo(() => {
    const defaults = {
      nuevos_mensajes: true,
      nuevos_seguidores: true,
      comentarios_fotos: true,
      eventos_proximamente: true,
      notificaciones_rama: true,
      resumen_semanal: false,
      email_notificaciones: true,
      push_notificaciones: true,
    };

    const raw = (user as any)?.notification_preferences;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return defaults;
    }

    const parsed = raw as Record<string, unknown>;
    return {
      nuevos_mensajes:
        typeof parsed.nuevos_mensajes === "boolean"
          ? parsed.nuevos_mensajes
          : defaults.nuevos_mensajes,
      nuevos_seguidores:
        typeof parsed.nuevos_seguidores === "boolean"
          ? parsed.nuevos_seguidores
          : defaults.nuevos_seguidores,
      comentarios_fotos:
        typeof parsed.comentarios_fotos === "boolean"
          ? parsed.comentarios_fotos
          : defaults.comentarios_fotos,
      eventos_proximamente:
        typeof parsed.eventos_proximamente === "boolean"
          ? parsed.eventos_proximamente
          : defaults.eventos_proximamente,
      notificaciones_rama:
        typeof parsed.notificaciones_rama === "boolean"
          ? parsed.notificaciones_rama
          : defaults.notificaciones_rama,
      resumen_semanal:
        typeof parsed.resumen_semanal === "boolean"
          ? parsed.resumen_semanal
          : defaults.resumen_semanal,
      email_notificaciones:
        typeof parsed.email_notificaciones === "boolean"
          ? parsed.email_notificaciones
          : defaults.email_notificaciones,
      push_notificaciones:
        typeof parsed.push_notificaciones === "boolean"
          ? parsed.push_notificaciones
          : defaults.push_notificaciones,
    };
  }, [user]);

  const isNotificationEnabled = useCallback(
    (type: AppNotification["type"]) => {
      if (type === "message") return notificationPreferences.nuevos_mensajes;
      if (type === "follow_request" || type === "follow_accepted") {
        return notificationPreferences.nuevos_seguidores;
      }
      if (type === "gallery_upload") return notificationPreferences.comentarios_fotos;
      if (type === "rama_broadcast") return notificationPreferences.notificaciones_rama;
      return true;
    },
    [notificationPreferences],
  );

  const notifyViaPush = useCallback(
    (title: string, description?: string) => {
      if (!notificationPreferences.push_notificaciones) return;

      toast({
        title,
        ...(description ? { description } : {}),
      });

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          void new Notification(title, {
            body: description,
            icon: "/site.webmanifest",
          });
        } catch {
          // Ignorar si el navegador bloquea la API en este contexto.
        }
      }
    },
    [notificationPreferences.push_notificaciones, toast],
  );

  const normalizePersistentNotification = useCallback((r: any): AppNotification => {
    const kind = r?.data?.kind;
    let mappedType = r.type;

    if (r.type === "message" && kind) {
      if (kind === "rama_broadcast") mappedType = "rama_broadcast";
      else if (kind === "follow_accepted") mappedType = "follow_accepted";
      else if (kind === "thread_new") mappedType = "thread_new";
      else if (kind === "group_invite") mappedType = "group_invite";
      else if (kind === "gallery_upload") mappedType = "gallery_upload";
    }

    return {
      id: r.id,
      type: mappedType as AppNotification["type"],
      created_at: r.created_at,
      read: !!r.read_at,
      data: { ...(r.data || {}), _persistent: true },
    } as AppNotification;
  }, []);

  const addNotification = useCallback((n: AppNotification) => {
    if (!isNotificationEnabled(n.type)) return;
    setNotifications(prev => {
      if (prev.some((x) => x.id === n.id)) return prev;
      return [n, ...prev].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    });
  }, [isNotificationEnabled]);

  const markAllRead = useCallback(async () => {
    if (!effectiveUserId) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const persistentIds = unread.filter((n: any) => n?.data?._persistent).map(n => n.id);
    if (persistentIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", persistentIds);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [effectiveUserId, notifications]);

  const markRead = useCallback(async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    if (!target.read && (target as any)?.data?._persistent) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [notifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const syncPendingFollowRequests = useCallback(async (_currentUserId: string) => {
    if (!isNotificationEnabled("follow_request")) return;
    const pendingResult = await getPendingRequestsForMe();
    if (pendingResult.error) return;

    const pendingRows =
      (pendingResult.data as Array<{
        follower_id: string;
        created_at: string;
        follower?: {
          user_id: string;
          nombre_completo: string | null;
          username?: string | null;
          avatar_url?: string | null;
        } | null;
      }> | null) || [];

    const pendingFollows = pendingRows.map((row) => ({
      follower_id: row.follower_id,
      created_at: row.created_at,
    }));
    if (pendingFollows.length === 0) return;

    const profiles = pendingRows
      .map((row) => row.follower)
      .filter(
        (
          prof,
        ): prof is {
          user_id: string;
          nombre_completo: string | null;
          username?: string | null;
          avatar_url?: string | null;
        } => !!prof,
      )
      .map((prof) => ({
        user_id: prof.user_id,
        nombre_completo: prof.nombre_completo,
        username: prof.username ?? null,
        avatar_url: prof.avatar_url ?? null,
      }));

    setNotifications((prev) => {
      const map = new Map(prev.map((n) => [n.id, n] as const));

      for (const f of pendingFollows) {
        const alreadyExists = Array.from(map.values()).some((n) => {
          if (n.type !== "follow_request") return false;
          return (n.data as any)?.follower_id === f.follower_id;
        });
        if (alreadyExists) continue;

        const prof = profiles.find((p) => p.user_id === f.follower_id);
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
  }, [isNotificationEnabled]);

  // Realtime subscriptions - module-level guard survives StrictMode + HMR
  useEffect(() => {
    if (!user) return;

    // Check Supabase client first (survives HMR + StrictMode)
    const existing = supabase.getChannels().find(
      (ch: any) => ch.topic.includes(user.id)
    );
    if (existing) return; // Channel already exists, don't add handlers again

    // Guard: module-level Set survives StrictMode remounts
    if (_subscribedUsers.has(user.id)) return;
    _subscribedUsers.add(user.id);

    const channel = supabase.channel(`septimo-notifs-v2-${user.id}`);

    // Realtime listeners (simplificado por DB triggers)
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
      (payload: any) => {
        const row = payload.new;
        const notif: AppNotification = { id: row.id, type: normalizePersistentNotification(row).type, created_at: row.created_at, read: false, data: { ...(row.data || {}), _persistent: true } };
        if (!isNotificationEnabled(notif.type)) return;
        addNotification(notif);
        
        const d = notif.data;
        const kind = d.kind || notif.type;
        const actor = d.display || (d.username ? `@${d.username}` : "Alguien");
        
        if (kind === "follow_request") {
          notifyViaPush("Nueva solicitud", `${actor} quiere seguirte`);
        } else if (kind === "follow_accepted" || kind === "new_follower") {
          notifyViaPush("Nuevo seguidor", `${actor} ahora te sigue`);
        } else if (notif.type === "message") {
          notifyViaPush("Nuevo mensaje", `${actor}: ${(d.content || "").slice(0, 70)}`);
        } else if (notif.type === "rama_broadcast") {
          notifyViaPush(`Difusión ${d.rama || ""}`, `${(d.content || "").slice(0, 70)}`);
        } else if (notif.type === "gallery_upload") {
          notifyViaPush(
            "Nuevas fotos en galería",
            d.count && d.count > 1
              ? `${d.count} fotos nuevas en ${d.album || "Galería"}`
              : `Nueva foto en ${d.album || "Galería"}`,
          );
        } else if (notif.type === "thread_comment") {
          notifyViaPush("Nuevo comentario en tu hilo", (d.content || "").slice(0, 80));
        } else if (notif.type === "mention") {
          notifyViaPush("Te mencionaron", `${actor} ${(d.content || "").slice(0, 70)}`.trim());
        }
      }
    );

    channel.subscribe();
  }, [user, addNotification, notifyViaPush, isNotificationEnabled, normalizePersistentNotification]);

  // Notificación de nuevas fotos en galería (sondeo liviano)
  useEffect(() => {
    if (!user) return;
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
          if (!isNotificationEnabled("gallery_upload")) {
            if (!cancelled) knownGalleryPathsRef.current = current;
            return;
          }
          const first = newPaths[0] ?? "";
          const albumName = first.split("/")[0] || "Galería";
          const notif: AppNotification = {
            id: `gallery-new-${albumName}-${Date.now()}`,
            type: "gallery_upload",
            created_at: new Date().toISOString(),
            read: false,
            data: { album: albumName, count: newPaths.length },
          };
          addNotification(notif);
          notifyViaPush(
            "Nuevas fotos en galería",
            newPaths.length === 1
              ? `Se subió una foto nueva en ${albumName}`
              : `Se subieron ${newPaths.length} fotos nuevas en ${albumName}`,
          );

          for (const newPath of newPaths) {
            void (supabase as any).from("gallery_upload_events").insert({
              uploader_id: user.id,
              album_name: albumName,
              image_path: newPath,
            });
          }
        }

        if (!cancelled) knownGalleryPathsRef.current = current;
      } catch {
        // Silencioso
      }
    };

    scanGallery(false);
    const timer = setInterval(() => scanGallery(true), 120000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user, addNotification, notifyViaPush, isNotificationEnabled]);

  // Cargar notificaciones persistentes iniciales + follow requests
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await querySilent(() => supabase
          .from("notifications")
          .select("id, type, created_at, read_at, data")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
        );
        if (!error && data && !cancelled) {
          setNotifications(prev => {
            const map = new Map(prev.map(n => [n.id, n] as const));
            for (const r of data as any[]) {
              const normalized = normalizePersistentNotification(r);
              if (!isNotificationEnabled(normalized.type)) continue;
              map.set(r.id, normalized);
            }
            return Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
          });
          if (data.length === 50) {
            setHasMore(true);
            const oldest = data[data.length - 1];
            if (oldest) setOldestPersistedTimestamp(oldest.created_at);
          } else {
            setHasMore(false);
          }
        }

        await syncPendingFollowRequests(user.id);
      } catch (e) {
        console.warn("Failed to load persistent notifications:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user, normalizePersistentNotification, syncPendingFollowRequests, isNotificationEnabled]);

  useEffect(() => {
    if (!user) return;

    void syncPendingFollowRequests(user.id);
  }, [user, syncPendingFollowRequests]);

  const loadMore = useCallback(async () => {
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
            const normalized = normalizePersistentNotification(r);
            if (!isNotificationEnabled(normalized.type)) continue;
            map.set(r.id, normalized);
          }
          return Array.from(map.values()).sort((a,b) => (a.created_at < b.created_at ? 1 : -1));
        });
        if (data.length === 50) {
          const oldest = data[data.length - 1];
          if (oldest) setOldestPersistedTimestamp(oldest.created_at);
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
  }, [user, hasMore, loadingMore, oldestPersistedTimestamp, normalizePersistentNotification, isNotificationEnabled]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, removeNotification, loadMore, hasMore, loadingMore }}>
      {children}
    </NotificationsContext.Provider>
  );
};
