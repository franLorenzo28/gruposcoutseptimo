import { type RouteObject } from "react-router-dom";
import RequireApproval from "@/components/RequireApproval";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPanel } from "@/app/routes/lazy-pages";
import { AdminPlatformLayout } from "@/app/layouts/AdminPlatformLayout";

function AdminSectionRoute({ tab }: { tab: "overview" | "users" | "requests" | "groups" | "events" | "messages" | "pages" }) {
  return (
    <AdminPanel initialTab={tab} />
  );
}

export const adminRoutes: RouteObject = {
  path: "admin",
  element: <AdminGuard><RequireApproval><AdminPlatformLayout /></RequireApproval></AdminGuard>,
  children: [
    {
      index: true,
      element: <AdminSectionRoute tab="overview" />,
    },
    { path: "usuarios", element: <AdminSectionRoute tab="users" /> },
    { path: "solicitudes", element: <AdminSectionRoute tab="requests" /> },
    { path: "grupos", element: <AdminSectionRoute tab="groups" /> },
    { path: "eventos", element: <AdminSectionRoute tab="events" /> },
    { path: "mensajes", element: <AdminSectionRoute tab="messages" /> },
    { path: "paginas", element: <AdminSectionRoute tab="pages" /> },
  ],
};
