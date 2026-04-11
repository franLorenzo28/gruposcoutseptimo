/**
 * Supabase Client - Solo Cliente Real (Sin Mock)
 * Este archivo reemplaza completamente el anterior para evitar problemas
 * Cliente de Supabase para la app.
 */

import { createClient } from "@supabase/supabase-js";
// Configuración directa desde variables de entorno
import type { Database } from "./types";

// Usar directamente las variables de entorno
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("ERROR: Variables de Supabase no configuradas");
  throw new Error("Supabase credentials missing");
}

export const supabase = createClient<Database>(url, key);

if (import.meta.env.DEV) {
  console.log("Cliente de Supabase inicializado correctamente");
}

export type { Database };

