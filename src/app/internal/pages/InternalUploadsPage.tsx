import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { ModulePending } from "@/app/internal/components/ModulePending";
import { ramaConfig } from "@/app/internal/rama-storage";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { isLocalBackend } from "@/lib/backend";
import { formatFileSize } from "@/lib/documentos";
import { startFileDownload } from "@/lib/file-download";
import { deletePppFile, getPppDownloadUrl, listPppFiles, listPppOwnerNames, uploadPppFile, type PppFile, type PppRama } from "@/lib/ppp-files";

function eligibleRama(value: string): value is PppRama {
  return value === "pioneros" || value === "rover";
}

export default function InternalUploadsPage() {
  const { session } = useMemberAuth();
  const availableRamas = (session?.allowedRamas?.length ? session.allowedRamas : session ? [session.rama] : []).filter(eligibleRama);
  const [activeRama, setActiveRama] = useState<PppRama>(availableRamas[0] ?? "pioneros");
  const [files, setFiles] = useState<PppFile[]>([]);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [failedDownload, setFailedDownload] = useState<PppFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localBackend = isLocalBackend();

  const refresh = useCallback(async () => {
    if (localBackend || availableRamas.length === 0) return;
    setLoading(true);
    setError(null);
    setFailedDownload(null);
    try {
      const data = await listPppFiles(activeRama);
      setFiles(data);
      const ids = Array.from(new Set(data.map((file) => file.owner_id)));
      try { setOwnerNames(await listPppOwnerNames(ids)); }
      catch { setOwnerNames({}); }
    } catch {
      setError("No pudimos cargar los archivos de progresión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [activeRama, availableRamas.length, localBackend]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!session) return null;
  if (localBackend) return <ModulePending title="Progresión personal" description="Los archivos de progresión estarán disponibles en la plataforma conectada a Supabase." />;

  if (!availableRamas.length) return <section className="mx-auto max-w-4xl px-4 py-6">
    <InternalPageHeader eyebrow="Progresión personal" title="Plan de Progresión Personal" description="Este espacio corresponde a Pioneros, Rovers y sus educadores autorizados." />
  </section>;

  const canUpload = session.accessType !== "educador" && session.rama === activeRama;
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    setBusy(true);
    setError(null);
    setFailedDownload(null);
    try {
      for (const file of selected) await uploadPppFile(activeRama, file);
      await refresh();
    } catch (cause) {
      await refresh();
      setError(cause instanceof Error && cause.message.startsWith("Sube un PDF") ? cause.message : "No pudimos guardar todos los archivos. Revisa la lista antes de reintentar.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (file: PppFile) => {
    setError(null);
    setDownloadingId(file.id);
    try { startFileDownload(await getPppDownloadUrl(file)); setFailedDownload(null); }
    catch { setError("No pudimos descargar el archivo. Intenta de nuevo."); setFailedDownload(file); }
    finally { setDownloadingId(null); }
  };

  const handleDelete = async (file: PppFile) => {
    if (!window.confirm(`¿Eliminar ${file.original_filename}?`)) return;
    setBusy(true);
    setError(null);
    setFailedDownload(null);
    try { await deletePppFile(file); await refresh(); }
    catch { setError("No pudimos eliminar el archivo. Intenta de nuevo."); }
    finally { setBusy(false); }
  };

  return <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
    <InternalPageHeader eyebrow="Progresión personal" title="Plan de Progresión Personal"
      description={session.accessType === "educador" ? "Consulta los archivos compartidos por integrantes de tu unidad." : "Guarda aquí tus archivos de progresión para consultarlos con tu equipo educativo."}
      meta={<Badge variant="outline">{ramaConfig[activeRama].titulo}</Badge>} />
    {availableRamas.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Seleccionar unidad">
      {availableRamas.map((rama) => <Button key={rama} variant={rama === activeRama ? "default" : "outline"} onClick={() => setActiveRama(rama)}>{ramaConfig[rama].titulo}</Button>)}
    </div>}
    {canUpload && <div className="rounded-xl border border-border bg-card p-4">
      <label htmlFor="ppp-upload" className="mb-2 block text-sm font-semibold">Subir archivos a mi progresión</label>
      <input id="ppp-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={busy}
        onChange={(event) => void handleUpload(event)}
        className="block w-full max-w-xl text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground" />
      <p className="mt-2 text-xs text-muted-foreground">PDF o imágenes JPG, PNG y WebP. Máximo 20 MB por archivo. Solo tú y los educadores autorizados de tu unidad pueden verlos.</p>
    </div>}
    {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Guardando cambios…</p>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-card p-4 text-sm">
      <span>{error}</span><Button size="sm" variant="outline" onClick={() => void (failedDownload ? handleDownload(failedDownload) : refresh())}>{failedDownload ? "Reintentar descarga" : "Actualizar lista"}</Button>
    </div>}
    {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Cargando archivos…</p>
      : files.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Todavía no hay archivos de progresión para esta unidad.</CardContent></Card>
        : <ul className="space-y-3">{files.map((file) => <li key={file.id}><Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3"><FileText className="size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0">
            <p className="break-words text-sm font-semibold">{file.original_filename}</p>
            <p className="text-xs text-muted-foreground">{ownerNames[file.owner_id] || "Integrante"} · {formatFileSize(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString("es-UY")}</p>
          </div></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" disabled={downloadingId !== null} onClick={() => void handleDownload(file)}>{downloadingId === file.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}{downloadingId === file.id ? "Preparando…" : "Descargar"}</Button>
            {file.owner_id === session.authUserId && canUpload && <Button variant="ghost" size="icon" disabled={busy} aria-label={`Eliminar ${file.original_filename}`} onClick={() => void handleDelete(file)}><Trash2 aria-hidden="true" /></Button>}
          </div>
        </CardContent></Card></li>)}</ul>}
  </section>;
}
