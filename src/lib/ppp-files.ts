import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PppFile = Database["public"]["Tables"]["ppp_files"]["Row"];
export type PppRama = "pioneros" | "rover";

const bucket = "ppp-files";
const maxBytes = 20 * 1024 * 1024;
const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function listPppFiles(rama: PppRama): Promise<PppFile[]> {
  const { data, error } = await supabase.from("ppp_files").select("*").eq("rama", rama).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPppOwnerNames(ownerIds: string[]): Promise<Record<string, string>> {
  if (!ownerIds.length) return {};
  const { data, error } = await supabase.from("profiles")
    .select("user_id, nombre_completo").in("user_id", ownerIds);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((profile) => [profile.user_id, profile.nombre_completo || "Integrante"]));
}

export async function uploadPppFile(rama: PppRama, file: File): Promise<void> {
  if (!acceptedTypes.has(file.type) || file.size === 0 || file.size > maxBytes) {
    throw new Error("Sube un PDF o una imagen JPG, PNG o WebP de hasta 20 MB.");
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Inicia sesión para subir un archivo.");

  const storagePath = `${user.id}/${rama}/${crypto.randomUUID()}`;
  const { error: storageError } = await supabase.storage.from(bucket).upload(storagePath, file, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const { error: rowError } = await supabase.from("ppp_files").insert({
    owner_id: user.id,
    rama,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (rowError) {
    await supabase.storage.from(bucket).remove([storagePath]);
    throw rowError;
  }
}

export async function getPppDownloadUrl(file: PppFile): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path, 60, {
    download: file.original_filename || true,
  });
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePppFile(file: PppFile): Promise<void> {
  const { error: storageError } = await supabase.storage.from(bucket).remove([file.storage_path]);
  if (storageError) throw storageError;
  const { error: rowError } = await supabase.from("ppp_files").delete().eq("id", file.id);
  if (rowError) throw rowError;
}
