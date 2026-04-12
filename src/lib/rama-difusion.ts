import { apiFetch, isLocalBackend } from "@/lib/backend";
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
  if (!isLocalBackend()) {
    return [];
  }

  const rows = await apiFetch(`/unidades/${rama}/difusion`);
  return rows as RamaBroadcastMessage[];
}

export async function publishRamaBroadcast(
  rama: MiembroRama,
  content: string,
): Promise<RamaBroadcastMessage> {
  if (!isLocalBackend()) {
    throw new Error(
      "Canal de difusión disponible solo en backend local por el momento.",
    );
  }

  const row = await apiFetch(`/unidades/${rama}/difusion`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  return row as RamaBroadcastMessage;
}
