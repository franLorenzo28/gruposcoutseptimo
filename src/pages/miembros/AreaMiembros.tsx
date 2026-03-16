import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";

export default function AreaMiembros() {
  const { isAuthenticated, session, logout } = useMemberAuth();

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Área de miembros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Este espacio interno está pensado para la organización por rama:
                calendario, documentos, fotos e información de uso interno.
              </p>
              {isAuthenticated && session ? (
                <div className="space-y-4">
                  <p className="text-foreground">
                    Sesión iniciada como <strong>{session.nombre}</strong> en la rama <strong>{session.rama}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/dashboard">Ir a mi panel</Link>
                    </Button>
                    <Button variant="outline" onClick={logout}>
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/contacto">Solicitar acceso</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
