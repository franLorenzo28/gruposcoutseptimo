import { Navigate, type RouteObject } from "react-router-dom";
import { AdminGuard } from "@/components/AdminGuard";
import RequireAuthenticatedUser from "@/components/auth/RequireAuthenticatedUser";
import {
  AmLagerfeuer,
  Archivo,
  ArchivoCapsulaTiempo,
  ArchivoCompania,
  ArchivoScoutpedia,
  Bauen,
  Cancionero,
  Contacto,
  DirigEn,
  Eventos,
  Galeria,
  Historia,
  Inicio,
  Jamborees,
  Jamboree1981,
  Jamboree2014,
  Jamboree2023,
  Locales,
  Manada,
  MovimientoScout,
  PerfilPublic,
  Pioneros,
  Rovers,
  Staff,
  Tropa,
  VerificarEmail,
  Veteranos,
  Comite,
} from "@/app/routes/lazy-pages";
import { PublicSiteLayout } from "@/app/layouts/PublicSiteLayout";

export const publicRoutes: RouteObject = {
  element: <PublicSiteLayout />,
  children: [
    { index: true, element: <Inicio /> },
    { path: "linea-temporal", element: <Navigate to="/historia" replace /> },
    { path: "historia", element: <Historia /> },
    { path: "bauen", element: <Bauen /> },
    { path: "movimiento-scout", element: <MovimientoScout /> },
    { path: "archivo", element: <Archivo /> },
    { path: "archivo/scoutpedia", element: <ArchivoScoutpedia /> },
    {
      path: "archivo/compania",
      element: (
        <RequireAuthenticatedUser featureName="Compañía">
          <ArchivoCompania />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "archivo/capsula-del-tiempo",
      element: (
        <RequireAuthenticatedUser featureName="Cápsula del Tiempo">
          <ArchivoCapsulaTiempo />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "archivo/capsula-tiempo",
      element: <Navigate to="/archivo/capsula-del-tiempo" replace />,
    },
    {
      path: "archivo/am-lagerfeuer",
      element: (
        <RequireAuthenticatedUser featureName="Am Lagerfeuer">
          <AmLagerfeuer />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "am-lagerfeuer",
      element: <Navigate to="/archivo/am-lagerfeuer" replace />,
    },
    {
      path: "cancionero",
      element: (
        <RequireAuthenticatedUser featureName="Cancionero">
          <Cancionero />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "galeria",
      element: (
        <RequireAuthenticatedUser featureName="Galería">
          <Galeria />
        </RequireAuthenticatedUser>
      ),
    },
    { path: "verificar-email", element: <VerificarEmail /> },
    { path: "perfil-public/:id", element: <PerfilPublic /> },
    { path: "veteranos", element: <AdminGuard><Veteranos /></AdminGuard> },
    { path: "educadores", element: <AdminGuard><DirigEn /></AdminGuard> },
    { path: "archivo/locales", element: <Locales /> },
    { path: "locales", element: <Navigate to="/archivo/locales" replace /> },
    { path: "contacto", element: <Contacto /> },
    { path: "eventos", element: <Eventos /> },
    {
      path: "eventos/jamborees",
      element: (
        <RequireAuthenticatedUser featureName="Jamborees">
          <Jamborees />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "eventos/jamboree-1981",
      element: (
        <RequireAuthenticatedUser featureName="Jamboree 1981">
          <Jamboree1981 />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "eventos/jamboree-2014",
      element: (
        <RequireAuthenticatedUser featureName="Jamboree 2014">
          <Jamboree2014 />
        </RequireAuthenticatedUser>
      ),
    },
    {
      path: "eventos/jamboree-2023",
      element: (
        <RequireAuthenticatedUser featureName="Jamboree 2023">
          <Jamboree2023 />
        </RequireAuthenticatedUser>
      ),
    },
    { path: "unidades/manada", element: <Manada /> },
    { path: "unidades/tropa", element: <Tropa /> },
    { path: "unidades/pioneros", element: <Pioneros /> },
    { path: "unidades/rovers", element: <Rovers /> },
    { path: "unidades/staff", element: <Staff /> },
    { path: "unidades/comite", element: <Comite /> },
    { path: "ramas/manada", element: <Navigate to="/unidades/manada" replace /> },
    { path: "ramas/tropa", element: <Navigate to="/unidades/tropa" replace /> },
    { path: "ramas/pioneros", element: <Navigate to="/unidades/pioneros" replace /> },
    { path: "ramas/rovers", element: <Navigate to="/unidades/rovers" replace /> },
    { path: "ramas/staff", element: <Navigate to="/unidades/staff" replace /> },
    { path: "ramas/comite", element: <Navigate to="/unidades/comite" replace /> },
  ],
};

