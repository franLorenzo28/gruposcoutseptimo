import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import { getCurrentUserAdminAccess, type AdminAccess } from "@/lib/admin-permissions";

export default function AdminPanel() {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const currentAccess = await getCurrentUserAdminAccess();
        if (!active) return;
        setAccess(currentAccess);
      } catch {
        if (!active) return;
        setAccess(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (!access?.canOpenAdminPanel) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-animate min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <Dashboard currentAccess={access} />
    </div>
  );
}

