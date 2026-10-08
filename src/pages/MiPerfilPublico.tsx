import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/backend";
import { useSupabaseUser } from "@/providers/AppProviders";

type PublicProfile = {
  nombre_completo: string;
  username: string | null;
  descripcion_personal: string | null;
  is_public: boolean;
  internal_access: boolean;
};

export default function MiPerfilPublico() {
  const { user, isUserLoading, refreshUser } = useSupabaseUser();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    apiFetch<PublicProfile>("/v1/me/profile")
      .then((data) => { if (active) { setProfile(data); setOriginalUsername(data.username); } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "No se pudo cargar el perfil."); });
    return () => { active = false; };
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setMessage("");
    try {
      const updated = await apiFetch<PublicProfile>("/v1/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          nombre_completo: profile.nombre_completo.trim(),
          ...(profile.username?.trim() !== originalUsername ? { username: profile.username?.trim() || undefined } : {}),
          descripcion_personal: profile.descripcion_personal?.trim() || null,
          is_public: profile.is_public,
        }),
      });
      setProfile(updated);
      setOriginalUsername(updated.username);
      await refreshUser();
      setMessage("Tu perfil se guardó correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
    } finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:pt-16">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Volver al inicio</Link>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-xl shadow-black/5">
        <div className="bg-[#193b2c] px-7 py-8 text-[#faf6ea] sm:px-10">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><UserRound className="h-7 w-7" /></div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e5bd63]">Tu espacio en el Séptimo</p>
          <h1 className="mt-2 font-serif text-4xl">Mi perfil</h1>
          <p className="mt-2 max-w-md text-sm text-white/70">Elegí cómo querés presentarte a la comunidad.</p>
        </div>
        <div className="p-7 sm:p-10">
          {isUserLoading ? <p>Cargando cuenta...</p> : !user ? <div className="space-y-4">
            <p>Iniciá sesión para ver y editar tu perfil.</p>
            <Button asChild><Link to="/mi-perfil?auth=login">Ingresar</Link></Button>
          </div> : !profile ? <p>{message || "Cargando perfil..."}</p> : <form onSubmit={save} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="profile-name">Nombre completo</Label><Input id="profile-name" required minLength={2} maxLength={160} value={profile.nombre_completo || ""} onChange={(event) => setProfile({ ...profile, nombre_completo: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="profile-username">Nombre de usuario</Label><Input id="profile-username" minLength={3} maxLength={30} pattern={profile.username === originalUsername ? undefined : "[A-Za-z0-9_]+"} value={profile.username || ""} onChange={(event) => setProfile({ ...profile, username: event.target.value })} /><p className="text-xs text-muted-foreground">Letras, números y guion bajo.</p></div>
            <div className="space-y-2"><Label htmlFor="profile-bio">Sobre mí</Label><Textarea id="profile-bio" maxLength={1000} rows={4} value={profile.descripcion_personal || ""} onChange={(event) => setProfile({ ...profile, descripcion_personal: event.target.value })} placeholder="Contá algo sobre vos..." /></div>
            <div className="flex items-center justify-between gap-5 rounded-2xl border border-border bg-muted/30 p-4"><div><Label htmlFor="profile-public">Perfil visible</Label><p className="mt-1 text-xs text-muted-foreground">Otros usuarios podrán ver tu nombre y descripción.</p></div><Switch id="profile-public" checked={profile.is_public} onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })} /></div>
            {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" disabled={busy} className="rounded-xl">{busy ? "Guardando..." : "Guardar cambios"}</Button>
          </form>}
        </div>
      </section>
      <aside className="h-fit rounded-[24px] border border-border bg-card p-6 shadow-sm">
        {profile?.internal_access ? <ShieldCheck className="h-7 w-7 text-emerald-600" /> : <BadgeCheck className="h-7 w-7 text-amber-600" />}
        <h2 className="mt-4 font-serif text-xl">{profile?.internal_access ? "Miembro habilitado" : "Cuenta pública"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile?.internal_access ? "Tenés acceso a la plataforma interna según tu unidad y rol." : "Podés usar el sitio y tu perfil. Solo el administrador puede habilitar el área interna."}</p>
        {profile?.internal_access && <Button asChild variant="outline" className="mt-5 w-full"><Link to="/interno/dashboard">Ir a la plataforma</Link></Button>}
      </aside>
    </div>
  </div>;
}
