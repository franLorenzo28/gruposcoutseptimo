import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";

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
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Dashboard de miembros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Bienvenido, <strong>{session.nombre}</strong>. Estás ingresando al panel interno de la rama {" "}
                <strong>{ramaLabel[session.rama] || session.rama}</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={`/area-miembros/ramas/${session.rama}`}>Ir a mi panel de rama</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/area-miembros">Área de miembros</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/perfil/editar">Editar mi perfil</Link>
                </Button>
                <Button variant="destructive" onClick={logout}>
                  Cerrar sesión interna
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Próxima actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reunión semanal de rama. Ver detalles en el panel específico.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Actas, autorizaciones y materiales internos de trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Comunicados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Avisos recientes de coordinación y recordatorios de actividades.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Galería interna</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Próximamente: fotos privadas por rama para miembros autorizados.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
