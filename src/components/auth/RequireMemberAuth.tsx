import { Navigate, useLocation } from "react-router-dom";
import { useMemberAuth } from "@/context/MemberAuthContext";

export default function RequireMemberAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useMemberAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
