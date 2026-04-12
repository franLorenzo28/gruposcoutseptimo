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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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

  const addPendingFiles = (files: File[]) => {
    if (!files.length) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} excede el límite de 50 MB`,
          variant: "destructive",
        });
        continue;
      }
      accepted.push(file);
    }

    if (!accepted.length) return;

    setPendingFiles((prev) => {
      const next = [...prev];
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      for (const file of accepted) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          next.push(file);
          existingKeys.add(key);
        }
      }
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addPendingFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    addPendingFiles(files);
  };

  const removePendingFile = (fileToRemove: File) => {
    setPendingFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  const handleUploadPending = async () => {
    if (!pendingFiles.length) return;

    setIsUploading(true);
    const uploaded: Documento[] = [];
    try {
      for (const file of pendingFiles) {
        const newDoc = await uploadDocumento(rama, file);
        uploaded.push(newDoc);
      }

      setDocumentos((prev) => [...uploaded, ...prev]);
      toast({
        title: "Subida completada",
        description: `Se subieron ${uploaded.length} archivo(s) correctamente`,
      });
      setPendingFiles([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error uploading document";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
            Arrastra archivos aquí o selecciónalos
          </p>
          <p className="text-xs text-scout-red dark:text-red-400/75">
            Puedes cargar documentos e imágenes (máx. 50 MB por archivo)
          </p>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
            multiple
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
                  "Seleccionar archivos"
                )}
              </span>
            </Button>
          </label>
        </div>

        {pendingFiles.length > 0 && (
          <div className="space-y-3 rounded-lg border border-scout-red dark:border-red-900 bg-white dark:bg-slate-950 p-3">
            <p className="text-sm font-semibold text-scout-red dark:text-red-400">
              Archivos listos para subir
            </p>
            <div className="space-y-2">
              {pendingFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingFile(file)}
                    disabled={isUploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleUploadPending}
                disabled={isUploading || pendingFiles.length === 0}
                className="bg-scout-red hover:bg-red-700 dark:hover:bg-red-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  `Aceptar y subir (${pendingFiles.length})`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPendingFiles([])}
                disabled={isUploading}
              >
                Limpiar selección
              </Button>
            </div>
          </div>
        )}

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
