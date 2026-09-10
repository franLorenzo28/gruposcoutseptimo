import { Suspense } from "react";
import { useLocation, useRoutes } from "react-router-dom";
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
  const { pathname } = useLocation();
  // Registration and recovery must remain reachable before account approval.
  const isAuthRoute = /^\/(?:interno\/(?:auth(?:\/callback)?|login|restablecer-password)|auth(?:\/callback)?|login|verificar-email)\/?$/i.test(pathname);

  if (!isAuthRoute && user && isUserLoading) {
    return <PageLoader message="Verificando acceso..." />;
  }

  if (!isAuthRoute && user && accountStatus && accountStatus !== "activo") {
    return <PendingApprovalScreen userName={user.nombre_completo || user.email} status={accountStatus} />;
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
