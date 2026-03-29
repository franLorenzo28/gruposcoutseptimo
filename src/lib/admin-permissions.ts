import { supabase } from "@/integrations/supabase/client";
import { apiFetch, ensureLocalToken, isLocalBackend } from "@/lib/backend";

const ADMIN_UPLOAD_ERROR = "Solo los usuarios admin pueden subir archivos multimedia";

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (isLocalBackend()) {
    try {
      await ensureLocalToken();
      const me = (await apiFetch("/profiles/me")) as {
        rol_adulto?: string | null;
        role?: string | null;
      };
      return me?.rol_adulto === "admin" || me?.role === "admin";
    } catch {
      return false;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("rol_adulto")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return profile?.rol_adulto === "admin";
}

export async function ensureAdminForMediaUpload(): Promise<void> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error(ADMIN_UPLOAD_ERROR);
  }
}
