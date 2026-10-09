import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock3, Copy, LockKeyhole, Pencil, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicProfileCard, { type PublicIdentity } from "@/components/profile/PublicProfileCard";
import { apiFetch, BackendError } from "@/lib/backend";
import { cancelRequest, followUser, getFollowRelation, unfollowUser, type FollowStatus } from "@/lib/follows";
import { useSupabaseUser } from "@/providers/AppProviders";

export default function PerfilPublic() {
  const { id } = useParams();
  const { user } = useSupabaseUser();
  const [profile, setProfile] = useState<PublicIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); setError("Este perfil no está disponible."); return; }
    let active = true;
    setLoading(true);
    setError("");
    setNotFound(false);
    apiFetch<PublicIdentity>(`/v1/public/profiles/${encodeURIComponent(id)}`, { auth: "none" })
      .then((data) => { if (active) setProfile(data); })
      .catch((cause) => { if (active) { setProfile(null); setNotFound(cause instanceof BackendError && cause.status === 404); setError(cause instanceof Error ? cause.message : "No se pudo cargar el perfil."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retryKey]);

  useEffect(() => {
    if (!profile || !user || user.internal_access !== true || user.id === profile.user_id) return;
    let active = true;
    void getFollowRelation(profile.user_id).then((result) => {
      if (active && !result.error) setFollowStatus((result.data?.status as FollowStatus | undefined) ?? null);
    });
    return () => { active = false; };
  }, [profile?.user_id, user?.id, user?.internal_access]);

  const toggleFollow = async () => {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    setError("");
    try {
      if (followStatus === "accepted" || followStatus === "pending") {
        const result = followStatus === "pending" ? await cancelRequest(profile.user_id) : await unfollowUser(profile.user_id);
        if (result.error) throw result.error;
        setFollowStatus(null);
      } else {
        const result = await followUser(profile.user_id);
        if (result.error) throw result.error;
        const relation = await getFollowRelation(profile.user_id);
        setFollowStatus((relation.data?.status as FollowStatus | undefined) ?? result.followStatus ?? "pending");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el seguimiento.");
    } finally { setFollowBusy(false); }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch { setError("No se pudo copiar el enlace. Copialo desde la barra del navegador."); }
  };

  return (
    <div className="min-h-screen bg-[#f2f2e9] text-[#193428] dark:bg-[#101d17] dark:text-[#f7f3e8]">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#5b6d5d] transition-colors hover:text-[#193d2a] dark:text-[#bccfbd] dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Volver al inicio</Link>
        <div className="mt-8 text-center">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.23em] text-[#9b752c] dark:text-[#e5c579]"><Sparkles className="h-4 w-4" />Comunidad del Séptimo</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Personas que hacen camino</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Una forma sencilla de conocernos y compartir lo que nos une.</p>
        </div>

        {loading ? <p className="mt-12 text-center text-sm" role="status">Cargando perfil...</p> : profile ? (
          <div className="mx-auto mt-10 max-w-lg">
            <PublicProfileCard profile={profile} />
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {user?.id === profile.user_id && <Button asChild variant="outline" className="rounded-xl"><Link to="/mi-perfil"><Pencil className="mr-2 h-4 w-4" />Editar mi perfil</Link></Button>}
              {user?.internal_access === true && user.id !== profile.user_id && <Button type="button" disabled={followBusy} onClick={() => void toggleFollow()} className="rounded-xl"><span className="mr-2">{followStatus === "accepted" ? <Check className="h-4 w-4" /> : followStatus === "pending" ? <Clock3 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}</span>{followBusy ? "Actualizando..." : followStatus === "accepted" ? "Siguiendo · dejar de seguir" : followStatus === "pending" ? "Solicitud pendiente · cancelar" : "Seguir"}</Button>}
              <Button type="button" variant="outline" onClick={() => void copyLink()} className="rounded-xl">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Enlace copiado" : "Compartir enlace"}</Button>
            </div>
            {error && <p role="alert" className="mt-4 text-center text-sm text-red-700 dark:text-red-300">{error}</p>}
          </div>
        ) : (
          <section className="mx-auto mt-10 max-w-lg rounded-[28px] border border-[#d8dccd] bg-[#fbfaf6] p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#18291f]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9ebde] text-[#31513b] dark:bg-[#31513b] dark:text-white"><LockKeyhole className="h-6 w-6" /></span>
            <h2 className="mt-5 font-serif text-2xl">{notFound ? "Perfil no disponible" : "No se pudo cargar el perfil"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{notFound ? "Puede que su titular haya elegido mantenerlo privado o que el enlace ya no exista." : error || "Intentá nuevamente en unos instantes."}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2"><Button asChild variant="outline" className="rounded-xl"><Link to="/">Volver al inicio</Link></Button><Button type="button" variant="ghost" className="rounded-xl" onClick={() => setRetryKey((current) => current + 1)}>Reintentar</Button></div>
          </section>
        )}
      </div>
    </div>
  );
}
