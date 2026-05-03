import { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import { querySilent } from "@/lib/supabase-logger";
import { NotificationsProvider } from "@/context/Notifications";

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

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        setUser(null);
        setAccountStatus(null);
        return;
      }

      const { data: profile } = await querySilent(() => supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sessionUser.id)
        .maybeSingle()
      );

      if (profile) {
        const combinedUser = { ...sessionUser, ...profile } as unknown as SupabaseUserWithProfile;
        setUser(combinedUser);
        setAccountStatus(profile.account_status ?? null);
        try {
          localStorage.setItem("adminUser", JSON.stringify(combinedUser));
        } catch {
          // noop
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error refreshing user:", error);
    }
  };

  async function fetchUserAndProfile(sessionUser: any) {
    if (!sessionUser) {
      setUser(null);
      setAccountStatus(null);
      setIsUserLoading(false);
      return;
    }

    setIsUserLoading(true);
    console.log("DEBUG AppProviders: Fetching profile for user:", sessionUser.id, sessionUser.email);

    const { data: profile, error } = await querySilent(() => supabase
      .from("profiles")
      .select("*")
      .eq("user_id", sessionUser.id)
      .maybeSingle()
    );

    console.log("DEBUG AppProviders: Profile result:", profile, "error:", error);

    if (error || !profile) {
      console.log("DEBUG AppProviders: No profile, treating as activo");
      setUser(sessionUser);
      setAccountStatus('activo');
      localStorage.setItem("adminUser", JSON.stringify(sessionUser));
      setIsUserLoading(false);
      return;
    }

    // Check if user was approved via Edge Function (metadata takes precedence)
    const meta = sessionUser.user_metadata as Record<string, unknown> | undefined;
    const approvedViaEdgeFunction = meta?.approved_at !== undefined && meta?.profile_complete === true;

    if (approvedViaEdgeFunction) {
      console.log("DEBUG AppProviders: User approved via Edge Function, bypassing profile status check");
      const combinedUser = { ...sessionUser };
      setUser(combinedUser);
      setAccountStatus('activo');
      setIsUserLoading(false);
      return;
    }

    // Ensure status is always a valid value
    const status = (profile.account_status && profile.account_status.trim() !== '') 
      ? profile.account_status 
      : 'activo';
    console.log("DEBUG AppProviders: Account status:", status, "raw:", profile.account_status);
    setAccountStatus(status);

    // Block access if not approved
    if (status !== 'activo') {
      console.log("DEBUG AppProviders: Status is not activo, signing out:", status);
      // User is pending or rejected - sign them out
      await supabase.auth.signOut();
      setUser(null);
      setAccountStatus(status);
      setIsUserLoading(false);
      // Store pending status so we can show a message
      localStorage.setItem("pendingAccountStatus", status);
      localStorage.setItem("pendingUserName", profile.nombre_completo || sessionUser.email || "Usuario");
      return;
    }

    console.log("DEBUG AppProviders: User approved, setting user");
    const combinedUser = { ...sessionUser, ...profile };
    setUser(combinedUser);

    try {
      localStorage.setItem("adminUser", JSON.stringify(combinedUser));
    } catch {
      // App still works without localStorage
    }

    setIsUserLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (u) {
        fetchUserAndProfile(u);
      } else {
        setUser(null);
        setAccountStatus(null);
        setIsUserLoading(false);
      }
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Error getSession:", err);
      setUser(null);
      setAccountStatus(null);
      setIsUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        if (u) {
          fetchUserAndProfile(u);
        } else {
          setUser(null);
          setAccountStatus(null);
          setIsUserLoading(false);
        }
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
