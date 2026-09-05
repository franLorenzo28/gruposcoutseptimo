import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/useUser.tsx";
import { getCurrentUserAdminAccess, type AdminAccess } from "@/lib/admin-permissions";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [access, setAccess] = useState<AdminAccess | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setAccess(null);
      return;
    }
    setAccess(null);
    void getCurrentUserAdminAccess().then((result) => {
      if (active) setAccess(result);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (isUserLoading || (user && access === null)) {
    return <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>;
  }

  if (!user || !access?.canOpenAdminPanel) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
