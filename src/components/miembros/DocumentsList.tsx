import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, File } from "lucide-react";
import type { MiembroRama } from "@/lib/member-auth";
import { useRamaDocuments } from "@/hooks/useRamaDocuments";

interface DocumentsListProps {
  rama: MiembroRama;
}

export function DocumentsList({ rama }: DocumentsListProps) {
  const { documents, isLoading, error, getDownloadUrl } = useRamaDocuments(rama);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (docId: string, docName: string) => {
    try {
      setDownloading(docId);
      const url = await getDownloadUrl(docId);
      // Abrir en nueva ventana o descargar
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Error al descargar documento");
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando documentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>No hay documentos disponibles aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <File className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{doc.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {(doc.tamaño / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(doc.id, doc.nombre)}
            disabled={downloading === doc.id}
            className="ml-2 flex-shrink-0 gap-2"
          >
            {downloading === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {downloading === doc.id ? "Descargando" : "Abrir"}
            </span>
          </Button>
        </div>
      ))}
    </div>
  );
}
