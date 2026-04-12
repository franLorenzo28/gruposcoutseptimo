import { Navigate } from "react-router-dom";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";

export default function RequireRamaAccess({
  allowedRama,
  children,
}: {
  allowedRama: MiembroRama;
  children: React.ReactNode;
}) {
  const { isAuthenticated, session, isCheckingAuth } = useMemberAuth();

  if (isCheckingAuth) {
    return <div className="p-8 text-center text-muted-foreground">Validando acceso de unidad...</div>;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  const allowedRamas = session.allowedRamas?.length
    ? session.allowedRamas
    : [session.rama];

  if (!allowedRamas.includes(allowedRama)) {
    return (
      <Navigate
        to={`/area-miembros/unidades/${session.rama}?acceso=denegado`}
        replace
      />
    );
  }

  return <>{children}</>;
}
