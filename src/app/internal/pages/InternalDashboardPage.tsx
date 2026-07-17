import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { getUpcomingRamaEvents, ramaConfig, readRamaEvents } from "@/app/internal/rama-storage";
import { BookOpen, CalendarDays, CalendarHeart, FolderOpen, Megaphone, MessageCircle, ShieldCheck, Users, UploadCloud } from "lucide-react";

export default function InternalDashboardPage() {
  const { session } = useMemberAuth();

  if (!session) return null;

  const allowedRamas = session.allowedRamas?.length ? session.allowedRamas : [session.rama];
  const primaryRama = ramaConfig[session.rama];
  const upcomingEvents = getUpcomingRamaEvents(readRamaEvents(session.rama));

  const identityLinks = [
    {
      to: "/interno/narrativas",
      title: "Narrativas",
      description: "Recursos y reflexiones que construyen nuestra identidad grupal.",
      icon: BookOpen,
    },
    {
      to: "/interno/documentos",
      title: "Documentos",
      description: "Materiales institucionales y documentos generales del grupo.",
      icon: FolderOpen,
    },
    {
      to: "/interno/agenda",
      title: "Agenda",
      description: "Calendario operativo y prximos encuentros.",
      icon: CalendarDays,
    },
    {
      to: "/interno/subidas",
      title: "Archivos y Subidas",
      description: "Archivos compartidos exclusivos de tu unidad.",
      icon: UploadCloud,
    },
    {
      to: "/interno/capsula-tiempo",
      title: "Cápsula del Tiempo",
      description: "Archivos histricos y recuerdos especiales.",
      icon: FolderOpen,
    },
    {
      to: "/interno/am-lagerfeuer",
      title: "Am Lagerfeuer",
      description: "Nuestra publicación oficial histrica.",
      icon: BookOpen,
    },
    {
      to: "/interno/jamborees",
      title: "Jamborees",
      description: "Participación en eventos internacionales.",
      icon: FolderOpen,
    },
  ];

  const platformLinks = [
    {
      to: "/interno/usuarios",
      title: "Miembros",
      description: "Directorio de miembros y roles en la comunidad.",
      icon: Users,
    },
    {
      to: "/interno/mensajes",
      title: "Mensajes",
      description: "Conversaciones directas con otros scouts y educadores.",
      icon: MessageCircle,
    },
    {
      to: "/interno/galeria",
      title: "Galería",
      description: "Fotos y recuerdos de nuestras actividades.",
      icon: FolderOpen,
    },
    {
      to: "/interno/anuncios",
      title: "Anuncios",
      description: "Difusiones oficiales y comunicados generales del grupo.",
      icon: Megaphone,
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Dashboard interno"
        title={`Centro operativo de ${primaryRama.titulo}`}
        description={`Bienvenido, ${session.nombre}. Desde aquí ordenas la vida interna del grupo con acceso rápido a documentos, anuncios, agenda y tu panel de unidad.`}
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full bg-background/80">
              Rama base: {primaryRama.titulo}
            </Badge>
            <Badge variant="outline" className="rounded-full bg-background/80">
              Acceso: {session.accessType}
            </Badge>
            {session.isRamaAdmin ? (
              <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                <ShieldCheck className="mr-1 h-4 w-4" />
                Educador admin
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          {/* Plataforma Interna Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 tracking-tight">Plataforma Interna</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {platformLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.to} className="border-border/70 bg-card/85 shadow-sm transition-all hover:bg-card/100 hover:shadow-md">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link to={item.to}>Abrir</Link>
                        </Button>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Identidad / Grupo Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2">
              <CalendarHeart className="h-5 w-5 text-scout-yellow" />
              Identidad y Grupo
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {identityLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.to}
                    className="border-l-4 border-l-scout-yellow/70 border-border/50 bg-gradient-to-br from-amber-50/40 to-card shadow-sm transition-all hover:shadow-md dark:from-amber-950/10 dark:to-card"
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-scout-yellow/15 p-3 text-scout-yellow">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-full border-scout-yellow/30 text-amber-800 hover:bg-scout-yellow/10 dark:text-amber-200">
                          <Link to={item.to}>Abrir</Link>
                        </Button>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Unidades habilitadas
                  </p>
                  <h2 className="mt-1 text-lg font-bold">Cobertura interna</h2>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {allowedRamas.length} unidad{allowedRamas.length === 1 ? "" : "es"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {allowedRamas.map((rama) => (
                  <Badge key={rama} className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                    {ramaConfig[rama].titulo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Agenda inmediata
                  </p>
                  <h2 className="mt-1 text-lg font-bold">Próximos eventos</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/interno/agenda">Ver agenda</Link>
                </Button>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-5 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Sin eventos próximos
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Cargá actividades desde la sección Agenda para verlas aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <article key={event.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-bold">{event.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.fecha} {event.hora ? `- ${event.hora}` : ""}
                      </p>
                      {event.lugar ? (
                        <p className="mt-1 text-xs text-muted-foreground">{event.lugar}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
