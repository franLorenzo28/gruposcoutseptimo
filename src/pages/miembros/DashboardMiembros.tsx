import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { CalendarDays, Files, Bell, Camera, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const ramaLabel: Record<string, string> = {
  rover: "Rover",
  pioneros: "Pioneros",
  caminantes: "Caminantes",
  lobatos: "Lobatos",
};

export default function DashboardMiembros() {
  const { session, isAuthenticated, logout } = useMemberAuth();

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-8 sm:py-12 space-y-6">
        <Reveal>
          <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Panel privado</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dashboard de miembros</h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Bienvenido, <strong>{session.nombre}</strong>. Este panel resume la actividad de la rama <strong>{ramaLabel[session.rama] || session.rama}</strong>.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Acceso: {session.isRamaAdmin ? "Educador/a (admin de rama)" : "Beneficiario"}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Accesos rápidos</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={`/area-miembros/ramas/${session.rama}`}>
                    Mi panel de rama
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/perfil/editar">Editar perfil</Link>
                </Button>
                <Button variant="destructive" onClick={logout}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <Card className="border-border/60 bg-card/80 shadow-md h-full">
              <CardContent className="p-5">
                <CalendarDays className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Próxima actividad</h2>
                <p className="mt-2 text-sm text-muted-foreground">Reunión semanal de rama y salida de fin de mes.</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="border-border/60 bg-card/80 shadow-md h-full">
              <CardContent className="p-5">
                <Files className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Documentos</h2>
                <p className="mt-2 text-sm text-muted-foreground">Actas, autorizaciones y materiales internos de trabajo.</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="border-border/60 bg-card/80 shadow-md h-full">
              <CardContent className="p-5">
                <Bell className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Comunicados</h2>
                <p className="mt-2 text-sm text-muted-foreground">Avisos de coordinacion y recordatorios de actividades.</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="border-border/60 bg-card/80 shadow-md h-full">
              <CardContent className="p-5">
                <Camera className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Galeria interna</h2>
                <p className="mt-2 text-sm text-muted-foreground">Registro privado de campamentos y actividades por rama.</p>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div className="mx-auto max-w-6xl">
          <Card className="border-border/70 bg-gradient-to-r from-primary/15 to-primary/5 shadow-md">
            <CardContent className="p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm sm:text-base font-semibold">Necesitas otra seccion interna para tu rama? Podemos ampliarla por permisos.</p>
              <Button asChild variant="outline">
                <Link to="/area-miembros">Ver area de miembros</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

