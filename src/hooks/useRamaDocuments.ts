import { useEffect, useState } from "react";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  nombre: string;
  tamaño: number;
  created_at: string;
  original_filename: string;
  storage_path?: string | null;
}

export function useRamaDocuments(rama: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDocuments();
  }, [rama]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isLocalBackend()) {
        const data = await apiFetch(`/unidades/${rama}/documentos`);
        setDocuments(Array.isArray(data) ? (data as Document[]) : []);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("rama_documentos")
        .select("*")
        .eq("rama", rama)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setDocuments((data || []) as Document[]);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("No se pudieron cargar los documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const removeGhostDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const getDownloadUrl = async (docId: string): Promise<string> => {
    if (isLocalBackend()) {
      const response = await apiFetch(`/unidades/${rama}/documentos/${docId}/download-url`);
      return response.url;
    }

    const doc = documents.find((d) => d.id === docId);
    if (!doc) throw new Error("Documento no encontrado");
    if (!doc.storage_path) {
      removeGhostDocument(docId);
      throw new Error("El archivo ya no existe en storage");
    }

    const { data, error } = await supabase.storage
      .from("rama-documentos")
      .createSignedUrl(doc.storage_path, 3600);

    if (error) {
      removeGhostDocument(docId);
      throw error;
    }

    // Avoid opening 404 for stale DB rows whose storage object no longer exists.
    try {
      const probe = await fetch(data.signedUrl, { method: "HEAD" });
      if (!probe.ok) {
        removeGhostDocument(docId);
        throw new Error("El archivo ya no existe en storage");
      }
    } catch {
      removeGhostDocument(docId);
      throw new Error("El archivo ya no existe en storage");
    }

    return data.signedUrl;
  };

  return { documents, isLoading, error, getDownloadUrl };
}
