import { createContext, useContext } from "react";
import type { AdminAccess } from "@/lib/admin-permissions";

export const AdminAccessContext = createContext<AdminAccess | null>(null);

export function useAdminAccess(): AdminAccess {
  const access = useContext(AdminAccessContext);
  if (!access) throw new Error("El panel administrativo requiere AdminGuard.");
  return access;
}
