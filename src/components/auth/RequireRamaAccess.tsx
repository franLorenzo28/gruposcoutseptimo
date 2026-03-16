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
  const { isAuthenticated, session } = useMemberAuth();

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  if (session.rama !== allowedRama) {
    return (
      <Navigate
        to={`/area-miembros/ramas/${session.rama}?acceso=denegado`}
        replace
      />
    );
  }

  return <>{children}</>;
}
