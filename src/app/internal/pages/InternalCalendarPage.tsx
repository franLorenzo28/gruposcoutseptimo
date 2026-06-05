import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { AdminEvents } from "@/components/miembros/AdminEvents";
import { useMemberAuth } from "@/context/MemberAuthContext";
import {
  getUpcomingRamaEvents,
  ramaConfig,
  readRamaEvents,
  sortRamaEvents,
  writeRamaEvents,
  type RamaPanelEvent,
} from "@/app/internal/rama-storage";
import type { MiembroRama } from "@/lib/member-auth";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

export default function InternalCalendarPage() {
  const { session } = useMemberAuth();
  const initialRama = session?.rama ?? "lobatos";
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : [initialRama];
  const [activeRama, setActiveRama] = useState<MiembroRama>(initialRama);
  const [eventos, setEventos] = useState<RamaPanelEvent[]>([]);

  useEffect(() => {
    setEventos(readRamaEvents(activeRama));
  }, [activeRama]);

  const sortedEvents = useMemo(() => sortRamaEvents(eventos), [eventos]);
  const upcomingEvents = useMemo(() => getUpcomingRamaEvents(eventos), [eventos]);
  const canAdminActiveRama = !!session?.isRamaAdmin && allowedRamas.includes(activeRama);

  if (!session) return null;

  const syncEvents = (nextEvents: RamaPanelEvent[]) => {
    setEventos(nextEvents);
    writeRamaEvents(activeRama, nextEvents);
  };

  const handleAddEvent = (eventData: Omit<RamaPanelEvent, "id">) => {
    syncEvents([
      ...eventos,
      {
        id: Date.now().toString(),
        ...eventData,
      },
    ]);
  };

  const handleUpdateEvent = (eventId: string, eventData: Omit<RamaPanelEvent, "id">) => {
    syncEvents(eventos.map((event) => (event.id === eventId ? { ...event, ...eventData } : event)));
  };

  const handleDeleteEvent = (eventId: string) => {
    syncEvents(eventos.filter((event) => event.id !== eventId));
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Agenda interna"
        title="Calendario operativo"
        description="Sigue el ritmo de la unidad, revisa próximos encuentros y, si tienes permiso, gestiona la agenda desde el mismo módulo."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full bg-background/80">
              Rama activa: {ramaConfig[activeRama].titulo}
            </Badge>
            <Badge variant="outline" className="rounded-full bg-background/80">
              Próximos: {upcomingEvents.length}
            </Badge>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {allowedRamas.map((rama) => (
          <Button
            key={rama}
            type="button"
            variant={activeRama === rama ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setActiveRama(rama)}
          >
            {ramaConfig[rama].titulo}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Vista rápida</h2>
            </div>
            {sortedEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                No hay eventos cargados para esta unidad.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{event.titulo}</p>
                        <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {event.fecha} {event.hora ? `- ${event.hora}` : ""}
                        </p>
                        {event.lugar ? (
                          <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.lugar}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={upcomingEvents.some((item) => item.id === event.id) ? "default" : "secondary"}>
                        {upcomingEvents.some((item) => item.id === event.id) ? "Próximo" : "Histórico"}
                      </Badge>
                    </div>
                    {event.descripcion ? (
                      <p className="mt-3 text-sm text-muted-foreground">{event.descripcion}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {canAdminActiveRama ? (
          <AdminEvents
            ramaName={ramaConfig[activeRama].titulo}
            eventos={eventos}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        ) : (
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-bold">Permisos de edición</h2>
              <p className="text-sm text-muted-foreground">
                Tu perfil actual tiene acceso de lectura para la agenda de {ramaConfig[activeRama].titulo}. Si necesitas editar eventos, esa acción queda reservada al equipo educativo habilitado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
