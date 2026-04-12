import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearMemberSession,
  getStoredMemberSession,
  saveMemberSession,
  type MemberAccessType,
  type MemberSession,
  type MiembroRama,
} from "@/lib/member-auth";
import { getAuthUser } from "@/lib/backend";

interface LoginPayload {
  authUserId: string;
  nombre: string;
  rama: MiembroRama;
  allowedRamas: MiembroRama[];
  isRamaAdmin: boolean;
  accessType: MemberAccessType;
}

interface MemberAuthContextValue {
  session: MemberSession | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
}

const MemberAuthContext = createContext<MemberAuthContextValue | undefined>(
  undefined,
);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MemberSession | null>(() =>
    getStoredMemberSession(),
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const authUser = await getAuthUser();
        if (!active) return;

        if (!authUser?.id) {
          clearMemberSession();
          setSession(null);
          setIsCheckingAuth(false);
          return;
        }

        setSession((prev) => {
          if (!prev) return prev;
          if (prev.authUserId !== authUser.id) {
            clearMemberSession();
            return null;
          }
          return prev;
        });
      } catch {
        if (!active) return;
        clearMemberSession();
        setSession(null);
      } finally {
        if (active) {
          setIsCheckingAuth(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = ({ authUserId, nombre, rama, allowedRamas, isRamaAdmin, accessType }: LoginPayload) => {
    const cleanName = nombre.trim();
    const nextSession: MemberSession = {
      authUserId,
      nombre: cleanName,
      rama,
      allowedRamas: allowedRamas.length > 0 ? allowedRamas : [rama],
      isRamaAdmin,
      accessType,
      loggedAt: new Date().toISOString(),
    };
    saveMemberSession(nextSession);
    setSession(nextSession);
  };

  const logout = () => {
    clearMemberSession();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      isCheckingAuth,
      login,
      logout,
    }),
    [isCheckingAuth, session],
  );

  return (
    <MemberAuthContext.Provider value={value}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (!context) {
    throw new Error("useMemberAuth debe usarse dentro de MemberAuthProvider");
  }
  return context;
}
