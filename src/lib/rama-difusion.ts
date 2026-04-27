import { apiFetch, isLocalBackend } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";
import type { MiembroRama } from "@/lib/member-auth";

export interface RamaBroadcastMessage {
  id: string;
  rama: MiembroRama;
  author_id: string;
  content: string;
  created_at: string;
  nombre_completo: string | null;
  username: string | null;
  avatar_url: string | null;
}

export async function listRamaBroadcast(
  rama: MiembroRama,
): Promise<RamaBroadcastMessage[]> {
  if (isLocalBackend()) {
    const rows = await apiFetch(`/unidades/${rama}/difusion`);
    return rows as RamaBroadcastMessage[];
  }

  const { data: rows, error } = await (supabase as any)
    .from("rama_broadcast_messages")
    .select("id, rama, author_id, content, created_at")
    .eq("rama", rama)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message || "No se pudo cargar difusion.");
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const authorIds = Array.from(
    new Set(
      safeRows
        .map((row: any) => String(row?.author_id || ""))
        .filter(Boolean),
    ),
  );

  let profilesByUserId = new Map<string, any>();
  if (authorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("user_id, nombre_completo, username, avatar_url")
      .in("user_id", authorIds);

    profilesByUserId = new Map(
      (profiles || []).map((profile: any) => [String(profile.user_id), profile]),
    );
  }

  return safeRows.map((row: any) => {
    const profile = profilesByUserId.get(String(row.author_id));
    return {
      id: String(row.id),
      rama: row.rama as MiembroRama,
      author_id: String(row.author_id),
      content: String(row.content || ""),
      created_at: String(row.created_at),
      nombre_completo: profile?.nombre_completo ?? null,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
    } satisfies RamaBroadcastMessage;
  });
}

export async function publishRamaBroadcast(
  rama: MiembroRama,
  content: string,
): Promise<RamaBroadcastMessage> {
  if (isLocalBackend()) {
    const row = await apiFetch(`/unidades/${rama}/difusion`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    return row as RamaBroadcastMessage;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    throw new Error("Debes iniciar sesion para publicar difusion.");
  }

  const { data: inserted, error } = await (supabase as any)
    .from("rama_broadcast_messages")
    .insert({
      rama,
      author_id: user.id,
      content,
    })
    .select("id, rama, author_id, content, created_at")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "No se pudo enviar el mensaje.");
  }

  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("nombre_completo, username, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: String(inserted.id),
    rama: inserted.rama as MiembroRama,
    author_id: String(inserted.author_id),
    content: String(inserted.content || ""),
    created_at: String(inserted.created_at),
    nombre_completo: profile?.nombre_completo ?? null,
    username: profile?.username ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
}
