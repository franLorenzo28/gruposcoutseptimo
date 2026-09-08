import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Check, Dot, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import type { ReactNode } from "react";

export type FollowRequestResolution = "accepted" | "rejected";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
  onLoadMore: () => void;
  resolvedActions?: Record<string, FollowRequestResolution>;
  onResolveRequest?: (id: string, accept: boolean) => Promise<boolean>;
  children?: ReactNode;
  align?: "center" | "end" | "start";
}

function getNotificationActor(n: Notification): string | null {
  const d = n.data || {};
  return (d.display as string) || (d.username ? `@${d.username}` : null);
}

function getNotificationRelativeTime(createdAt: string): string {
  const now = Date.now();
  const then = new Date(createdAt).getTime();
  const diffSeconds = Math.max(1, Math.floor((now - then) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
}

function renderNotificationContent(n: Notification): ReactNode {
  const d = n.data || {};
  const actor = getNotificationActor(n);
  const kind = String(d.kind || "").toLowerCase();

  if (n.type === "message" && kind === "educator_permission_request") {
    return (
      <div className="space-y-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{String(d.requester_name || actor || "Educador/a")}</span>{" "}
          solicita permisos
        </p>
        {d.note ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{String(d.note)}</p>
        ) : null}
      </div>
    );
  }

  if (n.type === "message" && kind === "user_registration_request") {
    return (
      <div className="space-y-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{String(d.display || actor || "Nuevo usuario")}</span>{" "}
          solicita registro.
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {`${d.email || "sin email"}${d.tipo_relacion ? ` · ${d.tipo_relacion}` : ""}${d.rama ? ` · ${d.rama}` : ""}`}
        </p>
      </div>
    );
  }

  if (n.type === "message" && kind === "educator_permission_response") {
    const approved = !!d.approved;
    return (
      <p className="text-sm leading-snug">
        <span className="font-semibold">
          {approved ? "Permisos aprobados" : "Solicitud rechazada"}
        </span>{" "}
        <span className="text-muted-foreground">
          {approved
            ? `por ${d.reviewer_name || "administración"}.`
            : `por ${d.reviewer_name || "administración"}.`}
        </span>
      </p>
    );
  }

  switch (n.type) {
    case "follow_request":
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actor || "Alguien"}</span> quiere seguirte
        </p>
      );
    case "follow_accepted":
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actor || "Alguien"}</span> ahora te sigue
        </p>
      );
    case "message":
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actor || "Nuevo mensaje"}</span>{" "}
          <span className="text-muted-foreground">{String(d.content || "te envió un mensaje").slice(0, 70)}</span>
        </p>
      );
    case "rama_broadcast":
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">Difusión {String(d.rama || "")}</span>{" "}
          <span className="text-muted-foreground">{String(d.content || "").slice(0, 70)}</span>
        </p>
      );
    default:
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">Notificación</span>{" "}
          <span className="text-muted-foreground">Tienes una notificación nueva</span>
        </p>
      );
  }
}

function NotificationsContent({
  notifications,
  unreadCount,
  hasMore,
  loadingMore,
  onMarkAllRead,
  onMarkRead,
  onRemove,
  onLoadMore,
  resolvedActions = {},
  onResolveRequest,
}: {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
  onLoadMore: () => void;
  resolvedActions?: Record<string, FollowRequestResolution>;
  onResolveRequest?: (id: string, accept: boolean) => Promise<boolean>;
}) {
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const handleResolve = async (id: string, accept: boolean) => {
    if (!onResolveRequest || resolving[id]) return;
    setResolving((prev) => ({ ...prev, [id]: true }));
    try {
      await onResolveRequest(id, accept);
    } finally {
      setResolving((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Notificaciones</span>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onMarkAllRead}>
            Marcar todo como leído
          </Button>
        )}
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No hay notificaciones</li>
        ) : (
          notifications.map((n) => {
            const isFollowRequest = n.type === "follow_request";
            const canResolve = isFollowRequest && !!onResolveRequest;
            const resolution = resolvedActions[n.id];
            const busy = !!resolving[n.id];
            return (
            <li
              key={n.id}
              className={cn(
                "border-b px-4 py-3 transition-colors",
                !n.read ? "bg-primary/5" : "hover:bg-muted/30",
              )}
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  avatarUrl={(n.data as any)?.avatar_url || null}
                  userName={(n.data as any)?.display || "Scout"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  {renderNotificationContent(n)}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>{getNotificationRelativeTime(n.created_at)}</span>
                    {!n.read && <Dot className="h-4 w-4 text-primary" />}
                    {isFollowRequest && resolution && (
                      <span
                        className={cn(
                          "font-medium",
                          resolution === "accepted" ? "text-green-600" : "text-destructive",
                        )}
                      >
                        · {resolution === "accepted" ? "Aceptada" : "Rechazada"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canResolve && !resolution ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-600"
                        aria-label="Aceptar solicitud"
                        title="Aceptar solicitud"
                        disabled={busy}
                        onClick={() => handleResolve(n.id, true)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        aria-label="Rechazar solicitud"
                        title="Rechazar solicitud"
                        disabled={busy}
                        onClick={() => handleResolve(n.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    !n.read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label="Marcar como leído"
                        title="Marcar como leído"
                        onClick={() => onMarkRead(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Eliminar notificación"
                    title="Eliminar notificación"
                    onClick={() => onRemove(n.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
            );
          }))}
      </ul>
      <Button asChild size="sm" variant="ghost" className="w-full rounded-none py-3">
        <Link to="/interno/notificaciones" className="inline-flex items-center gap-2">
          <History className="h-4 w-4" />
          Ver historial
        </Link>
      </Button>
      {hasMore && (
        <Button size="sm" variant="ghost" className="w-full rounded-none py-3" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? "Cargando..." : "Ver más"}
        </Button>
      )}
    </div>
  );
}

export function NotificationsPopover({
  notifications,
  unreadCount,
  hasMore,
  loadingMore,
  onMarkAllRead,
  onMarkRead,
  onRemove,
  onLoadMore,
  resolvedActions,
  onResolveRequest,
  children,
  align = "center",
}: NotificationsPanelProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            aria-label="Abrir notificaciones"
            title="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] leading-none rounded-full px-1.5 py-1">
                {unreadCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,360px)] p-0 max-h-[80vh]" align={align}>
        <NotificationsContent
          notifications={notifications}
          unreadCount={unreadCount}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onMarkAllRead={onMarkAllRead}
          onMarkRead={onMarkRead}
          onRemove={onRemove}
          onLoadMore={onLoadMore}
          resolvedActions={resolvedActions}
          onResolveRequest={onResolveRequest}
        />
      </PopoverContent>
    </Popover>
  );
}

export { renderNotificationContent, getNotificationActor, getNotificationRelativeTime };
