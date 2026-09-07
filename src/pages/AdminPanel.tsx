import { useNavigate } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { adminTabRouteMap, type AdminDashboardTab } from "@/app/routes/admin-tabs";

type AdminPanelProps = {
  initialTab?: AdminDashboardTab;
};

export default function AdminPanel({ initialTab = "overview" }: AdminPanelProps) {
  const access = useAdminAccess();
  const navigate = useNavigate();

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
