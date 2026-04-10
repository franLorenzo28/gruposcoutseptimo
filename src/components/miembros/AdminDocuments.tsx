import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Trash2, File, AlertCircle } from "lucide-react";

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  fechaSubida: string;
}

interface AdminDocumentsProps {
  ramaName: string;
  documentos: Document[];
  onUpload: (file: File) => void;
  onDelete: (docId: string) => void;
}

export function AdminDocuments({
  ramaName,
  documentos,
  onUpload,
  onDelete,
}: AdminDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("El archivo es muy grande (máximo 50 MB)");
        return;
      }
      setIsUploading(true);
      onUpload(file);
      setTimeout(() => setIsUploading(false), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("El archivo es muy grande (máximo 50 MB)");
        return;
      }
      setIsUploading(true);
      onUpload(file);
      setTimeout(() => setIsUploading(false), 1000);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-blue-900">Gestionar documentos</h3>

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
              ? "border-blue-500 bg-blue-100"
              : "border-blue-300 bg-white"
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-2 text-sm font-semibold text-blue-900">
            Arrastra documentos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-blue-700">
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
              className="mt-3 border-blue-300 text-blue-800"
              disabled={isUploading}
            >
              <span>{isUploading ? "Subiendo..." : "Seleccionar archivo"}</span>
            </Button>
          </label>
        </div>

        {/* Document list */}
        {documentos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-3">
              Documentos de {ramaName}
            </h4>
            <div className="space-y-2">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.tipo} · {doc.fechaSubida}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(doc.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {documentos.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>No hay documentos subidos aún. ¡Carga el primero!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
