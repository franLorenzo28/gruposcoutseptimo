import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearMemberSession,
  getStoredMemberSession,
  saveMemberSession,
  type MemberAccessType,
  type MemberSession,
  type MiembroRama,
} from "@/lib/member-auth";
import { getAuthUser, LOCAL_AUTH_CHANGED_EVENT } from "@/lib/backend";
import { getProfile } from "@/lib/api";
import { resolveMemberAccessFromProfile } from "@/lib/member-auth";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend } from "@/lib/backend";

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
    let requestId = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkAuth = async () => {
      if (!active) return;
      const currentRequest = ++requestId;
      const isCurrent = () => active && currentRequest === requestId;
      setIsCheckingAuth(true);
      try {
        const authUser = await getAuthUser();
        if (!isCurrent()) return;

        if (!authUser?.id || (!authUser.isLocal && authUser.account_status !== "activo")) {
          clearMemberSession();
          if (active) {
            setSession(null);
            setIsCheckingAuth(false);
          }
          return;
        }

        const storedSession = getStoredMemberSession();
        
        if (!storedSession || storedSession.authUserId !== authUser.id) {
          // Si no hay sesion de miembro o no coincide con authUser, intentamos autologuear
          try {
            const profile = await getProfile(authUser.id).catch(() => null);
            if (!isCurrent()) return;
            if (profile && profile.nombre_completo) {
              const access = resolveMemberAccessFromProfile({
                edad: (profile as any).edad,
                rol_adulto: profile.rol_adulto,
                rama_que_educa: profile.rama_que_educa,
                educador_aprobado: (profile as any).educador_aprobado,
                seisena: profile.seisena,
                patrulla: profile.patrulla,
                equipo_pioneros: profile.equipo_pioneros,
                comunidad_rovers: profile.comunidad_rovers,
              });

              if (access.allowed && access.rama && access.accessType) {
                const newSession: MemberSession = {
                  authUserId: authUser.id,
                  nombre: String(profile.nombre_completo || "").trim(),
                  rama: access.rama,
                  allowedRamas: access.allowedRamas.length > 0 ? access.allowedRamas : [access.rama],
                  isRamaAdmin: access.isRamaAdmin,
                  accessType: access.accessType,
                  loggedAt: new Date().toISOString(),
                };
                saveMemberSession(newSession);
                if (active) setSession(newSession);
              } else {
                clearMemberSession();
                if (active) setSession(null);
              }
            } else {
              clearMemberSession();
              if (active) setSession(null);
            }
          } catch {
            if (!isCurrent()) return;
            clearMemberSession();
            if (active) setSession(null);
          }
        } else {
          // Ya hay sesión válida
          if (active) setSession(storedSession);
        }
      } catch {
        if (!active) return;
      } finally {
        if (isCurrent()) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    if (isLocalBackend()) {
      const handleLocalAuthChange = () => { void checkAuth(); };
      window.addEventListener(LOCAL_AUTH_CHANGED_EVENT, handleLocalAuthChange);
      return () => {
        active = false;
        window.removeEventListener(LOCAL_AUTH_CHANGED_EVENT, handleLocalAuthChange);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      ++requestId;
      setIsCheckingAuth(true);
      clearTimeout(timer);
      timer = setTimeout(() => { void checkAuth(); }, 0);
    });

    return () => {
      active = false;
      ++requestId;
      clearTimeout(timer);
      subscription.unsubscribe();
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
