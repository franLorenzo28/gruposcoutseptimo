import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MemberAuthProvider, useMemberAuth } from "@/context/MemberAuthContext";
import RequireMemberAuth from "@/components/auth/RequireMemberAuth";
import RequireRamaAccess from "@/components/auth/RequireRamaAccess";
import RequireAuthenticatedUser from "@/components/auth/RequireAuthenticatedUser";
import { NotificationsProvider } from "@/context/Notifications";
import { AdminGuard } from "@/components/AdminGuard";
import PageLoader from "@/components/ui/PageLoader";
import { useGlobalPresenceHeartbeat } from "@/hooks/useGlobalPresenceHeartbeat";
import { useSupabaseUser } from "@/providers/AppProviders";

const Inicio = lazy(() => import("@/pages/inicio/Inicio"));
const Historia = lazy(() => import("@/pages/historia/Historia.tsx"));
const Bauen = lazy(() => import("@/pages/eventos/Bauen"));
const AmLagerfeuer = lazy(() => import("@/pages/archivo/AmLagerfeuer"));
const MovimientoScout = lazy(() => import("@/pages/MovimientoScout"));
const Archivo = lazy(() => import("@/pages/Archivo.tsx"));
const ArchivoScoutpedia = lazy(() => import("@/pages/archivo/Scoutpedia"));
const ArchivoCompania = lazy(() => import("@/pages/archivo/Compania"));
const ArchivoCapsulaTiempo = lazy(() => import("@/pages/archivo/CapsulaTiempo"));
const Cancionero = lazy(() => import("@/pages/Cancionero"));
const Veteranos = lazy(() => import("@/pages/Veteranos"));
const DirigEn = lazy(() => import("@/pages/DirigEn"));
const Locales = lazy(() => import("@/pages/Locales"));
const Jamborees = lazy(() => import("@/pages/eventos/Jamborees"));
const Jamboree1981 = lazy(() => import("@/pages/eventos/Jamboree1981"));
const Jamboree2014 = lazy(() => import("@/pages/eventos/Jamboree2014"));
const Jamboree2023 = lazy(() => import("@/pages/eventos/Jamboree2023"));
const Galeria = lazy(() => import("@/pages/galeria/Galeria"));
const Contacto = lazy(() => import("@/pages/Contacto"));
const Eventos = lazy(() => import("@/pages/eventos/Eventos"));
const Auth = lazy(() => import("@/pages/Auth"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const PerfilView = lazy(() => import("@/pages/PerfilView"));
const PerfilPublic = lazy(() => import("@/pages/PerfilPublic"));
const Configuracion = lazy(() => import("@/pages/Configuracion"));
const VerificarEmail = lazy(() => import("@/pages/VerificarEmail"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const Mensajes = lazy(() => import("@/pages/Mensajes"));
const GrupoDetail = lazy(() => import("@/pages/GrupoDetail"));
const DashboardCoordinador = lazy(() => import("@/pages/DashboardCoordinador"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AreaMiembros = lazy(() => import("@/pages/miembros/AreaMiembros"));
const LoginMiembros = lazy(() => import("@/pages/miembros/LoginMiembros"));
const PanelRama = lazy(() => import("@/pages/miembros/PanelRama"));
const Manada = lazy(() => import("@/pages/ramas/manada"));
const Tropa = lazy(() => import("@/pages/ramas/tropa"));
const Pioneros = lazy(() => import("@/pages/ramas/pioneros"));
const Rovers = lazy(() => import("@/pages/ramas/rovers"));
const Staff = lazy(() => import("@/pages/ramas/staff"));
const Comite = lazy(() => import("@/pages/ramas/comite"));
const Narrativas = lazy(() => import("@/pages/narrativas"));
const TestDiagnostic = lazy(() => import("@/pages/TestDiagnostic"));

function Dashboard() {
  const { session } = useMemberAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/area-miembros/unidades/${session.rama}`} replace />;
}

function GlobalPresenceHeartbeat() {
  const { user } = useSupabaseUser();
  useGlobalPresenceHeartbeat(user?.id);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <GlobalPresenceHeartbeat />
      <MemberAuthProvider>
        <NotificationsProvider>
          <Suspense fallback={<PageLoader message="Cargando secciÃ³n..." />}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/linea-temporal" element={<Navigate to="/historia" replace />} />
              <Route path="/historia" element={<Historia />} />
              <Route path="/narrativas" element={<Narrativas />} />
              <Route path="/bauen" element={<Bauen />} />
              <Route
                path="/archivo/am-lagerfeuer"
                element={
                  <RequireAuthenticatedUser featureName="Am Lagerfeuer">
                    <AmLagerfeuer />
                  </RequireAuthenticatedUser>
                }
              />
              <Route path="/am-lagerfeuer" element={<Navigate to="/archivo/am-lagerfeuer" replace />} />
              <Route path="/movimiento-scout" element={<MovimientoScout />} />
              <Route
                path="/archivo"
                element={
                  <RequireAuthenticatedUser featureName="Archivo">
                    <Archivo />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/archivo/scoutpedia"
                element={
                  <RequireAuthenticatedUser featureName="Archivo">
                    <ArchivoScoutpedia />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/archivo/compania"
                element={
                  <RequireAuthenticatedUser featureName="Archivo">
                    <ArchivoCompania />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/archivo/capsula-del-tiempo"
                element={
                  <RequireAuthenticatedUser featureName="Capsula del Tiempo">
                    <ArchivoCapsulaTiempo />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/cancionero"
                element={
                  <RequireAuthenticatedUser featureName="Cancionero">
                    <Cancionero />
                  </RequireAuthenticatedUser>
                }
              />
              <Route path="/veteranos" element={<AdminGuard><Veteranos /></AdminGuard>} />
              <Route path="/dirigentes" element={<AdminGuard><DirigEn /></AdminGuard>} />
              <Route
                path="/archivo/locales"
                element={
                  <RequireAuthenticatedUser featureName="Archivo">
                    <Locales />
                  </RequireAuthenticatedUser>
                }
              />
              <Route path="/locales" element={<Navigate to="/archivo/locales" replace />} />
              <Route
                path="/galeria"
                element={
                  <RequireAuthenticatedUser featureName="Galeria">
                    <Galeria />
                  </RequireAuthenticatedUser>
                }
              />
              <Route path="/contacto" element={<Contacto />} />
              <Route
                path="/eventos"
                element={
                  <RequireAuthenticatedUser featureName="Eventos">
                    <Eventos />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/eventos/jamborees"
                element={
                  <RequireAuthenticatedUser featureName="Jamborees">
                    <Jamborees />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/eventos/jamboree-1981"
                element={
                  <RequireAuthenticatedUser featureName="Eventos">
                    <Jamboree1981 />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/eventos/jamboree-2014"
                element={
                  <RequireAuthenticatedUser featureName="Eventos">
                    <Jamboree2014 />
                  </RequireAuthenticatedUser>
                }
              />
              <Route
                path="/eventos/jamboree-2023"
                element={
                  <RequireAuthenticatedUser featureName="Eventos">
                    <Jamboree2023 />
                  </RequireAuthenticatedUser>
                }
              />
              <Route path="/area-miembros" element={<AreaMiembros />} />
              <Route path="/login" element={<LoginMiembros />} />
              <Route
                path="/dashboard"
                element={
                  <RequireMemberAuth>
                    <Dashboard />
                  </RequireMemberAuth>
                }
              />
              <Route
                path="/area-miembros/unidades/rover"
                element={
                  <RequireRamaAccess allowedRama="rover">
                    <PanelRama rama="rover" />
                  </RequireRamaAccess>
                }
              />
              <Route
                path="/area-miembros/unidades/pioneros"
                element={
                  <RequireRamaAccess allowedRama="pioneros">
                    <PanelRama rama="pioneros" />
                  </RequireRamaAccess>
                }
              />
              <Route
                path="/area-miembros/unidades/tropa"
                element={
                  <RequireRamaAccess allowedRama="tropa">
                    <PanelRama rama="tropa" />
                  </RequireRamaAccess>
                }
              />
              <Route
                path="/area-miembros/unidades/lobatos"
                element={
                  <RequireRamaAccess allowedRama="lobatos">
                    <PanelRama rama="lobatos" />
                  </RequireRamaAccess>
                }
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Auth />} />
              <Route path="/verificar-email" element={<VerificarEmail />} />
              <Route path="/perfil" element={<PerfilView />} />
              <Route path="/perfil/editar" element={<Perfil />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/perfil-public/:id" element={<PerfilPublic />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/mensajes" element={<Mensajes />} />
              <Route path="/grupos/:id" element={<GrupoDetail />} />
              <Route path="/dashboard-coordinador" element={<DashboardCoordinador />} />

              <Route path="/unidades/manada" element={<Manada />} />
              <Route path="/unidades/tropa" element={<Tropa />} />
              <Route path="/unidades/pioneros" element={<Pioneros />} />
              <Route path="/unidades/rovers" element={<Rovers />} />
              <Route path="/unidades/staff" element={<Staff />} />
              <Route path="/unidades/comite" element={<Comite />} />

              <Route path="/area-miembros/ramas/rover" element={<Navigate to="/area-miembros/unidades/rover" replace />} />
              <Route path="/area-miembros/ramas/pioneros" element={<Navigate to="/area-miembros/unidades/pioneros" replace />} />
              <Route path="/area-miembros/ramas/tropa" element={<Navigate to="/area-miembros/unidades/tropa" replace />} />
              <Route path="/area-miembros/ramas/lobatos" element={<Navigate to="/area-miembros/unidades/lobatos" replace />} />
              <Route path="/ramas/manada" element={<Navigate to="/unidades/manada" replace />} />
              <Route path="/ramas/tropa" element={<Navigate to="/unidades/tropa" replace />} />
              <Route path="/ramas/pioneros" element={<Navigate to="/unidades/pioneros" replace />} />
              <Route path="/ramas/rovers" element={<Navigate to="/unidades/rovers" replace />} />
              <Route path="/ramas/staff" element={<Navigate to="/unidades/staff" replace />} />
              <Route path="/ramas/comite" element={<Navigate to="/unidades/comite" replace />} />

              <Route path="/admin-panel" element={<AdminPanel />} />
              <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
              <Route path="/test-diagnostic" element={<TestDiagnostic />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </NotificationsProvider>
      </MemberAuthProvider>
    </>
  );
}
