import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Trash2,
  File,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  uploadDocumento,
  deleteDocumento,
  listDocumentos,
  formatFileSize,
  type Documento,
} from "@/lib/documentos";

interface AdminDocumentsProps {
  rama: string;
  ramaName: string;
}

export function AdminDocuments({ rama, ramaName }: AdminDocumentsProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load documents on mount
  useEffect(() => {
    loadDocumentos();
  }, [rama]);

  const loadDocumentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await listDocumentos(rama);
      setDocumentos(docs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error loading documents";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede exceder 50 MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const newDoc = await uploadDocumento(rama, file);
        setDocumentos((prev) => [newDoc, ...prev]);
        toast({
          title: "Éxito",
          description: `${file.name} se subió correctamente`,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error uploading document";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        // Reset input
        e.target.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede exceder 50 MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const newDoc = await uploadDocumento(rama, file);
        setDocumentos((prev) => [newDoc, ...prev]);
        toast({
          title: "Éxito",
          description: `${file.name} se subió correctamente`,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error uploading document";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) {
      return;
    }

    setDeleting(docId);
    try {
      await deleteDocumento(rama, docId);
      setDocumentos((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Éxito",
        description: "Documento eliminado",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error deleting document";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="border-2 border-scout-red bg-red-50 dark:bg-slate-900 dark:border-red-900">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-scout-red dark:text-red-400">
          Gestionar documentos
        </h3>

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-scout-red bg-red-100 dark:bg-red-950/30"
              : "border-scout-red bg-white dark:bg-slate-950"
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-scout-red dark:text-red-400" />
          <p className="mt-2 text-sm font-semibold text-scout-red dark:text-red-400">
            Arrastra documentos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-scout-red dark:text-red-400/75">
            Máximo 50 MB: PDFs, Word, Excel, imágenes, etc.
          </p>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              asChild
              variant="outline"
              className="mt-3 border-scout-red text-scout-red dark:border-red-400 dark:text-red-400"
              disabled={isUploading}
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  "Seleccionar archivo"
                )}
              </span>
            </Button>
          </label>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-400">
                {error}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDocumentos}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-scout-red" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cargando documentos...
            </p>
          </div>
        )}

        {/* Document list */}
        {!loading && documentos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-scout-red dark:text-red-400 mb-3">
              Documentos de {ramaName}
            </h4>
            <div className="space-y-2">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-scout-red dark:border-red-900 bg-white dark:bg-slate-950 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-scout-red dark:text-red-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.tamaño)} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 flex-shrink-0"
                  >
                    {deleting === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && documentos.length === 0 && !error && (
          <div className="flex items-center gap-2 rounded-lg border border-scout-red dark:border-red-900 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>No hay documentos subidos aún. ¡Carga el primero!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
