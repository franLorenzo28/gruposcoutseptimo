import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { getUpcomingRamaEvents, ramaConfig, readRamaEvents } from "@/app/internal/rama-storage";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { formatEventDate } from "@/lib/event-dates";
import type { MiembroRama } from "@/lib/member-auth";

export default function InternalPlanningPage() {
  const { session } = useMemberAuth();
  const [activeRama, setActiveRama] = useState<MiembroRama>(session?.rama ?? "lobatos");
  if (!session) return null;

  const allowedRamas = session.allowedRamas?.length ? session.allowedRamas : [session.rama];
  const upcoming = getUpcomingRamaEvents(readRamaEvents(activeRama));

  return <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
    <InternalPageHeader eyebrow="Ciclo de actividades" title="Planificación" description="Consulta los próximos encuentros cargados en la agenda de tu unidad."
      meta={<Badge variant="outline">{ramaConfig[activeRama].titulo}</Badge>} />
    <p className="rounded-xl border border-secondary/40 bg-secondary/10 p-4 text-sm leading-relaxed">
      Esta planificación usa la agenda guardada en este navegador. Los cambios todavía no se comparten automáticamente con otros miembros.
    </p>
    {allowedRamas.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Seleccionar unidad">
      {allowedRamas.map((rama) => <Button key={rama} variant={rama === activeRama ? "default" : "outline"} onClick={() => setActiveRama(rama)}>{ramaConfig[rama].titulo}</Button>)}
    </div>}
    {upcoming.length === 0 ? <Card><CardContent className="flex flex-col items-start gap-3 p-6">
      <CalendarDays className="size-7 text-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold">No hay próximos encuentros cargados</h2>
      <p className="text-sm text-muted-foreground">Consulta los anuncios de tu unidad o revisa la agenda en este dispositivo.</p>
      <Button asChild variant="outline"><Link to="/interno/agenda">Abrir agenda</Link></Button>
    </CardContent></Card> : <ul className="grid gap-3 md:grid-cols-2">
      {upcoming.map((event) => <li key={event.id}><Card className="h-full"><CardContent className="p-5">
        <p className="text-sm font-semibold text-primary">{formatEventDate(event.fecha)}{event.hora ? ` · ${event.hora}` : ""}</p>
        <h2 className="mt-2 text-lg font-semibold">{event.titulo}</h2>
        {event.lugar && <p className="mt-1 text-sm text-muted-foreground">{event.lugar}</p>}
        {event.descripcion && <p className="mt-3 text-sm leading-relaxed">{event.descripcion}</p>}
      </CardContent></Card></li>)}
    </ul>}
    <Button asChild className="self-start"><Link to="/interno/agenda">Ver y gestionar agenda</Link></Button>
  </section>;
}
