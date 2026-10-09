import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
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
