import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export default function RequireAuthenticatedUser({
  children,
  featureName = "esta seccion",
}: {
  children: React.ReactNode;
  featureName?: string;
}) {
  const { user, isUserLoading } = useUser();
  const location = useLocation();
  const accountStatus = String(
    (user as any)?.account_status || (user as any)?.profile?.account_status || "",
  ).toLowerCase();

  if (isUserLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Validando acceso...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Necesitas iniciar sesion para acceder a {featureName}.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link
                to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
              >
                Iniciar sesion
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (accountStatus && accountStatus !== "activo") {
    const isRejected = accountStatus === "rechazado";
    const isPendingEmail = accountStatus === "pendiente_email";
    const title = isRejected
      ? "Cuenta rechazada"
      : isPendingEmail
        ? "Verificación pendiente"
        : "Cuenta pendiente de aprobación";
    const description = isRejected
      ? "Tu cuenta fue rechazada por administración. Si crees que es un error, contacta con un administrador."
      : isPendingEmail
        ? `Necesitas verificar tu correo antes de acceder a ${featureName}.`
        : `Tu cuenta aún no fue aprobada para acceder a ${featureName}.`;

    return (
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}>
                Ir a inicio de sesión
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
