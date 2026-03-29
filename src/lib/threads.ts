import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch, uploadImage } from "@/lib/backend";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

export type Thread = {
  id: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
};

export type ThreadWithAuthor = Thread & {
  author_name?: string | null;
  author_username?: string | null;
  author_avatar?: string | null;
};

export type ThreadComment = {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export async function listThreads(limit = 50): Promise<Thread[]> {
  if (isLocalBackend()) {
    const data = await apiFetch(
      `/threads?limit=${encodeURIComponent(String(limit))}`,
    );
    return data as Thread[];
  } else {
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Thread[];
  }
}

export async function createThread(
  content: string,
  file?: File | null,
): Promise<Thread> {
  // Validación de contenido
  if (!content.trim() && !file) {
    throw new Error("El contenido no puede estar vacío");
  }
  if (content.length > 500) {
    throw new Error("El contenido no puede exceder 500 caracteres");
  }

  if (isLocalBackend()) {
    let imageUrl: string | null = null;
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("La imagen no puede superar 5MB");
      }
      imageUrl = await uploadImage(file);
    }
    const data = await apiFetch("/threads", {
      method: "POST",
      body: JSON.stringify({ content: content.trim(), image_url: imageUrl }),
    });
    return data as Thread;
  } else {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error("No autenticado");

    let imageUrl: string | null = null;
    if (file) {
      await ensureAdminForMediaUpload();

      // Validar tipo y tamaño de imagen
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("La imagen no puede superar 5MB");
      }
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: upErr } = await supabase.storage
        .from("thread-images")
        .upload(path, file, {
          upsert: false,
          cacheControl: "3600",
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from("thread-images")
        .getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    const { data, error } = await supabase
      .from("threads")
      .insert({ author_id: userId, content, image_url: imageUrl })
      .select("*")
      .single();
    if (error) throw error;
    return data as Thread;
  }
}

export async function listComments(threadId: string): Promise<ThreadComment[]> {
  if (isLocalBackend()) {
    const data = await apiFetch(
      `/threads/${encodeURIComponent(threadId)}/comments`,
    );
    return data as ThreadComment[];
  } else {
    const { data, error } = await supabase
      .from("thread_comments")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as ThreadComment[];
  }
}

export async function addComment(
  threadId: string,
  content: string,
): Promise<ThreadComment> {
  if (isLocalBackend()) {
    const data = await apiFetch(
      `/threads/${encodeURIComponent(threadId)}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    return data as ThreadComment;
  } else {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("thread_comments")
      .insert({ thread_id: threadId, author_id: userId, content })
      .select("*")
      .single();
    if (error) throw error;
    return data as ThreadComment;
  }
}

export async function deleteThread(threadId: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/threads/${encodeURIComponent(threadId)}`, {
      method: "DELETE",
    });
  } else {
    const { error } = await supabase
      .from("threads")
      .delete()
      .eq("id", threadId);
    if (error) throw error;
  }
}

export function isAdmin(userEmail: string | undefined): boolean {
  if (!userEmail) return false;
  const adminEmails = (import.meta.env.VITE_GALLERY_ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(userEmail.toLowerCase());
}
