import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";

const ramaConfig: Record<
  MiembroRama,
  {
    titulo: string;
    lema: string;
    reuniones: string[];
    documentos: string[];
    info: string[];
  }
> = {
  rover: {
    titulo: "Panel Rover",
    lema: "Servir",
    reuniones: ["Lunes 20:00 - 22:00", "Sábado salida de servicio (según agenda)"],
    documentos: ["Plan anual de servicio", "Bitácora de proyectos", "Lista de materiales"],
    info: ["Coordinación de acciones solidarias", "Preparación de campamentos de servicio"],
  },
  pioneros: {
    titulo: "Panel Pioneros",
    lema: "Explorar",
    reuniones: ["Martes 19:00 - 21:00", "Sábado actividad al aire libre"],
    documentos: ["Cronograma de patrullas", "Guía de actividades", "Autorizaciones"],
    info: ["Desafíos de liderazgo", "Proyectos comunitarios de rama"],
  },
  caminantes: {
    titulo: "Panel Caminantes",
    lema: "Descubrir",
    reuniones: ["Miércoles 18:30 - 20:30", "Domingo encuentro mensual"],
    documentos: ["Plan de progresión", "Cuaderno de ruta", "Normas de seguridad"],
    info: ["Trabajo en equipo", "Actividades de orientación y naturaleza"],
  },
  lobatos: {
    titulo: "Panel Lobatos",
    lema: "Siempre mejor",
    reuniones: ["Sábado 15:00 - 17:00", "Fogón mensual con familias"],
    documentos: ["Calendario de manada", "Ficha médica", "Reglamento de convivencia"],
    info: ["Juego educativo", "Desarrollo de habilidades y valores"],
  },
};

export default function PanelRama({ rama }: { rama: MiembroRama }) {
  const { session, logout } = useMemberAuth();
  const [searchParams] = useSearchParams();
  const denied = searchParams.get("acceso") === "denegado";
  const config = ramaConfig[rama];

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">{config.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Bienvenido, <strong>{session?.nombre}</strong>. Este es tu espacio interno de rama.
              </p>
              <p className="text-sm text-primary font-medium">Lema de rama: {config.lema}</p>
              {denied && (
                <p className="text-sm text-amber-600">
                  Intentaste acceder a una rama que no corresponde a tu perfil. Te redirigimos a tu panel.
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild variant="outline">
                  <Link to="/area-miembros">Área de miembros</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">Ir al dashboard</Link>
                </Button>
                <Button variant="destructive" onClick={logout}>
                  Cerrar sesión
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Calendario</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {config.reuniones.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {config.documentos.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Próximamente: galería privada por rama con salidas, campamentos y actividades internas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Información interna</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {config.info.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
