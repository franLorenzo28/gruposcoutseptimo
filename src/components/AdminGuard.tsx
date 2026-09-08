import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser.tsx";
import { requestCurrentUserAdminAccess, type AdminAccess } from "@/lib/admin-permissions";
import { AdminAccessContext } from "@/context/AdminAccessContext";
import { BackendError } from "@/lib/backend";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const location = useLocation();
  const [result, setResult] = useState<{ userId: string; access?: AdminAccess; error?: unknown } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setResult(null);
    if (!user || isUserLoading) {
      return;
    }
    void requestCurrentUserAdminAccess().then(
      (access) => { if (active) setResult({ userId: user.id, access }); },
      (error: unknown) => { if (active) setResult({ userId: user.id, error }); },
    );
    return () => {
      active = false;
    };
  }, [user, isUserLoading, attempt]);

  if (isUserLoading) {
    return <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/interno/auth" replace state={{ from: location.pathname }} />;
  }
  if (!result || result.userId !== user.id) {
    return <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>;
  }
  if (result.error) {
    if (result.error instanceof BackendError && result.error.status === 401) {
      return <Navigate to="/interno/auth" replace state={{ from: location.pathname }} />;
    }
    if (result.error instanceof BackendError && result.error.status === 403) {
      return <Navigate to="/" replace />;
    }
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p role="alert">No se pudieron verificar los permisos de administración. El servicio no está disponible.</p>
      <Button onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>Reintentar</Button>
      <Button asChild variant="outline"><Link to="/">Volver al inicio</Link></Button>
    </div>;
  }
  const access = result.access;
  if (access?.userId !== user.id || !access.canOpenAdminPanel) {
    return <Navigate to="/" replace />;
  }
  return <AdminAccessContext.Provider value={access}>{children}</AdminAccessContext.Provider>;
}
