import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/providers/AppProviders";
import PendingApprovalScreen from "@/components/PendingApprovalScreen";

type RequireApprovalProps = {
  children: React.ReactNode;
};

export default function RequireApproval({ children }: RequireApprovalProps) {
  const { user, accountStatus, isUserLoading } = useSupabaseUser();
  const [checking, setChecking] = useState(true);
  const [pendingName, setPendingName] = useState<string>("");

  useEffect(() => {
    if (isUserLoading) return;

    // If no user, they're not logged in - let the route handle it
    if (!user) {
      setChecking(false);
      return;
    }

    // If account status is known and not approved, show pending screen
    if (accountStatus && accountStatus !== "activo") {
      const name = localStorage.getItem("pendingUserName") || user.email || "Usuario";
      setPendingName(name);
      setChecking(false);
      return;
    }

    // If accountStatus is null (no profile yet), check Supabase directly
    if (!accountStatus) {
      const checkProfile = async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_status, nombre_completo")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile && profile.account_status && profile.account_status !== "activo") {
            setPendingName(profile.nombre_completo || user.email || "Usuario");
            localStorage.setItem("pendingAccountStatus", profile.account_status);
            localStorage.setItem("pendingUserName", profile.nombre_completo || user.email || "Usuario");
          }
        } catch {
          // Ignore errors
        }
        setChecking(false);
      };
      void checkProfile();
      return;
    }

    setChecking(false);
  }, [user, accountStatus, isUserLoading]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If pending/rejected, show approval screen
  const storedStatus = localStorage.getItem("pendingAccountStatus") || accountStatus;
  if (storedStatus && storedStatus !== "activo") {
    return <PendingApprovalScreen userName={pendingName} status={storedStatus} />;
  }

  return <>{children}</>;
}
