// Sanitización básica para mostrar datos
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/[<>"']/g, "");
}
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  followUser,
  getFollowRelation,
  cancelRequest,
  unfollowUser,
} from "@/lib/follows";
import { UserPlus, UserMinus, Clock, Check, Loader2 } from "lucide-react";
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

const PerfilPublic = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [relation, setRelation] = useState<any | null>(null);
  const [minimalProfile, setMinimalProfile] = useState<{
    nombre_completo: string | null;
    username?: string | null;
  } | null>(null);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        if (isLocalBackend()) {
          try {
            const data = await apiFetch(`/profiles/${encodeURIComponent(id)}`);
            setProfile(data);
          } catch {
            // Fallback: directorio mánimo
            const directory = (await apiFetch(
              "/profiles/directory?q=&limit=200&offset=0",
            )) as any[];
            const row = (directory || []).find((r) => String(r.user_id) === String(id));
            if (row) setMinimalProfile({ nombre_completo: row.nombre_completo ?? null, username: row.username ?? null });
          }
        } else {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", id)
              .single();
            if (error) throw error;
            setProfile(data);
          } catch {
            // Fallback mediante RPC de directorio (SECURITY DEFINER)
            const { data: rpcData } = await supabase.rpc("list_profiles_directory");
            const list = (rpcData as any[]) || [];
            const row = list.find((r: any) => String(r.user_id) === String(id));
            if (row) setMinimalProfile({ nombre_completo: row.nombre_completo ?? null, username: row.username ?? null });
          }
        }
        // try to fetch relation status (if authenticated)
        const rel = await getFollowRelation(id);
        if (!rel.error) setRelation(rel.data);
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
  }, [id]);

  const status = useMemo(
    () => relation?.status as string | undefined,
    [relation],
  );

  const handleFollow = async () => {
    if (!id || actionLoading) return;

    setActionLoading(true);
    try {
      const { error } = await followUser(id);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solicitud enviada",
        description: "Te avisaremos cuando sea aceptada (si es privado).",
      });

      const rel = await getFollowRelation(id);
      if (!rel.error) setRelation(rel.data);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrUnfollow = async () => {
    if (!id || actionLoading) return;

    setActionLoading(true);
    try {
      if (status === "pending") {
        const { error } = await cancelRequest(id);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setRelation(null);
        toast({ title: "Solicitud cancelada" });
      } else if (status === "accepted") {
        const { error } = await unfollowUser(id);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setRelation(null);
        toast({ title: "Dejaste de seguir" });
        setShowUnfollowDialog(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background/60 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  const isAccessible = Boolean(
    profile && ((profile as any).is_public || (relation?.status === "accepted"))
  );

  const displayName = (profile?.nombre_completo ?? minimalProfile?.nombre_completo) || "Usuario Scout";
  const displayUsername = sanitizeText((profile as any)?.username || minimalProfile?.username || null);

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              userName={sanitizeText(displayName)}
              size="lg"
            />
            <div>
              <CardTitle>{sanitizeText(displayName)}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {(profile as any)?.is_public ? (
                  <p className="text-sm text-muted-foreground">
                    Perfil público
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Perfil privado
                  </p>
                )}
                {displayUsername && (
                  <span className="text-xs text-muted-foreground">@{displayUsername}</span>
                )}
                {status === "accepted" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Siguiendo
                  </span>
                )}
                {status === "pending" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            {status === "accepted" ? (
              <AlertDialog
                open={showUnfollowDialog}
                onOpenChange={setShowUnfollowDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Siguiendo
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Dejar de seguir?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ya no verás las publicaciones de{" "}
                      {sanitizeText(profile?.nombre_completo) || "este usuario"} en tu feed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelOrUnfollow}>
                      Dejar de seguir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : status === "pending" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelOrUnfollow}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Solicitud pendiente
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFollow}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>
          {isAccessible ? (
            <div className="space-y-3">
              <p>
                <strong>Teléfono:</strong> {sanitizeText(profile?.telefono) || "-"}
              </p>
              <p>
                <strong>Edad:</strong> {profile?.edad ?? "-"}
              </p>
              <p>
                <strong>Seisena:</strong> {sanitizeText(profile?.seisena) || "-"}
              </p>
              <p>
                <strong>Patrulla:</strong> {sanitizeText(profile?.patrulla) || "-"}
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Solo puedes ver el nombre y el usuario. Enváa una solicitud para ver más información.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPublic;

