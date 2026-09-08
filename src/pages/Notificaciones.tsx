import { useMemo, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import UserAvatar from "@/components/UserAvatar";
import { renderNotificationContent } from "@/components/layout/NotificationsPanel";
import { useNotifications } from "@/context/Notifications";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  follow_request: "Solicitud de seguimiento",
  follow_accepted: "Nuevo seguidor",
  new_follower: "Nuevo seguidor",
  message: "Mensaje",
  mention: "Mención",
  group_invite: "Invitación a grupo",
  gallery_upload: "Galería",
  rama_broadcast: "Difusión",
};

function formatAbsoluteDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notificaciones() {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    removeNotification,
    loadMore,
    hasMore,
    loadingMore,
    resolvedActions,
    resolveFollowRequest,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter],
  );

  const handleResolve = async (id: string, accept: boolean) => {
    if (resolving[id]) return;
    setResolving((prev) => ({ ...prev, [id]: true }));
    try {
      await resolveFollowRequest(id, accept);
    } finally {
      setResolving((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <InternalPageHeader
        eyebrow="Actividad"
        title="Historial de notificaciones"
        description="Todas tus notificaciones con su fecha. Las solicitudes de seguimiento se aceptan o rechazan desde acá."
        meta={
          <div className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-semibold">{unreadCount}</span>
            <span className="text-muted-foreground">sin leer</span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          No leídas ({unreadCount})
        </Button>
        <div className="ml-auto">
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              Marcar todo como leído
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {filter === "unread" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => {
            const isFollowRequest = n.type === "follow_request";
            const resolution = resolvedActions[n.id];
            const busy = !!resolving[n.id];
            return (
              <li key={n.id}>
                <Card className={cn(!n.read && "border-primary/30 bg-primary/[0.03]")}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <UserAvatar
                      avatarUrl={(n.data as any)?.avatar_url || null}
                      userName={(n.data as any)?.display || "Scout"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[n.type] || "Notificación"}
                        </Badge>
                        {!n.read && (
                          <Badge className="text-[10px]">Nueva</Badge>
                        )}
                        {isFollowRequest && resolution && (
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              resolution === "accepted" ? "text-green-600" : "text-destructive",
                            )}
                          >
                            {resolution === "accepted" ? "Aceptada" : "Rechazada"}
                          </span>
                        )}
                      </div>
                      {renderNotificationContent(n)}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatAbsoluteDate(n.created_at)}
                      </p>
                      {isFollowRequest && !resolution && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => handleResolve(n.id, true)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => handleResolve(n.id, false)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!n.read && !(isFollowRequest && !resolution) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Marcar como leído"
                          title="Marcar como leído"
                          onClick={() => markRead(n.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="Eliminar notificación"
                        title="Eliminar notificación"
                        onClick={() => removeNotification(n.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <Button variant="outline" className="w-full" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Cargando..." : "Cargar anteriores"}
        </Button>
      )}
    </div>
  );
}
