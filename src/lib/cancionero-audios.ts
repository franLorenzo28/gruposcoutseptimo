import { supabase } from "@/integrations/supabase/client";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

const BUCKET_NAME = "cancionero-audios";

async function requireCancioneroSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesion para acceder al cancionero");
  }

  return user;
}

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
  await requireCancioneroSession();

  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list("", {
      sortBy: { column: "name", order: "desc" },
    });

  if (error) throw error;
  if (!files || files.length === 0) return [];

  const signedFiles = await Promise.all(
    files
      .filter((file) => file.name !== ".emptyFolderPlaceholder")
      .map(async (file) => {
        const { data, error: signedError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.name, 60 * 60);

        if (signedError || !data?.signedUrl) return null;

        return {
          name: toDisplayAudioName(file.name),
          path: file.name,
          url: data.signedUrl,
          createdAt: file.created_at ?? null,
        };
      }),
  );

  return signedFiles.filter(
    (file): file is CancioneroAudio => file !== null,
  );
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
