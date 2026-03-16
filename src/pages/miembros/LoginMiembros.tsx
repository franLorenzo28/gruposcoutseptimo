import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { deriveRamaFromEdad, type MiembroRama } from "@/lib/member-auth";
import { getAuthUser } from "@/lib/backend";
import { getProfile } from "@/lib/api";

function calculateAge(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const [y, m, d] = String(fechaNacimiento).split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const mm = now.getMonth() - birth.getMonth();
  if (mm < 0 || (mm === 0 && now.getDate() < birth.getDate())) years--;
  return years;
}

const ramaLabel: Record<MiembroRama, string> = {
  lobatos: "Lobatos",
  caminantes: "Caminantes",
  pioneros: "Pioneros",
  rover: "Rover",
};

export default function LoginMiembros() {
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState<string>("");
  const [edad, setEdad] = useState<number | null>(null);
  const [rama, setRama] = useState<MiembroRama | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated, session } = useMemberAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    if (isAuthenticated && session) {
      return `/area-miembros/ramas/${session.rama}`;
    }
    const fromState = (location.state as any)?.from;
    return typeof fromState === "string" ? fromState : "/dashboard";
  }, [isAuthenticated, session, location.state]);

  useEffect(() => {
    (async () => {
      try {
        const auth = await getAuthUser();
        if (!auth?.id) {
          setError("Necesitas iniciar sesión con tu cuenta principal para confirmar acceso.");
          return;
        }

        const profile = (await getProfile(auth.id).catch(() => null)) as any;
        if (!profile) {
          setError("No encontramos tu perfil. Completa tu perfil antes de ingresar al área interna.");
          return;
        }

        const displayName = String(profile.nombre_completo || "").trim();
        if (!displayName) {
          setError("Tu perfil no tiene nombre asignado. Completa tu nombre para continuar.");
          return;
        }

        const edadCalculada =
          typeof profile.edad === "number"
            ? profile.edad
            : calculateAge(profile.fecha_nacimiento || null);

        const ramaCalculada = deriveRamaFromEdad(edadCalculada);
        if (!ramaCalculada) {
          setNombre(displayName);
          setEdad(edadCalculada ?? null);
          setError(
            "No se pudo asignar una rama por edad. Verifica tu fecha de nacimiento en tu perfil.",
          );
          return;
        }

        setNombre(displayName);
        setEdad(edadCalculada ?? null);
        setRama(ramaCalculada);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirm = () => {
    if (!rama || !nombre) {
      setError("No fue posible confirmar tu acceso. Revisa tu perfil.");
      return;
    }
    setError(null);
    login({ nombre, rama });
    navigate(`/area-miembros/ramas/${rama}`);
  };

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-lg mx-auto">
          <Card className="border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Confirmación de acceso interno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Este ingreso no usa campos manuales. Tomamos tu cuenta autenticada y validamos
                  tu nombre y rama asignada por edad.
                </p>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Validando perfil...</p>
                ) : (
                  <div className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nombre detectado:</span>{" "}
                      <strong>{nombre || "Sin nombre"}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Edad detectada:</span>{" "}
                      <strong>{edad ?? "Sin edad"}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Rama asignada:</span>{" "}
                      <strong>{rama ? ramaLabel[rama] : "Sin rama"}</strong>
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={handleConfirm} disabled={loading || !!error || !rama || !nombre}>
                    Confirmar acceso
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/area-miembros">Volver</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/perfil/editar">Completar perfil</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth">Ir a login principal</Link>
                  </Button>
                </div>
              </div>

              {isAuthenticated && session && (
                <div className="mt-6 rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                  Ya hay sesión activa como <strong>{session.nombre}</strong>. Puedes ir directo a tu
                  panel desde <Link to={redirectTo} className="text-primary underline ml-1">aquí</Link>.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
