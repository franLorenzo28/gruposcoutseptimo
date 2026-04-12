import {
  useEffect,
  useState,
  createContext,
  useContext,
  Suspense,
  lazy,
} from "react";
import NavegacionPrincipal from "@/components/layout/NavegacionPrincipal";
import PieDePagina from "@/components/layout/PieDePagina";
import { NewsPopup } from "@/components/layout/NewsPopup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// ...existing code...
import { ThemeProvider } from "next-themes";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import BotonVolverGlobal from "@/components/layout/BotonVolverGlobal";
const Inicio = lazy(() => import("./pages/inicio/Inicio"));
const Historia = lazy(() => import("./pages/historia/Historia.tsx"));
const Bauen = lazy(() => import("./pages/eventos/Bauen"));
const AmLagerfeuer = lazy(() => import("./pages/archivo/AmLagerfeuer"));
const MovimientoScout = lazy(() => import("./pages/MovimientoScout"));
const Archivo = lazy(() => import("./pages/Archivo.tsx"));
const ArchivoScoutpedia = lazy(() => import("./pages/archivo/Scoutpedia"));
const ArchivoCompania = lazy(() => import("./pages/archivo/Compania"));
const ArchivoCapsulaTiempo = lazy(() => import("./pages/archivo/CapsulaTiempo"));
const Cancionero = lazy(() => import("./pages/Cancionero"));
const Veteranos = lazy(() => import("./pages/Veteranos"));
const Dirigentes = lazy(() => import("./pages/Dirigentes"));
const Locales = lazy(() => import("./pages/Locales"));
const Jamborees = lazy(() => import("./pages/eventos/Jamborees"));
const Jamboree1981 = lazy(() => import("./pages/eventos/Jamboree1981"));
const Jamboree2014 = lazy(() => import("./pages/eventos/Jamboree2014"));
const Jamboree2023 = lazy(() => import("./pages/eventos/Jamboree2023"));
const Galeria = lazy(() => import("./pages/galeria/Galeria"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Eventos = lazy(() => import("./pages/eventos/Eventos"));
const Auth = lazy(() => import("./pages/Auth"));
const Perfil = lazy(() => import("./pages/Perfil"));
const PerfilView = lazy(() => import("./pages/PerfilView"));
const PerfilPublic = lazy(() => import("./pages/PerfilPublic"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const VerificarEmail = lazy(() => import("./pages/VerificarEmail"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Mensajes = lazy(() => import("./pages/Mensajes"));
const GrupoDetail = lazy(() => import("@/pages/GrupoDetail"));
const DashboardCoordinador = lazy(() => import("./pages/DashboardCoordinador"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AreaMiembros = lazy(() => import("./pages/miembros/AreaMiembros"));
const LoginMiembros = lazy(() => import("./pages/miembros/LoginMiembros"));
const PanelRama = lazy(() => import("./pages/miembros/PanelRama"));
const Manada = lazy(() => import("./pages/ramas/manada"));
const Tropa = lazy(() => import("./pages/ramas/tropa"));
const Pioneros = lazy(() => import("./pages/ramas/pioneros"));
const Rovers = lazy(() => import("./pages/ramas/rovers"));
const Staff = lazy(() => import("./pages/ramas/staff"));
const Comite = lazy(() => import("./pages/ramas/comite"));
const Narrativas = lazy(() => import("./pages/narrativas"));
import { MemberAuthProvider, useMemberAuth } from "@/context/MemberAuthContext";
import RequireMemberAuth from "@/components/auth/RequireMemberAuth";
import RequireRamaAccess from "@/components/auth/RequireRamaAccess";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import FondoAnimado from "@/components/layout/FondoAnimado";
import { NotificationsProvider } from "@/context/Notifications";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AdminGuard } from "@/components/AdminGuard";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import { querySilent } from "@/lib/supabase-logger";
import { PageGridBackground } from "@/components/PageGridBackground";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

//  Contexto global de usuario Supabase - Combined type for user + profile
type SupabaseUserWithProfile = User & {
  profile?: Partial<Profile>;
} & Partial<Profile>;

interface SupabaseUserContextType {
  user: SupabaseUserWithProfile | null;
  isUserLoading: boolean;
}

export const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  isUserLoading: true,
});

export const useSupabaseUser = () => useContext(SupabaseUserContext);

// 🌐 Proveedor de usuario Supabase
const SupabaseUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUserWithProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndProfile(sessionUser: any) {
      if (!sessionUser) {
        setUser(null);
        setIsUserLoading(false);
        return;
      }

      setIsUserLoading(true);
      
      const { data: profile, error } = await querySilent(() => supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sessionUser.id)
        .maybeSingle()
      );
      
      if (error || !profile) {
        setUser(sessionUser);
        localStorage.setItem("adminUser", JSON.stringify(sessionUser));
        setIsUserLoading(false);
        return;
      }
      
      const combinedUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      
      // Try to persist to localStorage with error handling
      try {
        localStorage.setItem("adminUser", JSON.stringify(combinedUser));
      } catch (e) {
        // App still works without localStorage
      }

      setIsUserLoading(false);
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (u) {
        fetchUserAndProfile(u);
      } else {
        setUser(null);
        setIsUserLoading(false);
      }
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Error getSession:", err);
      setUser(null);
      setIsUserLoading(false);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        if (u) {
          fetchUserAndProfile(u);
        } else {
          setUser(null);
          setIsUserLoading(false);
        }
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <SupabaseUserContext.Provider value={{ user, isUserLoading }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};

// Garantiza que exista una fila en profiles para el usuario autenticado
async function ensureProfileExists(user: { id: string; email?: string | null; user_metadata?: any }) {
  try {
    // ¿Ya existe?
    const { data: existing, error } = await querySilent(() => supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
    );
    if (error) return;
    if (existing) return; // ya existe
  // ...existing code...
    // Crear perfil mánimo
    const nombreFallback =
      (user.user_metadata?.nombre as string | undefined) ||
      (user.email as string | undefined) ||
      "Scout";
    const telefonoFallback = (user.user_metadata?.telefono as string | undefined) || "";

    await supabase.from("profiles").insert({
      user_id: user.id,
      nombre_completo: nombreFallback,
      telefono: telefonoFallback,
      is_public: false,
      email: user.email ?? null,
      role: "user"
    });
  } catch {
    // No bloquear flujo si falla
  }
}

// Componente que redirige automáticamente al panel de unidad del usuario
function Dashboard() {
  const { session } = useMemberAuth();
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={`/area-miembros/unidades/${session.rama}`} replace />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SupabaseUserProvider>
              <MemberAuthProvider>
              <NotificationsProvider>
              <FondoAnimado />
              <NavegacionPrincipal />
              <NewsPopup />
              <ScrollAlInicio />
              <SaltarAlContenido />
              <BotonVolverGlobal />
              <PageGridBackground>
                <main id="main-content" tabIndex={-1} className="min-h-screen">
                  <Suspense
                    fallback={
                      <div className="flex min-h-screen items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <TransicionRuta>
                      <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/linea-temporal" element={<Navigate to="/historia" replace />} />
                    <Route path="/historia" element={<Historia />} />
                    <Route path="/narrativas" element={<Narrativas />} />
                    <Route path="/bauen" element={<Bauen />} />
                    <Route path="/archivo/am-lagerfeuer" element={<AmLagerfeuer />} />
                    <Route path="/am-lagerfeuer" element={<Navigate to="/archivo/am-lagerfeuer" replace />} />
                    <Route path="/movimiento-scout" element={<MovimientoScout />} />
                    <Route path="/archivo" element={<Archivo />} />
                    <Route path="/archivo/scoutpedia" element={<ArchivoScoutpedia />} />
                    <Route path="/archivo/compania" element={<ArchivoCompania />} />
                    <Route path="/archivo/capsula-del-tiempo" element={<ArchivoCapsulaTiempo />} />
                    <Route path="/cancionero" element={<Cancionero />} />
                    <Route path="/veteranos" element={<AdminGuard><Veteranos /></AdminGuard>} />
                    <Route path="/dirigentes" element={<AdminGuard><Dirigentes /></AdminGuard>} />
                    <Route path="/archivo/locales" element={<Locales />} />
                    <Route path="/locales" element={<Navigate to="/archivo/locales" replace />} />
                    <Route path="/galeria" element={<Galeria />} />
                    <Route path="/contacto" element={<Contacto />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/eventos/jamborees" element={<Jamborees />} />
                    <Route path="/eventos/jamboree-1981" element={<Jamboree1981 />} />
                    <Route path="/eventos/jamboree-2014" element={<Jamboree2014 />} />
                    <Route path="/eventos/jamboree-2023" element={<Jamboree2023 />} />
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
                    <Route
                      path="/perfil-public/:id"
                      element={<PerfilPublic />}
                    />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/mensajes" element={<Mensajes />} />
                    <Route path="/grupos/:id" element={<GrupoDetail />} />
                    <Route path="/dashboard-coordinador" element={<DashboardCoordinador />} />

                    {/* Unidades */}
                    <Route path="/unidades/manada" element={<Manada />} />
                    <Route path="/unidades/tropa" element={<Tropa />} />
                    <Route path="/unidades/pioneros" element={<Pioneros />} />
                    <Route path="/unidades/rovers" element={<Rovers />} />
                    <Route path="/unidades/staff" element={<Staff />} />
                    <Route path="/unidades/comite" element={<Comite />} />

                    {/* Compatibilidad rutas legacy */}
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

                    {/* Admin */}
                    <Route path="/admin-panel" element={<AdminPanel />} />
                    <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
                    {/* Ruta por defecto */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TransicionRuta>
                </Suspense>
                </main>
              </PageGridBackground>
              <PieDePagina />
              </NotificationsProvider>
              </MemberAuthProvider>
            </SupabaseUserProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

