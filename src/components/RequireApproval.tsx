import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseUser } from "@/providers/AppProviders";
import PendingApprovalScreen from "@/components/PendingApprovalScreen";

export default function RequireApproval({ children }: { children: React.ReactNode }) {
  const { user, accountStatus, isUserLoading } = useSupabaseUser();
  const location = useLocation();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/interno/auth" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  // Only the provider's profile status grants access. Browser storage and
  // user-editable metadata must never override it, including missing status.
  if (accountStatus !== "activo") {
    return <PendingApprovalScreen userName={user.nombre_completo || user.email} status={accountStatus} />;
  }

  return <>{children}</>;
}
