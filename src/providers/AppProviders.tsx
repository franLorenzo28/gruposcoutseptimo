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
  refreshUser: () => Promise<void>;
}

export const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  isUserLoading: true,
  refreshUser: async () => {},
});

export const useSupabaseUser = () => useContext(SupabaseUserContext);

const SupabaseUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUserWithProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        setUser(null);
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
        setIsUserLoading(false);
      }
    }).catch((err) => {
      if (import.meta.env.DEV) console.error("Error getSession:", err);
      setUser(null);
      setIsUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
    <SupabaseUserContext.Provider value={{ user, isUserLoading, refreshUser }}>
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
