import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import { getCurrentUserAdminAccess, type AdminAccess } from "@/lib/admin-permissions";
import { adminTabRouteMap, type AdminDashboardTab } from "@/app/routes/admin-tabs";

type AdminPanelProps = {
  initialTab?: AdminDashboardTab;
};

export default function AdminPanel({ initialTab = "overview" }: AdminPanelProps) {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <Dashboard
        currentAccess={access}
        initialTab={initialTab}
        onTabChange={(tab) => navigate(adminTabRouteMap[tab])}
      />
    </div>
  );
}
