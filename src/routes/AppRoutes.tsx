import { Suspense, useEffect, useState } from "react";
import { useRoutes } from "react-router-dom";
import PendingApprovalScreen from "@/components/PendingApprovalScreen";
import PageLoader from "@/components/ui/PageLoader";
import { MemberAuthProvider } from "@/context/MemberAuthContext";
import { useGlobalPresenceHeartbeat } from "@/hooks/useGlobalPresenceHeartbeat";
import { useSupabaseUser } from "@/providers/AppProviders";
import { adminRoutes } from "@/app/routes/admin-routes";
import { compatibilityRoutes } from "@/app/routes/compatibility-routes";
import { internalRoutes } from "@/app/routes/internal-routes";
import { NotFound } from "@/app/routes/lazy-pages";
import { publicRoutes } from "@/app/routes/public-routes";

function GlobalPresenceHeartbeat() {
  const { user } = useSupabaseUser();
  useGlobalPresenceHeartbeat(user?.id);
  return null;
}

function AppRouteTree() {
  return useRoutes([
    publicRoutes,
    internalRoutes,
    adminRoutes,
    ...compatibilityRoutes,
    { path: "*", element: <NotFound /> },
  ]);
}

function AppContent() {
  const { user, accountStatus, isUserLoading } = useSupabaseUser();
  const [pendingInfo, setPendingInfo] = useState<{ name: string; status: string } | null>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;

    if (accountStatus && accountStatus !== "activo") {
      const name = localStorage.getItem("pendingUserName") || user.email || "Usuario";
      setPendingInfo({ name, status: accountStatus });
    } else {
      localStorage.removeItem("pendingAccountStatus");
      localStorage.removeItem("pendingUserName");
    }
  }, [user, accountStatus, isUserLoading]);

  if (pendingInfo) {
    return <PendingApprovalScreen userName={pendingInfo.name} status={pendingInfo.status} />;
  }

  return (
    <>
      <GlobalPresenceHeartbeat />
      <MemberAuthProvider>
        <Suspense fallback={<PageLoader message="Cargando seccion..." />}>
          <AppRouteTree />
        </Suspense>
      </MemberAuthProvider>
    </>
  );
}

export function AppRoutes() {
  return <AppContent />;
}
