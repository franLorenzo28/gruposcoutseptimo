import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch, ensureLocalToken } from "@/lib/backend";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

export type GalleryAlbum = { name: string; coverUrl?: string };

const BUCKET = "gallery"; // Asegúrate de crear este bucket en Supabase Storage

export async function listAlbums(): Promise<GalleryAlbum[]> {
  try {
    if (isLocalBackend()) {
      const rows = (await apiFetch("/gallery/albums")) as Array<{
        name: string;
      }>;
      return rows.map((r) => ({ name: r.name }));
    }
    // En Supabase Storage, necesitamos listar archivos para detectar carpetas
    // Usamos list() sin path para obtener el contenido de la raíz
    const { data, error } = await supabase.storage.from(BUCKET).list();

    if (error) {
      console.error("Error listing storage:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No se encontraron archivos o carpetas en el bucket");
      return [];
    }

    console.log("Archivos/carpetas en raíz:", data);

    // En Supabase, las carpetas aparecen como items con id null o metadata específico
    // Filtramos solo las carpetas (que no tienen extensión y pueden tener id null)
    const folders = data.filter((item: any) => {
      // Una carpeta típicamente no tiene extensión de archivo
      const hasNoExtension = !item.name.includes(".");
      return hasNoExtension && item.name !== ".emptyFolderPlaceholder";
    });

    console.log("Carpetas detectadas:", folders);

    return folders.map((folder: any) => ({
      name: folder.name.replace(/\/$/, ""), // Remover slash final si existe
    }));
  } catch (error) {
    console.error("Error listing albums:", error);
    return [];
  }
}

export async function listImages(
  album: string,
): Promise<{ url: string; path: string }[]> {
  if (isLocalBackend()) {
    const rows = (await apiFetch(
      `/gallery/albums/${encodeURIComponent(album)}/images`,
    )) as Array<{ url: string; path: string }>;
    return rows;
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(album, { limit: 1000 });
  if (error) throw error;

  // Filtrar solo archivos de imagen (no carpetas, no .keep, no archivos ocultos)
  const files = (data || []).filter((f: any) => {
    const name = f.name.toLowerCase();
    return (
      !name.endsWith("/") &&
      !name.startsWith(".") &&
      name !== ".keep" &&
      (name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".gif") ||
        name.endsWith(".webp") ||
        name.endsWith(".svg"))
    );
  });

  const images = files.map((f: any) => ({
    url: supabase.storage.from(BUCKET).getPublicUrl(`${album}/${f.name}`).data
      .publicUrl,
    path: `${album}/${f.name}`,
  }));
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
    const tokenizedForm = new FormData();
    tokenizedForm.append("files", file);
    // Usamos fetch manualmente para enviar FormData con auth
    // Reutilizamos apiFetch para token, pero apiFetch fuerza content-type json; mejor hacemos una pequeña función inline
    const token = await ensureLocalToken();
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
    await fetch(
      `${API_BASE}/gallery/albums/${encodeURIComponent(album)}/images`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: tokenizedForm,
      },
    ).then((r) => {
      if (!r.ok) throw new Error("Error al subir imagen");
    });
    return;
  }
  await ensureAdminForMediaUpload();

  const ext = file.name.split(".").pop();
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${album}/${name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
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
