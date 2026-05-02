/**
 * Utility para subir archivos a Supabase Storage
 */

import { supabase } from "@/integrations/supabase/client";

const NARRATIVAS_BUCKET = "narrativas";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Subir imagen a Supabase Storage (narrativas bucket)
 * Retorna la URL pública del archivo
 */
export async function uploadNarrativaImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imagen no debe superar 5MB");
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${timestamp}-${random}.${extension}`;

  const { data, error } = await supabase.storage
    .from(NARRATIVAS_BUCKET)
    .upload(`narrativas/${filename}`, file);

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(NARRATIVAS_BUCKET)
    .getPublicUrl(data.path);

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user?.id) {
    void (supabase as any).from("media_upload_events").insert({
      uploader_id: userData.user.id,
      media_type: "narrativa",
      image_path: data.path,
    });
  }

  return publicData.publicUrl;
}

/**
 * Eliminar imagen de Supabase Storage
 */
export async function deleteNarrativaImage(imageUrl: string): Promise<void> {
  // Extraer path del filename de la URL
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const filepath = `narrativas/${filename}`;

  const { error } = await supabase.storage
    .from(NARRATIVAS_BUCKET)
    .remove([filepath]);

  if (error) {
    console.error("Error al eliminar imagen:", error);
  }
}
