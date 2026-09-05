import { Navigate, useLocation, useParams, type RouteObject } from "react-router-dom";

function PreserveRedirect({ to }: { to: string }) {
  const location = useLocation();

  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function GroupDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/interno/grupos/${id}`} replace />;
}

export const compatibilityRoutes: RouteObject[] = [
  { path: "auth", element: <PreserveRedirect to="/interno/auth" /> },
  { path: "auth/callback", element: <PreserveRedirect to="/interno/auth" /> },
  { path: "area-miembros", element: <Navigate to="/interno" replace /> },
  { path: "login", element: <Navigate to="/interno/auth" replace /> },
  { path: "dashboard", element: <Navigate to="/interno/dashboard" replace /> },
  { path: "area-miembros/unidades/rover", element: <Navigate to="/interno/unidades/rover" replace /> },
  { path: "area-miembros/unidades/pioneros", element: <Navigate to="/interno/unidades/pioneros" replace /> },
  { path: "area-miembros/unidades/tropa", element: <Navigate to="/interno/unidades/tropa" replace /> },
  { path: "area-miembros/unidades/lobatos", element: <Navigate to="/interno/unidades/lobatos" replace /> },
  { path: "area-miembros/ramas/rover", element: <Navigate to="/interno/unidades/rover" replace /> },
  { path: "area-miembros/ramas/pioneros", element: <Navigate to="/interno/unidades/pioneros" replace /> },
  { path: "area-miembros/ramas/tropa", element: <Navigate to="/interno/unidades/tropa" replace /> },
  { path: "area-miembros/ramas/lobatos", element: <Navigate to="/interno/unidades/lobatos" replace /> },
  { path: "perfil", element: <PreserveRedirect to="/interno/perfil" /> },
  { path: "perfil/editar", element: <PreserveRedirect to="/interno/perfil/editar" /> },
  { path: "configuracion", element: <PreserveRedirect to="/interno/configuracion" /> },
  { path: "mensajes", element: <PreserveRedirect to="/interno/mensajes" /> },
  { path: "usuarios", element: <PreserveRedirect to="/interno/usuarios" /> },
  { path: "grupos/:id", element: <GroupDetailRedirect /> },
  { path: "dashboard-coordinador", element: <Navigate to="/interno/dashboard-coordinador" replace /> },
  { path: "admin-panel", element: <Navigate to="/admin" replace /> },
  { path: "uploads", element: <Navigate to="/interno/subidas" replace /> },
  { path: "biblioteca", element: <Navigate to="/interno/biblioteca" replace /> },
  { path: "formularios", element: <Navigate to="/interno/formularios" replace /> },
  { path: "planificacion", element: <Navigate to="/interno/planificacion" replace /> },
  { path: "capsula-del-tiempo", element: <Navigate to="/archivo/capsula-del-tiempo" replace /> },
  { path: "capsula-tiempo", element: <Navigate to="/archivo/capsula-del-tiempo" replace /> },
];
