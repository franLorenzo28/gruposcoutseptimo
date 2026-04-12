import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/useUser.tsx";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>;
  }

  const adminEmails = (import.meta.env.VITE_GALLERY_ADMIN_EMAILS || "")
    .split(",")
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);

  const email = user?.email?.toLowerCase();
  const appRole =
    user && "role" in user && typeof user.role === "string"
      ? user.role.toLowerCase()
      : "";
  const rolAdulto =
    user && "rol_adulto" in user && typeof user.rol_adulto === "string"
      ? user.rol_adulto.toLowerCase()
      : undefined;
  const isAdmin =
    appRole === "admin" ||
    appRole === "mod" ||
    rolAdulto === "admin" ||
    rolAdulto === "mod" ||
    (!!email && adminEmails.includes(email));

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
