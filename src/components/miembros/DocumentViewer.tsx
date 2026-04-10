import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  listDocumentos,
  getDocumentoDownloadUrl,
  getDocumentoViewUrl,
  formatFileSize,
  getFileIcon,
  type Documento,
} from "@/lib/documentos";
import {
  Download,
  Eye,
  FileText,
  FileArchive,
  Image as ImageIcon,
  File,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DocumentViewerProps {
  rama: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewer({
  rama,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDocumentos();
    }
  }, [open, rama]);

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

  const handleDownload = async (documento: Documento) => {
    try {
      setDownloading(documento.id);
      const url = await getDocumentoDownloadUrl(rama, documento.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = documento.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Descargado",
        description: `${documento.nombre} se descargó correctamente`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error downloading document";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloading(documento.id);
    }
  };

  const handlePreview = async (documento: Documento) => {
    try {
      setPreviewing(documento.id);
      const url = await getDocumentoViewUrl(rama, documento.id);
      window.open(url, "_blank");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error previewing document";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPreviewing(null);
    }
  };

  const getFileIconComponent = (mimeType: string) => {
    const iconType = getFileIcon(mimeType);
    const iconProps = { className: "h-4 w-4" };

    switch (iconType) {
      case "pdf":
        return <FileText {...iconProps} className="h-4 w-4 text-red-600" />;
      case "document":
        return <FileText {...iconProps} className="h-4 w-4 text-blue-600" />;
      case "spreadsheet":
        return <BarChart3 {...iconProps} className="h-4 w-4 text-green-600" />;
      case "image":
        return <ImageIcon {...iconProps} className="h-4 w-4 text-purple-600" />;
      case "archive":
        return <FileArchive {...iconProps} className="h-4 w-4 text-orange-600" />;
      default:
        return <File {...iconProps} />;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Documentos de {rama}</DialogTitle>
          <DialogDescription>
            Archivos compartidos por los educadores de la rama
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-400">
                  Error cargando documentos
                </p>
                <p className="text-xs text-red-700 dark:text-red-400/75">
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

          {!loading && documentos.length === 0 && !error && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <File className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                No hay documentos disponibles
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Los educadores compartirán documentos aquí
              </p>
            </div>
          )}

          {!loading && documentos.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIconComponent(doc.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.nombre}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatFileSize(doc.tamaño)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {/* Preview button for images and PDFs */}
                    {(doc.mime_type.includes("image") ||
                      doc.mime_type === "application/pdf") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(doc)}
                        disabled={previewing === doc.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-scout-red dark:hover:text-red-400"
                        title="Preview"
                      >
                        {previewing === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Download button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                      className="text-gray-600 dark:text-gray-400 hover:text-scout-red dark:hover:text-red-400"
                      title="Download"
                    >
                      {downloading === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
