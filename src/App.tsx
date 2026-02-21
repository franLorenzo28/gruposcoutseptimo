import {
  useEffect,
  useState,
  createContext,
  useContext,
  Suspense,
  lazy,
} from "react";
import NavigationNew from "@/components/NavigationNew";
import FooterNew from "@/components/FooterNew";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// ...existing code...
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import RouteTransition from "@/components/RouteTransition";
import Index from "./pages/Index";
const LineaTemporal = lazy(() => import("./pages/LineaTemporal"));
const Historia = lazy(() => import("./pages/Historia.tsx"));
const Bauen = lazy(() => import("./pages/Bauen"));
const AmLagerfeuer = lazy(() => import("./pages/AmLagerfeuer"));
const MovimientoScout = lazy(() => import("./pages/MovimientoScout"));
const Archivo = lazy(() => import("./pages/Archivo.tsx"));
const ArchivoScoutpedia = lazy(() => import("./pages/archivo/Scoutpedia"));
const ArchivoCompania = lazy(() => import("./pages/archivo/Compania"));
const ArchivoMiembros = lazy(() => import("./pages/archivo/Miembros"));
const Galeria = lazy(() => import("./pages/Galeria"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Eventos = lazy(() => import("./pages/Eventos"));
const Auth = lazy(() => import("./pages/Auth"));
const Perfil = lazy(() => import("./pages/Perfil"));
const PerfilView = lazy(() => import("./pages/PerfilView"));
const PerfilCompartir = lazy(() => import("./pages/PerfilCompartir"));
const PerfilPublic = lazy(() => import("./pages/PerfilPublic"));
const VerificarEmail = lazy(() => import("./pages/VerificarEmail"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Mensajes = lazy(() => import("./pages/Mensajes"));
const GrupoDetail = lazy(() => import("@/pages/GrupoDetail"));
const DashboardCoordinador = lazy(() => import("./pages/DashboardCoordinador"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Manada = lazy(() => import("./pages/ramas/manada"));
const Tropa = lazy(() => import("./pages/ramas/tropa"));
const Pioneros = lazy(() => import("./pages/ramas/pioneros"));
const Rovers = lazy(() => import("./pages/ramas/rovers"));
const Staff = lazy(() => import("./pages/ramas/staff"));
const Comite = lazy(() => import("./pages/ramas/comite"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
import { supabase } from "@/integrations/supabase/client";
import BackgroundFX from "@/components/BackgroundFX";
import { NotificationsProvider } from "@/context/Notifications";
import { LoadingMessage } from "@/components/ui/loading";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AdminGuard } from "@/components/AdminGuard";
import SkipToContent from "@/components/SkipToContent";

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

//  Contexto global de usuario Supabase
interface SupabaseUserContextType {
  user: any | null;
}

export const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
});

export const useSupabaseUser = () => useContext(SupabaseUserContext);

// 🌐 Proveedor de usuario Supabase
const SupabaseUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    async function fetchUserAndProfile(sessionUser: any) {
      console.log("🔍 fetchUserAndProfile llamado");
      
      if (!sessionUser) {
        console.log("❌ Sin usuario");
        setUser(null);
        return;
      }
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sessionUser.id)
        .maybeSingle();
      
      console.log("📊 Perfil obtenido");
      
      if (error || !profile) {
        console.log("⚠️  Sin perfil");
        setUser(sessionUser);
        localStorage.setItem("adminUser", JSON.stringify(sessionUser));
        return;
      }
      
      const combinedUser = { ...sessionUser, ...profile };
      console.log("✅ Usuario guardado:", combinedUser?.email, "Rol:", (combinedUser as any)?.role);
      setUser(combinedUser);
      localStorage.setItem("adminUser", JSON.stringify(combinedUser));
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      console.log("📍 Sesión obtenida:", u?.email);
      if (u) fetchUserAndProfile(u);
    }).catch(err => {
      console.error("❌ Error getSession:", err);
    });

    // Escuchar cambios de auth
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        console.log(`📨 Auth change: ${event}`);
        if (u) fetchUserAndProfile(u);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseUserContext.Provider value={{ user }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};

// Garantiza que exista una fila en profiles para el usuario autenticado
async function ensureProfileExists(user: { id: string; email?: string | null; user_metadata?: any }) {
  try {
    // ¿Ya existe?
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SupabaseUserProvider>
              <NotificationsProvider>
              <BackgroundFX />
              <NavigationNew />
              <ScrollToTop />
              <SkipToContent />
              <Suspense fallback={<LoadingMessage message="Cargando página..." />}>
                <RouteTransition>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/linea-temporal" element={<LineaTemporal />} />
                    <Route path="/historia" element={<Historia />} />
                    <Route path="/bauen" element={<Bauen />} />
                    <Route path="/am-lagerfeuer" element={<AmLagerfeuer />} />
                    <Route path="/movimiento-scout" element={<MovimientoScout />} />
                    <Route path="/archivo" element={<Archivo />} />
                    <Route path="/archivo/scoutpedia" element={<ArchivoScoutpedia />} />
                    <Route path="/archivo/compania" element={<ArchivoCompania />} />
                    <Route path="/archivo/miembros" element={<ArchivoMiembros />} />
                    <Route path="/galeria" element={<Galeria />} />
                    <Route path="/contacto" element={<Contacto />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/verificar-email" element={<VerificarEmail />} />
                    <Route path="/perfil" element={<PerfilView />} />
                    <Route path="/perfil/editar" element={<Perfil />} />
                    <Route
                      path="/perfil/compartir"
                      element={<PerfilCompartir />}
                    />
                    <Route
                      path="/perfil-public/:id"
                      element={<PerfilPublic />}
                    />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/mensajes" element={<Mensajes />} />
                    <Route path="/grupos/:id" element={<GrupoDetail />} />
                    <Route path="/dashboard-coordinador" element={<DashboardCoordinador />} />

                    {/* Ramas */}
                    <Route path="/ramas/manada" element={<Manada />} />
                    <Route path="/ramas/tropa" element={<Tropa />} />
                    <Route path="/ramas/pioneros" element={<Pioneros />} />
                    <Route path="/ramas/rovers" element={<Rovers />} />
                    <Route path="/ramas/staff" element={<Staff />} />
                    <Route path="/ramas/comite" element={<Comite />} />

                    {/* Admin */}
                    <Route path="/admin-panel" element={<AdminPanel />} />
                    <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
                    {/* Ruta por defecto */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RouteTransition>
              </Suspense>
              <FooterNew />
              </NotificationsProvider>
            </SupabaseUserProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

