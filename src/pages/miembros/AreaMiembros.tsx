import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { Lock, Users, FileText, Image } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export default function AreaMiembros() {
  const { isAuthenticated, session, logout } = useMemberAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-10 sm:py-14 space-y-8">
        <Reveal>
          <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Lock className="h-4 w-4" />
                Acceso interno
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Área de miembros</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Un espacio privado para organizar actividades por rama, centralizar documentos y compartir información interna del grupo.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Acceso exclusivo para beneficiarios y educadores con perfil completo.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:p-5">
              {isAuthenticated && session ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Sesión activa</p>
                  <p className="text-sm">
                    <strong>{session.nombre}</strong> · Rama <strong>{session.rama}</strong>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/dashboard">Ir a mi dashboard</Link>
                    </Button>
                    <Button variant="outline" onClick={logout}>
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Aún no confirmaste acceso interno.</p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/login">Confirmar ingreso</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/contacto">Solicitar acceso</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <Reveal>
            <Card className="h-full border-border/70 bg-card/80 shadow-md">
              <CardContent className="p-5">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Vida de rama</h2>
                <p className="mt-2 text-sm text-muted-foreground">Calendario, reuniones, equipos y avisos para cada unidad.</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full border-border/70 bg-card/80 shadow-md">
              <CardContent className="p-5">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Documentos</h2>
                <p className="mt-2 text-sm text-muted-foreground">Autorizaciones, materiales y actas para el trabajo interno.</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full border-border/70 bg-card/80 shadow-md">
              <CardContent className="p-5">
                <Image className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-lg font-bold">Galería privada</h2>
                <p className="mt-2 text-sm text-muted-foreground">Memoria visual de salidas, campamentos y actividades internas.</p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

