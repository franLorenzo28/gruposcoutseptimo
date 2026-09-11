import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, FolderOpen, Megaphone, MessageCircle, Users, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { getUpcomingRamaEvents, ramaConfig, readRamaEvents } from "@/app/internal/rama-storage";
import { formatEventDate } from "@/lib/event-dates";
import { NewsPopup } from "@/components/layout/NewsPopup";

const shortcuts = [
  { to: "/interno/anuncios", title: "Anuncios", description: "Avisos de tu unidad", icon: Megaphone },
  { to: "/interno/mensajes", title: "Mensajes", description: "Tus conversaciones", icon: MessageCircle },
  { to: "/interno/documentos", title: "Documentos", description: "Materiales del grupo", icon: FolderOpen },
  { to: "/interno/usuarios", title: "Comunidad", description: "Miembros del Séptimo", icon: Users },
  { to: "/interno/galeria", title: "Galería", description: "Fotos de nuestras actividades", icon: Images },
  { to: "/interno/agenda", title: "Agenda", description: "Todos los encuentros", icon: CalendarDays },
];
const resources = [
  { to: "/interno/narrativas", title: "Narrativas" },
  { to: "/interno/capsula-tiempo", title: "Cápsula del tiempo" },
  { to: "/interno/am-lagerfeuer", title: "Am Lagerfeuer" },
  { to: "/interno/jamborees", title: "Jamborees" },
];
const upcomingModules = [
  { to: "/interno/planificacion", title: "Planificación" },
  { to: "/interno/formularios", title: "Formularios" },
  { to: "/interno/biblioteca", title: "Biblioteca" },
  { to: "/interno/subidas", title: "Progresión personal" },
];

export default function InternalDashboardPage() {
  const { session } = useMemberAuth();
  if (!session) return null;
  const allowedRamas = session.allowedRamas?.length ? session.allowedRamas : [session.rama];
  const primaryRama = ramaConfig[session.rama];
  const events = getUpcomingRamaEvents(readRamaEvents(session.rama));
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <InternalPageHeader eyebrow="Tu espacio en el Séptimo" title={`Hola, ${session.nombre.split(" ")[0]}`} description="Tu unidad, los próximos encuentros y lo que necesitas para participar."
        meta={<Button asChild><Link to={`/interno/unidades/${session.rama}`}>Mi unidad · {primaryRama.titulo}<ArrowRight aria-hidden="true" /></Link></Button>} />
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-xl">Próximos eventos</CardTitle>
          <Button asChild variant="outline" size="sm"><Link to="/interno/agenda">Ver agenda</Link></Button>
        </CardHeader>
        <CardContent>
          {events.length ? <ul className="grid gap-4 sm:grid-cols-3">
            {events.slice(0, 3).map(event => <li key={event.id} className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary">{formatEventDate(event.fecha)}{event.hora ? ` · ${event.hora}` : ""}</p>
              <h3 className="text-base font-semibold">{event.titulo}</h3>
              {event.lugar && <p className="text-sm text-muted-foreground">{event.lugar}</p>}
            </li>)}
          </ul> : <p className="text-sm leading-relaxed text-muted-foreground">Todavía no hay próximos encuentros en la agenda de {primaryRama.titulo}. Consulta los anuncios de tu unidad para conocer las novedades.</p>}
        </CardContent>
      </Card>
      <section aria-labelledby="daily-tools" className="flex flex-col gap-3">
        <h2 id="daily-tools" className="text-xl font-semibold">A mano</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {shortcuts.map(({ to, title, description, icon: Icon }) => <Link key={to} to={to} className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4">
            <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <div><h3 className="text-base font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
          </Link>)}
        </div>
      </section>
      {allowedRamas.length > 1 && <section className="flex flex-col gap-3" aria-labelledby="my-units"><h2 id="my-units" className="text-xl font-semibold">Mis unidades</h2><div className="flex flex-wrap gap-2">{allowedRamas.map(rama => <Button key={rama} asChild variant="outline"><Link to={`/interno/unidades/${rama}`}>{ramaConfig[rama].titulo}</Link></Button>)}</div></section>}
      <NewsPopup />
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Más recursos e historia del grupo</summary>
        <nav aria-label="Recursos e historia" className="mt-4 flex flex-wrap gap-2">{resources.map(item => <Button key={item.to} asChild variant="outline"><Link to={item.to}>{item.title}</Link></Button>)}</nav>
        <p className="mb-2 mt-5 text-sm text-muted-foreground">En preparación</p>
        <nav aria-label="Módulos en preparación" className="flex flex-wrap gap-2">{upcomingModules.map(item => <Button key={item.to} asChild variant="ghost" size="sm"><Link to={item.to}>{item.title}</Link></Button>)}</nav>
      </details>
    </section>
  );
}

