import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

export type GalleryAlbum = { name: string; coverUrl?: string };

const BUCKET = "gallery"; // Asegúrate de crear este bucket en Supabase Storage

async function requireGallerySession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesion para acceder a la galeria");
  }

  return user;
}

export async function listAlbums(): Promise<GalleryAlbum[]> {
  try {
    if (isLocalBackend()) {
      const rows = (await apiFetch("/gallery/albums")) as Array<{
        name: string;
      }>;
      return rows.map((r) => ({ name: r.name }));
    }
    await requireGallerySession();

    // En Supabase Storage, necesitamos listar archivos para detectar carpetas
    // Usamos list() sin path para obtener el contenido de la raíz
    const { data, error } = await supabase.storage.from(BUCKET).list();

    if (error) {
      console.error("Error listing storage:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // En Supabase, las carpetas aparecen como items con id null o metadata específico
    // Filtramos solo las carpetas (que no tienen extensión y pueden tener id null)
    const folders = data.filter((item: any) => {
      // Una carpeta típicamente no tiene extensión de archivo
      const hasNoExtension = !item.name.includes(".");
      return hasNoExtension && item.name !== ".emptyFolderPlaceholder";
    });

    return folders.map((folder: any) => ({
      name: folder.name.replace(/\/$/, ""), // Remover slash final si existe
    }));
  } catch (error) {
    console.error("Error listing albums:", error);
    return [];
  }
}

/** List metadata without generating signed URLs. Storage policies still apply. */
export async function listImagePaths(album: string): Promise<string[]> {
  if (isLocalBackend()) {
    const rows = await apiFetch<Array<{ path: string }>>(
      `/gallery/albums/${encodeURIComponent(album)}/images`,
    );
    return rows.map(row => row.path);
  }
  await requireGallerySession();
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET)
      .list(album, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    const entries = data || [];
    for (const entry of entries) {
      if (!entry.name.startsWith(".") && /\.(jpe?g|png|gif|webp|svg)$/i.test(entry.name)) {
        paths.push(`${album}/${entry.name}`);
      }
    }
    if (entries.length < 1000) return paths;
  }
}

export async function listImages(album: string): Promise<{ url: string; path: string }[]> {
  if (isLocalBackend()) {
    return apiFetch<Array<{ url: string; path: string }>>(
      `/gallery/albums/${encodeURIComponent(album)}/images`,
    );
  }
  const paths = await listImagePaths(album);
  const images: Array<{ url: string; path: string }> = [];
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { data, error } = await supabase.storage.from(BUCKET)
      .createSignedUrls(paths.slice(offset, offset + 100), 60 * 60);
    if (error) throw error;
    for (const image of data || []) {
      if (!image.error && image.signedUrl && image.path) {
        images.push({ url: image.signedUrl, path: image.path });
      }
    }
  }
  return images;
}

export async function createAlbum(name: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch("/gallery/albums", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return;
  }
  // Crear carpeta simulada subiendo un archivo "oculto"
  const path = `${name}/.keep`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([""]), {
      contentType: "text/plain",
      upsert: false,
    });
  if (error && !String(error.message).includes("The resource already exists"))
    throw error;
}

export async function uploadImage(album: string, file: File): Promise<void> {
  if (isLocalBackend()) {
    const signed = await apiFetch<{ signedUrl: string }>("/v1/media/uploads/sign", {
      method: "POST",
      body: JSON.stringify({
        bucket: "gallery",
        folder: album,
        file_name: file.name,
        content_type: file.type,
        size: file.size,
      }),
    });
    const response = await fetch(signed.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Error al subir imagen");
    return;
  }
  await ensureAdminForMediaUpload();

  const { data: userData } = await supabase.auth.getUser();
  const uploaderId = userData?.user?.id;

  const ext = file.name.split(".").pop();
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${album}/${name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  if (uploaderId) {
    void (supabase as any).from("gallery_upload_events").insert({
      uploader_id: uploaderId,
      album_name: album,
      image_path: path,
    });
  }
}

export async function deleteImage(imagePath: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/gallery/images?path=${encodeURIComponent(imagePath)}`, {
      method: "DELETE",
    });
    return;
  }
  // imagePath debe ser relativo al bucket, ej: "Campamentos/abc123.jpg"
  const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
  if (error) throw error;
}

export async function deleteAlbum(albumName: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/gallery/albums/${encodeURIComponent(albumName)}`, {
      method: "DELETE",
    });
    return;
  }
  // Listar todos los archivos del álbum
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(albumName, { limit: 1000 });
  if (error) throw error;

  if (!data || data.length === 0) return;

  // Crear array de paths completos
  const filesToDelete = data.map((file: any) => `${albumName}/${file.name}`);

  // Eliminar todos los archivos
  const { error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove(filesToDelete);
  if (deleteError) throw deleteError;
}
