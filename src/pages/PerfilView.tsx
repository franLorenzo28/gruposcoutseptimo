// Sanitización básica para mostrar datos
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/[<>"']/g, "");
}
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUser, isLocalBackend, apiFetch } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { getProfile, deleteMyAccount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings, Share2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";
import {
  getPendingRequestsForMe,
  acceptFollow,
  rejectFollow,
  getFollowersCount,
  getFollowingCount,
  getFollowersWithProfiles,
  getFollowingWithProfiles,
  followUser,
  unfollowUser,
  getFollowRelation,
} from "@/lib/follows";

type Tables = Database["public"]["Tables"];
type Profile = Tables["profiles"]["Row"];

const PerfilView = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Perfil mánimo para casos de privacidad (nombre/username)
  const [minimalProfile, setMinimalProfile] = useState<{
    nombre_completo: string | null;
    username?: string | null;
  } | null>(null);
  const [viewedUserEmail, setViewedUserEmail] = useState(""); // Email del usuario que estamos viendo
  const [pending, setPending] = useState<
    {
      follower_id: string;
      created_at: string;
      follower?: {
        id: string;
        nombre_completo: string | null;
        avatar_url: string | null;
        username?: string | null;
      };
    }[]
  >([]);
  const [userId, setUserId] = useState<string>("");
  const [viewingUserId, setViewingUserId] = useState<string>("");
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followersList, setFollowersList] = useState<
    Array<{
      follower_id: string;
      created_at: string;
      follower?: {
        id: string;
        nombre_completo: string | null;
        avatar_url: string | null;
        username?: string | null;
      };
    }>
  >([]);
  const [followingList, setFollowingList] = useState<
    Array<{
      followed_id: string;
      created_at: string;
      followed?: {
        id: string;
        nombre_completo: string | null;
        avatar_url: string | null;
        username?: string | null;
      };
    }>
  >([]);
  const [deleting, setDeleting] = useState(false);
  const [followStatus, setFollowStatus] = useState<"none" | "following" | "pending">("none");
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const auth = await getAuthUser();
        if (!auth) {
          navigate("/auth");
          return;
        }
        setUserId(auth.id);
        const viewingId = targetUserId || auth.id;
        setViewingUserId(viewingId);
        const isOwn = viewingId === auth.id;
        setIsOwnProfile(isOwn);

        // Vista unificada: nos quedamos en /perfil?userId=..., sin redirecciones

        let p = await getProfile(viewingId).catch(() => null);
        if (!p && isLocalBackend() && isOwn) {
          try {
            const ensured = (await apiFetch("/profiles/me")) as any;
            p = ensured || null;
          } catch {
            p = null;
          }
        }
        if (!p && !isOwn) {
          try {
            if (isLocalBackend()) {
              const data = (await apiFetch("/profiles/directory?q=&limit=200&offset=0")) as any[];
              const row = (data || []).find((r: any) => String(r.user_id) === String(viewingId));
              if (row) {
                setMinimalProfile({ nombre_completo: row.nombre_completo ?? null, username: row.username ?? null });
              }
            } else {
              const { data: rpcData } = await supabase.rpc("list_profiles_directory");
              const list = (rpcData as any[]) || [];
              const row = list.find((r: any) => String(r.user_id) === String(viewingId));
              if (row) {
                setMinimalProfile({ nombre_completo: row.nombre_completo ?? null, username: row.username ?? null });
              }
            }
          } catch {
            // ignora
          }
        }

        if (isOwn) {
          const { data: pend } = await getPendingRequestsForMe();
          setPending(
            pend
              ? pend.map((x: any) => ({
                  follower_id: String(x.follower_id),
                  created_at: String(x.created_at),
                  follower: x.follower
                    ? {
                        id: String(x.follower.user_id || x.follower.id),
                        nombre_completo: x.follower.nombre_completo ?? null,
                        avatar_url: x.follower.avatar_url ?? null,
                        username: x.follower.username ?? null,
                      }
                    : undefined,
                }))
              : [],
          );
        }

        const [{ count: fCount }, { count: gCount }] = await Promise.all([
          getFollowersCount(viewingId),
          getFollowingCount(viewingId),
        ]);
        setFollowersCount(fCount || 0);
        setFollowingCount(gCount || 0);
        setProfile(p ?? null);

        if (isOwn) setViewedUserEmail(auth.email || "");

        if (!isOwn) {
          const { data: relation } = await getFollowRelation(viewingId);
          if (relation) {
            setFollowStatus(relation.status === "accepted" ? "following" : "pending");
          } else {
            setFollowStatus("none");
          }
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "No se pudo cargar el perfil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUserId]);

  // Lazy load lists when dialogs open
  useEffect(() => {
    (async () => {
      try {
        if (followersOpen && viewingUserId) {
          const { data, error } = await getFollowersWithProfiles(viewingUserId, 0, 49);
          if (!error) {
            setFollowersList(
              (data || []).map((x: any) => ({
                follower_id: String(x.follower_id),
                created_at: String(x.created_at),
                follower: x.follower
                  ? {
                      id: String(x.follower.user_id || x.follower.id),
                      nombre_completo: x.follower.nombre_completo ?? null,
                      avatar_url: x.follower.avatar_url ?? null,
                      username: x.follower.username ?? null,
                    }
                  : undefined,
              })),
            );
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [followersOpen, viewingUserId]);

  useEffect(() => {
    (async () => {
      try {
        if (followingOpen && viewingUserId) {
          const { data, error } = await getFollowingWithProfiles(viewingUserId, 0, 49);
          if (!error) {
            setFollowingList(
              (data || []).map((x: any) => ({
                followed_id: String(x.followed_id),
                created_at: String(x.created_at),
                followed: x.followed
                  ? {
                      id: String(x.followed.user_id || x.followed.id),
                      nombre_completo: x.followed.nombre_completo ?? null,
                      avatar_url: x.followed.avatar_url ?? null,
                      username: x.followed.username ?? null,
                    }
                  : undefined,
              })),
            );
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [followingOpen, viewingUserId]);

  const getRamaActual = (edad: number | null) => {
    if (!edad) return "No especificada";
    if (edad >= 21) return "Adulto";
    if (edad >= 18) return "Rover";
    if (edad >= 15) return "Pionero";
    if (edad >= 11) return "Tropa";
    if (edad >= 7) return "Manada";
    return "No especificada";
  };

  const handleFollowToggle = async () => {
    if (!userId || !viewingUserId || followLoading) return;
    
    try {
      setFollowLoading(true);
      
      if (followStatus === "following") {
        // Dejar de seguir
        await unfollowUser(viewingUserId);
        setFollowStatus("none");
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Dejaste de seguir",
          description: `Ya no sigues a ${profile?.nombre_completo || "este usuario"}`,
        });
      } else if (followStatus === "pending") {
        // Solicitud pendiente
        toast({
          title: "Solicitud pendiente",
          description: "Tu solicitud aún está pendiente de aprobación",
        });
      } else {
        // Enviar solicitud de seguimiento
        await followUser(viewingUserId);
        setFollowStatus("pending");
        toast({
          title: "Solicitud enviada",
          description: `Se envió la solicitud de seguimiento a ${profile?.nombre_completo || "este usuario"}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo procesar la acción",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background/60 backdrop-blur-sm">
        {/* Navigation global en App.tsx */}
        <div className="h-20"></div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Construir bandera de vista restringida: perfil ajeno, no siguiendo y perfil no público
  const isRestrictedView = !isOwnProfile && (
    // si no hay perfil cargado, asumir privado (no accesible)
    !profile || !(profile as any).is_public
  ) && followStatus !== "following";

  // Vista restringida temprana: solo nombre/usuario y botón de seguir
  if (!loading && isRestrictedView) {
    return (
      <div className="min-h-screen bg-background/60 backdrop-blur-sm">
        <div className="h-16 sm:h-20"></div>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              userName={profile?.nombre_completo || minimalProfile?.nombre_completo || null}
              size="xl"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-3xl sm:text-4xl"
            />
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4 flex-wrap">
                <div className="flex flex-col items-center sm:items-start">
                  <h1 className="text-xl sm:text-2xl font-normal">
                    {sanitizeText(profile?.nombre_completo ?? minimalProfile?.nombre_completo) || "Usuario Scout"}
                  </h1>
                  {((profile as any)?.username || minimalProfile?.username) && (
                    <p className="text-sm text-muted-foreground">
                      @{(profile as any)?.username || minimalProfile?.username}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {!isOwnProfile && (
                    <Button
                      variant={followStatus === "pending" ? "outline" : "default"}
                      size="sm"
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      {followLoading
                        ? "Cargando..."
                        : followStatus === "pending"
                        ? "Solicitud enviada"
                        : "Seguir"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center sm:text-left">
                <p className="text-sm sm:text-base">
                  🔒 Este perfil es privado. Solo puedes ver el nombre y el usuario.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Enváa una solicitud de seguimiento para ver más información.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      {/* Navigation global en App.tsx */}
      <div className="h-16 sm:h-20"></div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header estilo Instagram (o vista restringida) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
          {/* Avatar */}
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            userName={profile?.nombre_completo || minimalProfile?.nombre_completo || null}
            size="xl"
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-3xl sm:text-4xl"
          />

          {/* Info y acciones */}
          <div className="flex-1 min-w-0 w-full">
            {/* Username y botones */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4 flex-wrap">
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-xl sm:text-2xl font-normal">
                  {(profile?.nombre_completo ?? minimalProfile?.nombre_completo) || "Usuario Scout"}
                </h1>
                {((profile as any)?.username || minimalProfile?.username) && (
                  <p className="text-sm text-muted-foreground">
                    @{sanitizeText((profile as any)?.username || minimalProfile?.username)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {!isOwnProfile && (
                  <Button
                    variant={followStatus === "following" ? "outline" : "default"}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {followLoading ? (
                      "Cargando..."
                    ) : followStatus === "following" ? (
                      "Siguiendo"
                    ) : followStatus === "pending" ? (
                      "Solicitud enviada"
                    ) : (
                      "Seguir"
                    )}
                  </Button>
                )}
                {isOwnProfile && (
                  <>
                    {profile?.edad && profile.edad >= 21 && profile.rol_adulto === "Educador/a" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate("/dashboard-coordinador")}
                        className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Dashboard</span>
                        <span className="xs:hidden">Dashboard</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/perfil/editar")}
                      className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Editar perfil</span>
                      <span className="xs:hidden">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/perfil/compartir")}
                      className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Compartir</span>
                      <span className="xs:hidden">Compartir</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                          disabled={deleting}
                        >
                          Eliminar cuenta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará tu usuario y todos los datos
                            asociados (perfil, follows, grupos, DMs, hilos) en el
                            backend local. No podrás deshacerlo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                setDeleting(true);
                                await deleteMyAccount();
                                // Cerrar sesión local y de Supabase por si estaba activa
                                try {
                                  localStorage.removeItem("local_api_token");
                                } catch {
                                  /* noop */
                                }
                                try {
                                  await supabase.auth.signOut();
                                } catch {
                                  /* noop */
                                }
                                toast({ title: "Cuenta eliminada" });
                                navigate("/auth");
                              } catch (err: any) {
                                toast({
                                  title: "Error",
                                  description: err?.message || "No se pudo eliminar la cuenta",
                                  variant: "destructive",
                                });
                              } finally {
                                setDeleting(false);
                              }
                            }}
                          >
                            Sá, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8 mb-4 justify-center sm:justify-start">
              <div className="text-center sm:text-left">
                <span className="font-semibold text-sm sm:text-base">
                  {profile.edad || "0"}
                </span>
                <span className="text-muted-foreground ml-1 text-xs sm:text-sm">
                  años
                </span>
              </div>
              {profile.edad && profile.edad < 21 && (
                <div className="text-center sm:text-left">
                  <span className="font-semibold text-xs sm:text-sm mr-1">
                    Rama
                  </span>
                  <span className="text-muted-foreground text-sm sm:text-base">
                    {getRamaActual(profile.edad)}
                  </span>
                </div>
              )}
              {profile.edad && profile.edad >= 21 && profile.rol_adulto && (
                <div className="text-center sm:text-left">
                  <span className="font-semibold text-xs sm:text-sm mr-1">
                    {profile.rol_adulto === "Educador/a" ? "Educador/a" : "Rol"}
                  </span>
                  <span className="text-muted-foreground text-sm sm:text-base">
                    {profile.rol_adulto === "Educador/a" && (profile as any).rama_que_educa
                      ? (() => {
                          const r = (profile as any).rama_que_educa;
                          const texto = r === "manada" ? "de Manada" :
                                        r === "tropa" ? "de Tropa" :
                                        r === "pioneros" ? "de Pioneros" :
                                        r === "rovers" ? "de Rovers" : "";
                          const emoji = r === "manada" ? "🐺" :
                                        r === "tropa" ? "⚜️" :
                                        r === "pioneros" ? "🏔️" :
                                        r === "rovers" ? "🚶" : "";
                          return `${emoji} Educador/a ${texto}`;
                        })()
                      : profile.rol_adulto}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setFollowersOpen(true)}
                className="text-center sm:text-left hover:text-primary transition-colors"
              >
                <span className="font-semibold text-sm sm:text-base">
                  {followersCount}
                </span>
                <span className="text-muted-foreground ml-1 text-xs sm:text-sm">
                  Seguidores
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFollowingOpen(true)}
                className="text-center sm:text-left hover:text-primary transition-colors"
              >
                <span className="font-semibold text-sm sm:text-base">
                  {followingCount}
                </span>
                <span className="text-muted-foreground ml-1 text-xs sm:text-sm">
                  Siguiendo
                </span>
              </button>
            </div>

            {/* Bio / Info */}
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-sm sm:text-base">
                {profile.nombre_completo}
              </p>
              {viewedUserEmail && isOwnProfile && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {viewedUserEmail}
                </p>
              )}
              {profile.telefono && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  📞 {sanitizeText(profile.telefono)}
                </p>
              )}
              {/* Para adultos ya mostramos Rol y Rama que educa arriba; no repetir aquá */}
            </div>
          </div>
        </div>

        {/* Información Scout en grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold">
              Información Scout
            </h2>

            {/* Mostrar unidades para jóvenes O para educadores adultos */}
            {(profile.seisena ||
              (profile?.edad && profile?.edad >= 7 && profile?.edad <= 20) ||
              (profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a")) && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  {profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a" 
                    ? "Manada (coordina)" 
                    : "Manada"}
                </h3>
                <p className="text-sm sm:text-base">
                  {profile?.seisena || "No especificada"}
                </p>
              </div>
            )}

            {(profile.patrulla ||
              (profile?.edad && profile?.edad >= 11 && profile?.edad <= 20) ||
              (profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a")) && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  {profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a" 
                    ? "Tropa (coordina)" 
                    : "Tropa"}
                </h3>
                <p className="text-sm sm:text-base">
                  {profile?.patrulla || "No especificada"}
                </p>
              </div>
            )}

            {(profile.equipo_pioneros ||
              (profile?.edad && profile?.edad >= 15 && profile?.edad <= 20) ||
              (profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a")) && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  {profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a" 
                    ? "Pioneros (coordina)" 
                    : "Pioneros"}
                </h3>
                <p className="text-sm sm:text-base">
                  {profile?.equipo_pioneros || "No especificado"}
                </p>
              </div>
            )}

            {(profile.comunidad_rovers ||
              (profile?.edad && profile?.edad >= 18 && profile?.edad <= 20) ||
              (profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a")) && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  {profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a" 
                    ? "Rovers (coordina)" 
                    : "Rovers"}
                </h3>
                <p className="text-sm sm:text-base">
                  {profile?.comunidad_rovers || "No especificada"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold">Detalles</h2>

            {profile?.fecha_nacimiento && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Fecha de nacimiento
                </h3>
                <p className="text-sm sm:text-base">
                  {(() => {
                    const s = String(profile?.fecha_nacimiento);
                    const [y, m, d] = s.split("-");
                    return `${d}/${m}/${y}`;
                  })()}
                </p>
              </div>
            )}

            {profile?.edad && profile?.edad < 21 && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Rama actual
                </h3>
                <p className="text-sm sm:text-base font-medium">
                  {getRamaActual(profile?.edad)}
                </p>
              </div>
            )}
            {profile?.edad && profile?.edad >= 21 && profile?.rol_adulto === "Educador/a" && (profile as any).rama_que_educa && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Labor educativa
                </h3>
                <p className="text-sm sm:text-base font-medium">
                  {(() => {
                    const r = (profile as any).rama_que_educa;
                    const unidad = r === "manada" ? profile.seisena :
                                   r === "tropa" ? profile.patrulla :
                                   r === "pioneros" ? profile.equipo_pioneros :
                                   r === "rovers" ? profile.comunidad_rovers : "";
                    const nombreRama = r === "manada" ? "Manada" :
                                      r === "tropa" ? "Tropa" :
                                      r === "pioneros" ? "Pioneros" :
                                      r === "rovers" ? "Rovers" : "";
                    const emoji = r === "manada" ? "🐺" :
                                  r === "tropa" ? "⚜️" :
                                  r === "pioneros" ? "🏔️" :
                                  r === "rovers" ? "🚶" : "";
                    return `${emoji} Educador/a de ${nombreRama}${unidad ? ` • ${unidad}` : ""}`;
                  })()}
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                Perfil
              </h3>
              <p className="text-sm sm:text-base">
                {(profile as any)?.is_public ? "🌍 Público" : "🔒 Privado"}
              </p>
            </div>

            {/* Solicitudes de seguimiento pendientes */}
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold">
                  Solicitudes de seguimiento
                </h3>
                {pending.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              {pending.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="text-4xl sm:text-5xl mb-2">📭</div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    No tienes solicitudes pendientes
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {pending.map((req) => (
                    <li
                      key={req.follower_id}
                      className="bg-background rounded-lg p-3 border shadow-sm"
                    >
                      {/* Móvil: Layout vertical */}
                      <div className="flex flex-col gap-3 sm:hidden">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatarUrl={req.follower?.avatar_url}
                            userName={req.follower?.nombre_completo}
                            size="md"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold truncate">
                              {req.follower?.nombre_completo || "Usuario"}
                            </span>
                            {req.follower?.username && (
                              <span className="text-xs text-muted-foreground truncate">
                                @{req.follower.username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full gap-1.5"
                            onClick={async () => {
                              const { error } = await acceptFollow(
                                req.follower_id,
                              );
                              if (error)
                                return toast({
                                  title: "Error",
                                  description:
                                    (error as any).message ||
                                    "No se pudo aceptar",
                                  variant: "destructive",
                                });
                              setPending((p) =>
                                p.filter(
                                  (x) => x.follower_id !== req.follower_id,
                                ),
                              );
                              setFollowersCount((c) => c + 1);
                              toast({ title: "Solicitud aceptada" });
                            }}
                          >
                            <Check className="w-4 h-4" /> Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5"
                            onClick={async () => {
                              const { error } = await rejectFollow(
                                req.follower_id,
                              );
                              if (error)
                                return toast({
                                  title: "Error",
                                  description:
                                    (error as any).message ||
                                    "No se pudo rechazar",
                                  variant: "destructive",
                                });
                              setPending((p) =>
                                p.filter(
                                  (x) => x.follower_id !== req.follower_id,
                                ),
                              );
                              toast({ title: "Solicitud rechazada" });
                            }}
                          >
                            <X className="w-4 h-4" /> Rechazar
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: Layout horizontal */}
                      <div className="hidden sm:flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <UserAvatar
                            avatarUrl={req.follower?.avatar_url}
                            userName={req.follower?.nombre_completo}
                            size="md"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate">
                              {req.follower?.nombre_completo || "Usuario"}
                            </span>
                            {req.follower?.username && (
                              <span className="text-xs text-muted-foreground truncate">
                                @{req.follower.username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5"
                            onClick={async () => {
                              const { error } = await acceptFollow(
                                req.follower_id,
                              );
                              if (error)
                                return toast({
                                  title: "Error",
                                  description:
                                    (error as any).message ||
                                    "No se pudo aceptar",
                                  variant: "destructive",
                                });
                              setPending((p) =>
                                p.filter(
                                  (x) => x.follower_id !== req.follower_id,
                                ),
                              );
                              setFollowersCount((c) => c + 1);
                              toast({ title: "Solicitud aceptada" });
                            }}
                          >
                            <Check className="w-4 h-4" /> Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={async () => {
                              const { error } = await rejectFollow(
                                req.follower_id,
                              );
                              if (error)
                                return toast({
                                  title: "Error",
                                  description:
                                    (error as any).message ||
                                    "No se pudo rechazar",
                                  variant: "destructive",
                                });
                              setPending((p) =>
                                p.filter(
                                  (x) => x.follower_id !== req.follower_id,
                                ),
                              );
                              toast({ title: "Solicitud rechazada" });
                            }}
                          >
                            <X className="w-4 h-4" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: Seguidores */}
      <Dialog open={followersOpen} onOpenChange={(o) => setFollowersOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <ul className="space-y-3">
              {followersList.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No tienes seguidores aún.
                </li>
              )}
              {followersList.map((item) => {
                const prof = (item as any).follower as
                  | {
                      id: string;
                      nombre_completo: string | null;
                      avatar_url: string | null;
                      username?: string | null;
                    }
                  | undefined;
                const displayName =
                  prof?.nombre_completo ||
                  `Usuario ${item.follower_id.slice(0, 8)}…`;
                const username = prof?.username;
                return (
                  <li
                    key={item.follower_id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatarUrl={prof?.avatar_url || undefined}
                        userName={displayName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayName}
                        </p>
                        {username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{username}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/perfil?userId=${item.follower_id}`)
                      }
                    >
                      Ver perfil
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog: Siguiendo */}
      <Dialog open={followingOpen} onOpenChange={(o) => setFollowingOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Siguiendo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <ul className="space-y-3">
              {followingList.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Aún no sigues a nadie.
                </li>
              )}
              {followingList.map((item) => {
                const prof = (item as any).followed as
                  | {
                      id: string;
                      nombre_completo: string | null;
                      avatar_url: string | null;
                      username?: string | null;
                    }
                  | undefined;
                const displayName =
                  prof?.nombre_completo ||
                  `Usuario ${item.followed_id.slice(0, 8)}…`;
                const username = prof?.username;
                return (
                  <li
                    key={item.followed_id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatarUrl={prof?.avatar_url || undefined}
                        userName={displayName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayName}
                        </p>
                        {username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{username}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/perfil?userId=${item.followed_id}`)
                      }
                    >
                      Ver perfil
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerfilView;

