import { createContext, useContext, useMemo, useState } from "react";
import {
  clearMemberSession,
  getStoredMemberSession,
  saveMemberSession,
  type MemberSession,
  type MiembroRama,
} from "@/lib/member-auth";

interface LoginPayload {
  nombre: string;
  rama: MiembroRama;
}

interface MemberAuthContextValue {
  session: MemberSession | null;
  isAuthenticated: boolean;
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

  const login = ({ nombre, rama }: LoginPayload) => {
    const cleanName = nombre.trim();
    const nextSession: MemberSession = {
      nombre: cleanName,
      rama,
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
      login,
      logout,
    }),
    [session],
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
