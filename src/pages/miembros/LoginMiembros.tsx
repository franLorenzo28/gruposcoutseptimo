import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import {
  resolveMemberAccessFromProfile,
  type MemberAccessType,
  type MiembroRama,
} from "@/lib/member-auth";
import { getAuthUser } from "@/lib/backend";
import { getProfile } from "@/lib/api";
import { ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

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
  const [rolAdulto, setRolAdulto] = useState<string>("");
  const [isRamaAdmin, setIsRamaAdmin] = useState(false);
  const [accessType, setAccessType] = useState<MemberAccessType | null>(null);
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

        const access = resolveMemberAccessFromProfile({
          edad: edadCalculada,
          rol_adulto: profile.rol_adulto,
          rama_que_educa: profile.rama_que_educa,
          seisena: profile.seisena,
          patrulla: profile.patrulla,
          equipo_pioneros: profile.equipo_pioneros,
          comunidad_rovers: profile.comunidad_rovers,
        });

        if (!access.allowed || !access.rama || !access.accessType) {
          setNombre(displayName);
          setEdad(edadCalculada ?? null);
          setRolAdulto(String(profile.rol_adulto || ""));
          setError(access.reason || "No se pudo validar tu acceso interno.");
          return;
        }

        setNombre(displayName);
        setEdad(edadCalculada ?? null);
        setRolAdulto(String(profile.rol_adulto || ""));
        setRama(access.rama);
        setIsRamaAdmin(access.isRamaAdmin);
        setAccessType(access.accessType);
      } catch (err) {
        console.error("Error validando acceso de miembros:", err);
        setError("No pudimos validar tu perfil en este momento. Intenta de nuevo en unos minutos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirm = () => {
    if (!rama || !nombre || !accessType) {
      setError("No fue posible confirmar tu acceso. Revisa tu perfil.");
      return;
    }
    setError(null);
    login({ nombre, rama, isRamaAdmin, accessType });
    navigate(`/area-miembros/ramas/${rama}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <div className="h-16 sm:h-20" />
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <Card className="border-border/60 shadow-xl bg-card/80">
            <CardContent>
              <div className="space-y-5 p-2 sm:p-4">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Reconfirmacion de identidad
                  </p>
                  <h1 className="mt-3 text-3xl font-black">Confirmacion de acceso interno</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                  Este ingreso no usa campos manuales. Validamos tu cuenta y aplicamos reglas por
                  edad, rol y rama para habilitar el acceso correcto.
                  </p>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Validando perfil...</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre detectado</p>
                      <p className="mt-1 font-semibold">{nombre || "Sin nombre"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Edad detectada</p>
                      <p className="mt-1 font-semibold">{edad ?? "Sin edad"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Rama asignada</p>
                      <p className="mt-1 font-semibold">{rama ? ramaLabel[rama] : "Sin rama"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Permiso interno</p>
                      <p className="mt-1 font-semibold">
                        {isRamaAdmin
                          ? "Educador/a - Admin de rama"
                          : accessType === "beneficiario"
                            ? "Beneficiario"
                            : rolAdulto || "Sin definir"}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={handleConfirm} disabled={loading || !!error || !rama || !nombre || !accessType}>
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

                {!loading && !error && isRamaAdmin && (
                  <p className="text-sm text-emerald-700">
                    Como educador/a de rama, tendrás permisos de administración del dashboard de tu rama.
                  </p>
                )}
              </div>

              {isAuthenticated && session && (
                <div className="mt-6 rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                  <UserCheck className="inline mr-1 h-4 w-4" />
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

