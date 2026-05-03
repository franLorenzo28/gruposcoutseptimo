/**
 * Supabase Client with getUser fix
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("ERROR: Variables de Supabase no configuradas");
  throw new Error("Supabase credentials missing");
}

// Create client without the getUser issue
const _supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Intercept getUser to use getSession instead - avoids "auth session missing" error
const originalGetUser = _supabase.auth.getUser;
Object.defineProperty(_supabase.auth, 'getUser', {
  value: async function(jwt?: string) {
    try {
      const { data: { session } } = await _supabase.auth.getSession();
      return { data: { user: session?.user ?? null }, error: null };
    } catch (e) {
      return { data: { user: null }, error: e };
    };
  },
  writable: false,
  configurable: false,
});

export const supabase = _supabase as unknown as SupabaseClient<any>;

// Helper for safe user retrieval
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}