import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import { querySilent } from "@/lib/supabase-logger";
import { NotificationsProvider } from "@/context/Notifications";
import { apiFetch, getAuthUser, isLocalBackend, LOCAL_AUTH_CHANGED_EVENT, resetLocalBackendAuth } from "@/lib/backend";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

type SupabaseUserWithProfile = User & {
  profile?: Partial<Profile>;
} & Partial<Profile>;

interface SupabaseUserContextType {
  user: SupabaseUserWithProfile | null;
  isUserLoading: boolean;
  accountStatus: string | null;
  refreshUser: () => Promise<void>;
}

export const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  isUserLoading: true,
  accountStatus: null,
  refreshUser: async () => {},
});

export const useSupabaseUser = () => useContext(SupabaseUserContext);

const SupabaseUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUserWithProfile | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const requestId = useRef(0);

  const fetchUserAndProfile = useCallback(async (sessionUser: User | null) => {
    const currentRequest = ++requestId.current;
    if (!sessionUser) {
      setUser(null);
      localStorage.removeItem("adminUser");
      setAccountStatus(null);
      setIsUserLoading(false);
      return;
    }

    setIsUserLoading(true);

    const { data: profile, error } = await querySilent(() => supabase
      .from("profiles")
      .select("*")
      .eq("user_id", sessionUser.id)
      .maybeSingle()
    ).catch((error: unknown) => ({ data: null, error }));

    if (currentRequest !== requestId.current) return;

    if (error || !profile) {
      // No asumir acceso activo cuando falta el perfil o la consulta falla.
      // La autorización debe ser fail-closed hasta poder comprobar el estado.
      setUser(sessionUser);
      setAccountStatus("pendiente_aprobacion");
      try {
        localStorage.setItem("pendingAccountStatus", "pendiente_aprobacion");
        localStorage.setItem("pendingUserName", sessionUser.email || "Usuario");
      } catch {
        // App still works when storage is unavailable.
      }
      setIsUserLoading(false);
      return;
    }

    // Ensure status is always a valid value
    const status = (profile.account_status && profile.account_status.trim() !== '') 
      ? profile.account_status 
      : 'pendiente_aprobacion';
    setAccountStatus(status);

    // Block access if not approved
    if (status !== 'activo') {
      // Mantener OAuth para completar el registro; los guards comprueban el estado.
      setUser({ ...profile, ...sessionUser });
      localStorage.removeItem("adminUser");
      setAccountStatus(status);
      setIsUserLoading(false);
      // Store pending status so we can show a message
      localStorage.setItem("pendingAccountStatus", status);
      localStorage.setItem("pendingUserName", profile.nombre_completo || sessionUser.email || "Usuario");
      return;
    }

    const combinedUser = { ...profile, ...sessionUser };
    setUser(combinedUser);

    try {
      localStorage.removeItem("pendingAccountStatus");
      localStorage.removeItem("pendingUserName");
      localStorage.setItem("adminUser", JSON.stringify(combinedUser));
    } catch {
      // App still works without localStorage
    }

    setIsUserLoading(false);
  }, []);

  const fetchLocalUser = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsUserLoading(true);

    try {
      const authUser = await getAuthUser();
      if (!authUser) {
        setUser(null);
        setAccountStatus(null);
        return;
      }

      const profile = await apiFetch<Record<string, unknown>>("/v1/me/profile");
      if (currentRequest !== requestId.current) return;

      const status = typeof profile.account_status === "string"
        ? profile.account_status
        : "activo";
      const combinedUser = { ...profile, ...authUser } as unknown as SupabaseUserWithProfile;
      setAccountStatus(status);

      if (status !== "activo") {
        resetLocalBackendAuth();
        setUser(null);
        try {
          localStorage.setItem("pendingAccountStatus", status);
          localStorage.setItem("pendingUserName", String(profile.nombre_completo || authUser.email || "Usuario"));
        } catch {
          // App still works without localStorage.
        }
        return;
      }

      setUser(combinedUser);
      try {
        localStorage.setItem("adminUser", JSON.stringify(combinedUser));
      } catch {
        // App still works without localStorage.
      }
    } catch {
      setUser(null);
      setAccountStatus(null);
    } finally {
      if (currentRequest === requestId.current) setIsUserLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (isLocalBackend()) {
      await fetchLocalUser();
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserAndProfile(session?.user ?? null);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error refreshing user:", error);
    }
  }, [fetchLocalUser, fetchUserAndProfile]);

  useEffect(() => {
    if (isLocalBackend()) {
      void fetchLocalUser();
      const handleLocalAuthChange = () => { void fetchLocalUser(); };
      window.addEventListener(LOCAL_AUTH_CHANGED_EVENT, handleLocalAuthChange);
      return () => window.removeEventListener(LOCAL_AUTH_CHANGED_EVENT, handleLocalAuthChange);
    }

    let active = true;
    let authEventReceived = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loadUser = (sessionUser: User | null) => {
      void fetchUserAndProfile(sessionUser).catch(() => {
        if (!active) return;
        setUser(null);
        setAccountStatus(null);
        setIsUserLoading(false);
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authEventReceived = true;
        ++requestId.current; // Invalidar consultas anteriores, incluso al salir.
        clearTimeout(timer);
        // No consultar Supabase dentro de su callback de autenticación.
        timer = setTimeout(() => { if (active) loadUser(session?.user ?? null); }, 0);
      },
    );
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !authEventReceived) loadUser(session?.user ?? null);
    }).catch(() => {
      if (active && !authEventReceived) loadUser(null);
    });

    return () => {
      active = false;
      ++requestId.current;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [fetchLocalUser, fetchUserAndProfile]);

  return (
    <SupabaseUserContext.Provider value={{ user, isUserLoading, accountStatus, refreshUser }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <SupabaseUserProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </SupabaseUserProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
