import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url: string;
}

export default function InternalUploadsPage() {
  const { session } = useMemberAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showMine, setShowMine] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!session) return null;

  const isPioneroRover = session.rama === "pioneros" || session.rama === "rover";
  const isEducador = session.accessType === "educador";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toLocaleDateString("es-UY"),
      url: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...newFiles, ...prev]);
    toast({ title: "PPP subido", description: `${newFiles.length} archivo(s) agregado(s) a tu plan de progresión.` });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Archivo eliminado de tu PPP" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isPioneroRover && !isEducador) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <InternalPageHeader
          eyebrow="Progresión personal"
          title="Plan de Progresión Personal"
          description="El PPP está disponible solo para las unidades Pioneros y Rovers."
        />
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Esta sección es exclusiva para Pioneros, Rovers y sus educadores.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Progresión personal"
        title="Plan de Progresión Personal"
        description="Subí y gestioná los archivos de tu Plan de Progresión Personal. Visible solo para vos y los educadores de tu unidad."
        meta={
          <Badge variant="outline" className="rounded-full bg-background/80">
            {isEducador ? "Educador — vista de supervisión" : `Mi PPP — ${session.nombre}`}
          </Badge>
        }
      />

      {isEducador && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={showMine ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setShowMine(true)}
          >
            Mi unidad
          </Button>
          <Button
            type="button"
            variant={!showMine ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setShowMine(false)}
          >
            Todos
          </Button>
        </div>
      )}

      {isPioneroRover && !isEducador && (
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="rounded-full">
            <Upload className="mr-2 h-4 w-4" />
            Subir archivo a mi PPP
          </Button>
          <p className="text-xs text-muted-foreground">PDF, Word o imágenes — máx 10MB</p>
        </div>
      )}

      {files.length === 0 ? (
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {isPioneroRover && !isEducador
                ? "No has subido archivos a tu PPP todavía."
                : "No hay archivos de PPP cargados para esta vista."}
            </p>
            {isPioneroRover && !isEducador && (
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => fileInputRef.current?.click()}>
                Subir mi primer archivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id} className="border-border/70 bg-card/85 shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 shrink-0 text-primary/60" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} · {file.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={file.url} download={file.name} aria-label="Descargar">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {isPioneroRover && !isEducador && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label="Eliminar archivo"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
