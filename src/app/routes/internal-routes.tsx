import { Navigate, type RouteObject } from "react-router-dom";
import RequireApproval from "@/components/RequireApproval";
import RequireMemberAuth from "@/components/auth/RequireMemberAuth";
import {
  Auth,
  Configuracion,
  DashboardCoordinador,
  InternalAnnouncementsPage,
  InternalCalendarPage,
  Galeria,
  Jamborees,
  Jamboree1981,
  Jamboree2014,
  Jamboree2023,
  AmLagerfeuer,
  ArchivoCapsulaTiempo,
  InternalDashboardPage,
  InternalDocumentsPage,
  InternalPlanningPage,
  InternalUploadsPage,
  Mensajes,
  Narrativas,
  Perfil,
  PerfilView,
  Usuarios,
  GrupoDetail,
} from "@/app/routes/lazy-pages";
import { InternalPlatformLayout } from "@/app/layouts/InternalPlatformLayout";
import { useMemberAuth } from "@/context/MemberAuthContext";

function InternalDashboardRedirect() {
  const { isAuthenticated } = useMemberAuth();
  return isAuthenticated ? <InternalDashboardPage /> : <Navigate to="/interno/auth" replace />;
}

export const internalRoutes: RouteObject = {
  path: "interno",
  element: <InternalPlatformLayout />,
  children: [
    { index: true, element: <Navigate to="/interno/dashboard" replace /> },
    { path: "auth", element: <Auth /> },
    { path: "auth/callback", element: <Auth /> },
    {
      path: "dashboard",
      element: (
        <RequireMemberAuth>
          <InternalDashboardRedirect />
        </RequireMemberAuth>
      ),
    },
    {
      path: "narrativas",
      element: (
        <RequireMemberAuth>
          <Narrativas />
        </RequireMemberAuth>
      ),
    },
    {
      path: "documentos",
      element: (
        <RequireMemberAuth>
          <InternalDocumentsPage />
        </RequireMemberAuth>
      ),
    },
    {
      path: "anuncios",
      element: (
        <RequireMemberAuth>
          <InternalAnnouncementsPage />
        </RequireMemberAuth>
      ),
    },
    {
      path: "agenda",
      element: (
        <RequireMemberAuth>
          <InternalCalendarPage />
        </RequireMemberAuth>
      ),
    },
    {
      path: "subidas",
      element: (
        <RequireMemberAuth>
          <InternalUploadsPage />
        </RequireMemberAuth>
      ),
    },
    {
      path: "planificacion",
      element: (
        <RequireMemberAuth>
          <InternalPlanningPage />
        </RequireMemberAuth>
      ),
    },
    {
      path: "galeria",
      element: (
        <RequireMemberAuth>
          <Galeria />
        </RequireMemberAuth>
      ),
    },
    {
      path: "jamborees",
      element: (
        <RequireMemberAuth>
          <Jamborees />
        </RequireMemberAuth>
      ),
    },
    {
      path: "jamborees/1981",
      element: (
        <RequireMemberAuth>
          <Jamboree1981 />
        </RequireMemberAuth>
      ),
    },
    {
      path: "jamborees/2014",
      element: (
        <RequireMemberAuth>
          <Jamboree2014 />
        </RequireMemberAuth>
      ),
    },
    {
      path: "jamborees/2023",
      element: (
        <RequireMemberAuth>
          <Jamboree2023 />
        </RequireMemberAuth>
      ),
    },
    {
      path: "am-lagerfeuer",
      element: (
        <RequireMemberAuth>
          <AmLagerfeuer />
        </RequireMemberAuth>
      ),
    },
    {
      path: "capsula-tiempo",
      element: (
        <RequireMemberAuth>
          <ArchivoCapsulaTiempo />
        </RequireMemberAuth>
      ),
    },
    {
      path: "perfil",
      element: (
        <RequireApproval>
          <PerfilView />
        </RequireApproval>
      ),
    },
    {
      path: "perfil/editar",
      element: (
        <RequireApproval>
          <Perfil />
        </RequireApproval>
      ),
    },
    {
      path: "configuracion",
      element: (
        <RequireApproval>
          <Configuracion />
        </RequireApproval>
      ),
    },
    {
      path: "mensajes",
      element: (
        <RequireApproval>
          <Mensajes />
        </RequireApproval>
      ),
    },
    {
      path: "usuarios",
      element: (
        <RequireMemberAuth>
          <Usuarios />
        </RequireMemberAuth>
      ),
    },
    {
      path: "grupos/:id",
      element: (
        <RequireMemberAuth>
          <GrupoDetail />
        </RequireMemberAuth>
      ),
    },
    { path: "dashboard-coordinador", element: <DashboardCoordinador /> },
  ],
};
