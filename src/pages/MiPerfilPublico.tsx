import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Camera, Check, Copy, ImageOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PublicProfileCard, { type PublicIdentity } from "@/components/profile/PublicProfileCard";
import { apiFetch, BackendError } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/providers/AppProviders";

type EditableProfile = PublicIdentity & {
  is_public: boolean;
  internal_access: boolean;
};

type Feedback = { kind: "success" | "error"; text: string } | null;
const avatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const avatarLimit = 5 * 1024 * 1024;

async function uploadAvatar(file: File): Promise<string> {
  const signed = await apiFetch<{ path: string; signedUrl: string }>("/v1/media/uploads/sign", {
    method: "POST",
    body: JSON.stringify({
      bucket: "avatars",
      file_name: file.name.slice(0, 180),
      content_type: file.type,
      size: file.size,
    }),
  });
  const response = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error("No se pudo subir la foto. Intentá nuevamente.");
  return supabase.storage.from("avatars").getPublicUrl(signed.path).data.publicUrl;
}

export default function MiPerfilPublico() {
  const { user, isUserLoading, refreshUser } = useSupabaseUser();
  const [draft, setDraft] = useState<EditableProfile | null>(null);
  const [saved, setSaved] = useState<EditableProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setDraft(null); setSaved(null); return; }
    let active = true;
    setLoadingProfile(true);
    setLoadError("");
    apiFetch<EditableProfile>("/v1/me/profile")
      .then((profile) => {
        if (active) { setDraft(profile); setSaved(profile); setAvatarFile(null); setFeedback(null); }
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : "No se pudo cargar el perfil.");
      })
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, [user?.id, retryKey]);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(null); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const changed = Boolean(draft && saved && (avatarFile ||
    draft.nombre_completo !== saved.nombre_completo ||
    draft.username !== saved.username ||
    draft.descripcion_personal !== saved.descripcion_personal ||
    draft.avatar_url !== saved.avatar_url ||
    draft.is_public !== saved.is_public));
  const profileUrl = saved ? `${window.location.origin}/perfil-public/${saved.user_id}` : "";

  const selectAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!avatarTypes.has(file.type) || file.size > avatarLimit) {
      setFeedback({ kind: "error", text: "Elegí una imagen JPG, PNG o WebP de hasta 5 MB." });
      return;
    }
    setAvatarFile(file);
    setFeedback(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || !saved || !changed) return;
    setBusy(true);
    setFeedback(null);
    try {
      const nextAvatar = avatarFile ? await uploadAvatar(avatarFile) : draft.avatar_url;
      const changes: Record<string, string | boolean | null> = {};
      if (draft.nombre_completo !== saved.nombre_completo) changes.nombre_completo = draft.nombre_completo.trim();
      if (draft.username !== saved.username) changes.username = draft.username?.trim() || "";
      if (draft.descripcion_personal !== saved.descripcion_personal) changes.descripcion_personal = draft.descripcion_personal?.trim() || null;
      if (nextAvatar !== saved.avatar_url) changes.avatar_url = nextAvatar;
      if (draft.is_public !== saved.is_public) changes.is_public = draft.is_public;
      const updated = await apiFetch<EditableProfile>("/v1/me/profile", {
        method: "PATCH", body: JSON.stringify(changes),
      });
      setDraft(updated);
      setSaved(updated);
      setAvatarFile(null);
      setFeedback({ kind: "success", text: "Los cambios de tu perfil quedaron guardados." });
      void refreshUser().catch(() => undefined);
    } catch (error) {
      const text = error instanceof BackendError && error.code === "USERNAME_TAKEN"
        ? "Ese nombre de usuario ya está en uso. Elegí otro."
        : error instanceof Error ? error.message : "No se pudo guardar el perfil.";
      setFeedback({ kind: "error", text });
    } finally { setBusy(false); }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch { setFeedback({ kind: "error", text: "No se pudo copiar el enlace. Podés abrirlo y copiarlo desde el navegador." }); }
  };

  return (
    <div className="min-h-screen bg-[#f2f2e9] text-[#193428] dark:bg-[#101d17] dark:text-[#f7f3e8]">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#5b6d5d] transition-colors hover:text-[#193d2a] dark:text-[#bccfbd] dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Volver al inicio</Link>

        <header className="relative mt-7 overflow-hidden rounded-[30px] bg-[#173d2b] px-7 py-9 text-[#f8f4e8] shadow-[0_24px_70px_-40px_rgba(11,43,23,.85)] sm:px-10 sm:py-11">
          <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full border-[38px] border-white/[.06]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-95px] right-36 h-52 w-52 rounded-full border-[30px] border-[#d7b66a]/10" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.24em] text-[#e5c579]"><Sparkles className="h-4 w-4" />Tu espacio en el Séptimo</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Un perfil con tu historia.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#f8f4e8]/75 sm:text-base">Presentate a la comunidad y elegí qué querés compartir. El acceso a la plataforma interna lo habilita el administrador.</p>
          </div>
        </header>

        {!user && isUserLoading ? <p className="mt-10 text-sm">Cargando cuenta...</p> : !user ? (
          <section className="mt-7 max-w-2xl rounded-[26px] border border-[#d8dccd] bg-[#fbfaf6] p-8 shadow-sm dark:border-white/10 dark:bg-[#18291f]">
            <LockKeyhole className="h-8 w-8 text-[#a77b36]" />
            <h2 className="mt-4 font-serif text-2xl">Tu perfil te espera</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ingresá o creá una cuenta para completar tu perfil público.</p>
            <Button asChild className="mt-6 rounded-xl"><Link to="/mi-perfil?auth=login">Ingresar</Link></Button>
          </section>
        ) : loadingProfile ? <p className="mt-10 text-sm">Cargando perfil...</p> : !draft || !saved ? (
          <section className="mt-7 max-w-2xl rounded-[26px] border border-border bg-card p-8">
            <p role="alert">{loadError || "No se pudo cargar el perfil."}</p>
            <Button type="button" variant="outline" className="mt-5" onClick={() => setRetryKey((current) => current + 1)}>Reintentar</Button>
          </section>
        ) : (
          <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px]">
            <form onSubmit={save} className="space-y-6">
              <section className="rounded-[26px] border border-[#d8dccd] bg-[#fbfaf6] p-6 shadow-sm dark:border-white/10 dark:bg-[#18291f] sm:p-8">
                <div className="flex items-start gap-4"><span className="font-serif text-3xl text-[#a77b36]">01</span><div><h2 className="font-serif text-2xl">Tu presentación</h2><p className="mt-1 text-sm text-muted-foreground">La información que verá la gente cuando compartas tu perfil.</p></div></div>
                <div className="mt-7 flex flex-wrap items-center gap-5 rounded-2xl bg-[#f0f1e7] p-5 dark:bg-white/5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#dfe7d9] text-[#31513b]">
                    {avatarPreview || draft.avatar_url ? <img src={avatarPreview || draft.avatar_url || ""} alt="Vista previa de tu foto" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Foto de perfil</p><p className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PNG o WebP · máximo 5 MB.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input ref={avatarInput} id="public-avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectAvatar} />
                      <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => avatarInput.current?.click()}>Elegir foto</Button>
                      {(avatarPreview || draft.avatar_url) && <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => { setAvatarFile(null); setDraft({ ...draft, avatar_url: null }); }}><ImageOff className="mr-1.5 h-4 w-4" />Quitar</Button>}
                    </div>
                  </div>
                </div>
                <div className="mt-7 grid gap-5">
                  <div className="space-y-2"><Label htmlFor="public-profile-name">Nombre completo</Label><Input id="public-profile-name" required minLength={2} maxLength={160} autoComplete="name" value={draft.nombre_completo || ""} onChange={(event) => setDraft({ ...draft, nombre_completo: event.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-2"><Label htmlFor="public-profile-username">Nombre de usuario (opcional)</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span><Input id="public-profile-username" required={Boolean(saved.username)} minLength={3} maxLength={32} pattern={draft.username === saved.username ? undefined : "[A-Za-z0-9_]+"} value={draft.username || ""} onChange={(event) => setDraft({ ...draft, username: event.target.value })} className="h-11 rounded-xl pl-8" /></div><p className="text-xs text-muted-foreground">Entre 3 y 32 caracteres: letras, números y guion bajo.</p></div>
                  <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="public-profile-bio">Sobre mí</Label><span className="text-xs text-muted-foreground">{draft.descripcion_personal?.length || 0}/500</span></div><Textarea id="public-profile-bio" maxLength={500} rows={5} value={draft.descripcion_personal || ""} onChange={(event) => setDraft({ ...draft, descripcion_personal: event.target.value })} placeholder="Unas palabras sobre vos, tus intereses o lo que te gusta compartir..." className="resize-y rounded-xl" /></div>
                </div>
              </section>

              <section className="rounded-[26px] border border-[#d8dccd] bg-[#fbfaf6] p-6 shadow-sm dark:border-white/10 dark:bg-[#18291f] sm:p-8">
                <div className="flex items-start gap-4"><span className="font-serif text-3xl text-[#a77b36]">02</span><div><h2 className="font-serif text-2xl">Tu privacidad</h2><p className="mt-1 text-sm text-muted-foreground">Vos decidís si otras personas pueden abrir tu enlace.</p></div></div>
                <div className="mt-6 flex items-center justify-between gap-5 rounded-2xl border border-[#d8dccd] bg-[#f5f5ed] p-4 dark:border-white/10 dark:bg-white/5"><div><Label htmlFor="public-profile-visible" className="font-semibold">Perfil visible</Label><p className="mt-1 text-xs leading-5 text-muted-foreground">Si lo desactivás, el enlace dejará de mostrar tu perfil. Tu cuenta seguirá activa.</p></div><Switch id="public-profile-visible" checked={draft.is_public} onCheckedChange={(checked) => setDraft({ ...draft, is_public: checked })} /></div>
                <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><p>El enlace muestra solo tu nombre, usuario, foto y presentación. Tu correo{user.email ? ` (${user.email})` : ""} no se muestra allí.</p></div>
              </section>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={!changed || busy} className="h-11 rounded-xl bg-[#b83f2e] px-6 text-white hover:bg-[#a33325]">{busy ? "Guardando..." : "Guardar cambios"}</Button>
                {changed && <span className="text-xs font-medium text-[#8a5d22] dark:text-[#e5c579]">Tenés cambios sin guardar</span>}
              </div>
              {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${feedback.kind === "error" ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>{feedback.text}</p>}
            </form>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#8c702f] dark:text-[#e5c579]">Vista previa</p><p className="mt-1 text-xs text-muted-foreground">Así se verá tu presentación cuando guardes los cambios.</p></div>
              <PublicProfileCard profile={draft} avatarPreview={avatarPreview} />
              <div className="rounded-[24px] border border-[#d8dccd] bg-[#fbfaf6] p-5 dark:border-white/10 dark:bg-[#18291f]">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7ecd9] text-[#31533b] dark:bg-[#31533b] dark:text-white"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{saved.internal_access ? "Acceso interno habilitado" : "Cuenta pública"}</p><p className="text-xs text-muted-foreground">{saved.internal_access ? "Podés entrar a la plataforma interna." : "El administrador habilita el acceso interno."}</p></div></div>
                {saved.internal_access && <Button asChild variant="outline" className="mt-4 w-full rounded-xl"><Link to="/interno/dashboard">Ir a la plataforma</Link></Button>}
              </div>
              {saved.is_public && <div className="rounded-[24px] border border-[#d8dccd] bg-[#fbfaf6] p-5 dark:border-white/10 dark:bg-[#18291f]"><p className="text-sm font-semibold">Tu enlace público</p><p className="mt-1 break-all text-xs text-muted-foreground">{profileUrl}</p><div className="mt-4 flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void copyLink()} className="rounded-lg">{copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{copied ? "Copiado" : "Copiar"}</Button><Button asChild variant="ghost" size="sm" className="rounded-lg"><Link to={`/perfil-public/${saved.user_id}`}><ArrowUpRight className="mr-1.5 h-4 w-4" />Ver perfil</Link></Button></div></div>}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
