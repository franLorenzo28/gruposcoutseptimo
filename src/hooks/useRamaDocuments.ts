import { useEffect, useState } from "react";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  nombre: string;
  tamaño: number;
  created_at: string;
  original_filename: string;
}

export function useRamaDocuments(rama: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [rama]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isLocalBackend()) {
        // Use Express backend for local development
        const data = await apiFetch(`/ramas/${rama}/documentos`);
        setDocuments(data || []);
      } else {
        // Use Supabase for production
        const { data, error: supabaseError } = await supabase
          .from("rama_documentos")
          .select("*")
          .eq("rama", rama)
          .order("created_at", { ascending: false });

        if (supabaseError) throw supabaseError;
        setDocuments(data || []);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("No se pudieron cargar los documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const getDownloadUrl = async (docId: string): Promise<string> => {
    if (isLocalBackend()) {
      // Express backend generates signed URL
      const response = await apiFetch(`/ramas/${rama}/documentos/${docId}/download-url`);
      return response.url;
    } else {
      // Use Supabase Storage for production
      const doc = documents.find((d) => d.id === docId);
      if (!doc) throw new Error("Documento no encontrado");

      const { data, error } = await supabase.storage
        .from("rama-documentos")
        .createSignedUrl((doc as any).storage_path, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    }
  };

  return { documents, isLoading, error, getDownloadUrl };
}
