import { useContext } from "react";
import { SupabaseUserContext } from "@/providers/AppProviders";

export function useUser() {
  const context = useContext(SupabaseUserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de SupabaseUserProvider");
  }
  return context;
}
