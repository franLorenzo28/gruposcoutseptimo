import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "./backend";

export type Documento = {
  id: string;
  rama: string;
  nombre: string;
  original_filename: string;
  mime_type: string;
  tamaño: number;
  storage_path: string;
  subido_por: string;
  created_at: string;
  updated_at: string;
};

/**
 * List all documents of a unidad
 * Only accessible to members of that unidad
 */
export async function listDocumentos(rama: string): Promise<Documento[]> {
  if (isLocalBackend()) {
    const response = await apiFetch(`/unidades/${rama}/documentos`);
    if (!response.ok) {
      throw new Error("Error loading documents");
    }
    return response.json();
  } else {
    // Supabase: fetch from rama_documentos table filtered by rama
    const { data, error } = await supabase
      .from("rama_documentos")
      .select("*")
      .eq("rama", rama)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

/**
 * Upload a new document to a unidad
 * Only unidad admins can upload
 */
export async function uploadDocumento(
  rama: string,
  file: File
): Promise<Documento> {
  if (isLocalBackend()) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/unidades/${rama}/documentos`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error uploading document");
    }

    return response.json();
  } else {
    // Supabase: upload to Storage then create record in rama_documentos
    const fileName = `${Date.now()}-${file.name}`;
    const storagePath = `rama_${rama}/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from("rama-documentos")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Create database record
    const { data, error: dbError } = await supabase
      .from("rama_documentos")
      .insert({
        rama,
        nombre: file.name,
        original_filename: file.name,
        mime_type: file.type,
        tamaño: file.size,
        storage_path: storagePath,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Document not created");

    return data;
  }
}

/**
 * Delete a document from a unidad
 * Only unidad admin or document uploader can delete
 */
export async function deleteDocumento(rama: string, docId: string): Promise<void> {
  if (isLocalBackend()) {
    const response = await apiFetch(`/unidades/${rama}/documentos/${docId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error deleting document");
    }
  } else {
    // Supabase: delete from Storage and database
    const documento = await supabase
      .from("rama_documentos")
      .select("storage_path")
      .eq("id", docId)
      .single();

    if (documento.error) throw documento.error;
    if (documento.data?.storage_path) {
      await supabase.storage
        .from("rama-documentos")
        .remove([documento.data.storage_path]);
    }

    const { error } = await supabase
      .from("rama_documentos")
      .delete()
      .eq("id", docId);

    if (error) throw error;
  }
}

/**
 * Get download URL for a document
 * Accessible to unidad members
 */
export async function getDocumentoDownloadUrl(
  rama: string,
  docId: string
): Promise<string> {
  if (isLocalBackend()) {
    // Local backend serves via /unidades/:rama/documentos/:docId/download
    const token = localStorage.getItem("auth_token") || "";
    return `/api/unidades/${rama}/documentos/${docId}/download?token=${encodeURIComponent(token)}`;
  } else {
    // Supabase: get signed URL from Storage
    const documento = await supabase
      .from("rama_documentos")
      .select("storage_path")
      .eq("id", docId)
      .single();

    if (documento.error) throw documento.error;
    if (!documento.data?.storage_path)
      throw new Error("Storage path not found");

    const { data, error } = await supabase.storage
      .from("rama-documentos")
      .createSignedUrl(documento.data.storage_path, 60 * 60); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }
}

/**
 * Get view URL for a document (inline viewing)
 * Accessible to unidad members
 */
export async function getDocumentoViewUrl(
  rama: string,
  docId: string
): Promise<string> {
  if (isLocalBackend()) {
    // Local backend serves via /unidades/:rama/documentos/:docId/view
    const token = localStorage.getItem("auth_token") || "";
    return `/api/unidades/${rama}/documentos/${docId}/view?token=${encodeURIComponent(token)}`;
  } else {
    // Supabase: same as download but serves inline
    const documento = await supabase
      .from("rama_documentos")
      .select("storage_path")
      .eq("id", docId)
      .single();

    if (documento.error) throw documento.error;
    if (!documento.data?.storage_path)
      throw new Error("Storage path not found");

    const { data, error } = await supabase.storage
      .from("rama-documentos")
      .createSignedUrl(documento.data.storage_path, 60 * 60); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(
  mimeType: string
): "pdf" | "document" | "spreadsheet" | "image" | "archive" | "file" {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "spreadsheet";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return "archive";
  return "file";
}
