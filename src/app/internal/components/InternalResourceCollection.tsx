import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { ModulePending } from "@/app/internal/components/ModulePending";
import { ramaConfig } from "@/app/internal/rama-storage";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { isLocalBackend } from "@/lib/backend";
import { deleteDocumento, formatFileSize, getDocumentoDownloadUrl, listDocumentos, uploadDocumento, type DocumentCategory, type Documento } from "@/lib/documentos";
import { startFileDownload } from "@/lib/file-download";
import type { MiembroRama } from "@/lib/member-auth";

type Props = {
  title: string;
  description: string;
  category: Extract<DocumentCategory, "formulario" | "biblioteca">;
};

const allowedMimeTypes = new Set([
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/webp", "text/plain", "text/csv", "application/zip",
]);

export function InternalResourceCollection({ title, description, category }: Props) {
  const { session } = useMemberAuth();
  const [activeRama, setActiveRama] = useState<MiembroRama>(session?.rama ?? "lobatos");
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [failedDownload, setFailedDownload] = useState<Documento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localBackend = isLocalBackend();
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : session ? [session.rama] : [];
  const canPublish = !!session?.isRamaAdmin && allowedRamas.includes(activeRama);

  const refresh = useCallback(async () => {
    if (localBackend) return;
    setLoading(true);
    setError(null);
    setFailedDownload(null);
    try {
      setDocuments(await listDocumentos(activeRama, category));
    } catch {
      setError("No pudimos cargar los archivos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [activeRama, category, localBackend]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!session) return null;
  if (localBackend) return <ModulePending title={title} description="Esta colección estará disponible en la plataforma conectada a Supabase." />;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const invalid = files.find((file) => !allowedMimeTypes.has(file.type) || file.size === 0 || file.size > 50 * 1024 * 1024);
    if (invalid) {
      setError(`Revisa ${invalid.name}: admite PDF, documentos, imágenes y ZIP de hasta 50 MB.`);
      return;
    }
    setBusy(true);
    setError(null);
    setFailedDownload(null);
    try {
      for (const file of files) await uploadDocumento(activeRama, file, category);
      await refresh();
    } catch {
      await refresh();
      setError("No pudimos publicar todos los archivos. Revisa la lista y vuelve a intentar los que falten.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (document: Documento) => {
    setError(null);
    setDownloadingId(document.id);
    try {
      const url = await getDocumentoDownloadUrl(activeRama, document.id);
      startFileDownload(url);
      setFailedDownload(null);
    } catch {
      setError("No pudimos descargar el archivo. Intenta de nuevo.");
      setFailedDownload(document);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (document: Documento) => {
    if (!window.confirm(`¿Eliminar ${document.nombre}?`)) return;
    setBusy(true);
    setError(null);
    setFailedDownload(null);
    try {
      await deleteDocumento(activeRama, document.id);
      await refresh();
    } catch {
      setError("No pudimos eliminar el archivo. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <InternalPageHeader eyebrow="Recursos por unidad" title={title} description={description}
        meta={<Badge variant="outline">{ramaConfig[activeRama].titulo}</Badge>} />
      {allowedRamas.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Seleccionar unidad">
        {allowedRamas.map((rama) => <Button key={rama} variant={rama === activeRama ? "default" : "outline"} onClick={() => setActiveRama(rama)}>{ramaConfig[rama].titulo}</Button>)}
      </div>}
      {canPublish && <div className="rounded-xl border border-border bg-card p-4">
        <label htmlFor={`resource-upload-${category}`} className="mb-2 block text-sm font-semibold">Publicar archivos para {ramaConfig[activeRama].titulo}</label>
        <input id={`resource-upload-${category}`} type="file" multiple disabled={busy} onChange={(event) => void handleUpload(event)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.csv,.zip"
          className="block w-full max-w-xl text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">PDF, documentos, imágenes o ZIP. Máximo 50 MB por archivo.</p>
        {busy && <p role="status" className="mt-2 inline-flex items-center gap-2 text-sm"><Upload className="size-4" />Guardando archivos…</p>}
      </div>}
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-card p-4 text-sm">
        <span>{error}</span><Button variant="outline" size="sm" onClick={() => void (failedDownload ? handleDownload(failedDownload) : refresh())}>{failedDownload ? "Reintentar descarga" : "Actualizar lista"}</Button>
      </div>}
      {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Cargando archivos…</p>
        : documents.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Todavía no hay archivos publicados para {ramaConfig[activeRama].titulo}.</CardContent></Card>
          : <ul className="space-y-3">{documents.map((document) => <li key={document.id}>
            <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3"><FileText className="size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0">
                <p className="break-words text-sm font-semibold">{document.nombre}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(document.tamaño)} · {new Date(document.created_at).toLocaleDateString("es-UY")}</p>
              </div></div>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={downloadingId !== null} onClick={() => void handleDownload(document)}>{downloadingId === document.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}{downloadingId === document.id ? "Preparando…" : "Descargar"}</Button>
                {canPublish && <Button variant="ghost" size="icon" aria-label={`Eliminar ${document.nombre}`} disabled={busy} onClick={() => void handleDelete(document)}><Trash2 aria-hidden="true" /></Button>}
              </div>
            </CardContent></Card>
          </li>)}</ul>}
    </section>
  );
}
