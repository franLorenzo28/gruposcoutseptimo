import { Navigate, useLocation } from "react-router-dom";
import { useMemberAuth } from "@/context/MemberAuthContext";

export default function RequireMemberAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isCheckingAuth } = useMemberAuth();
  const location = useLocation();

  if (isCheckingAuth) {
    return <div className="p-8 text-center text-muted-foreground">Validando sesión interna...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
