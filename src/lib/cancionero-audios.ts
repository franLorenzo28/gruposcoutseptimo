import { supabase } from "@/integrations/supabase/client";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

const BUCKET_NAME = "cancionero-audios";

function toDisplayAudioName(storagePath: string): string {
  const fileName = storagePath.split("/").pop() ?? storagePath;
  // Los uploads se guardan como "timestamp-nombre.ext"; limpiamos solo el prefijo tecnico.
  return fileName.replace(/^\d{10,}-/, "");
}

export type CancioneroAudio = {
  name: string;
  path: string;
  url: string;
  createdAt: string | null;
};

export async function listCancioneroAudios(): Promise<CancioneroAudio[]> {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list("", {
      sortBy: { column: "name", order: "desc" },
    });

  if (error) throw error;
  if (!files || files.length === 0) return [];

  return files
    .filter((file) => file.name !== ".emptyFolderPlaceholder")
    .map((file) => {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
      return {
        name: toDisplayAudioName(file.name),
        path: file.name,
        url: data.publicUrl,
        createdAt: file.created_at ?? null,
      };
    });
}

export async function uploadCancioneroAudio(file: File): Promise<void> {
  await ensureAdminForMediaUpload();

  if (!file.type.startsWith("audio/")) {
    throw new Error("Solo se permiten archivos de audio");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;
}

export async function deleteCancioneroAudio(path: string): Promise<void> {
  await ensureAdminForMediaUpload();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;
}
