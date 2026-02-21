import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
// Navigation es global en App.tsx
import UserAvatar from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Settings,
  Image as ImageIcon,
  Send,
  Trash2,
} from "lucide-react";
import {
  listGroupMembers,
  listGroupMessages,
  sendGroupMessage,
  promoteToAdmin,
  demoteToMember,
  kickMember,
  leaveGroup,
  deleteGroupMessage,
  deleteGroupDeep,
  inviteMembers,
  type GroupMessageWithSender,
} from "@/lib/groups";
import { isLocalBackend, apiFetch, getAuthUser } from "@/lib/backend";

export default function GrupoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<GroupMessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [userRole, setUserRole] = useState<"owner" | "admin" | "member" | null>(
    null,
  );
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [mutuals, setMutuals] = useState<
    Array<{
      user_id: string;
      nombre_completo: string | null;
      username: string | null;
      avatar_url: string | null;
    }>
  >([]);
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [usernameToAdd, setUsernameToAdd] = useState("");

  useEffect(() => {
    loadGroupData();
  }, [id]);

  // Real-time/polling de mensajes
  useEffect(() => {
    if (!id) return;
    if (isLocalBackend()) {
      const interval = setInterval(async () => {
        try {
          const msgs = await listGroupMessages(id);
          setMessages(msgs);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (e) {
          // ignore polling errors
        }
      }, 1500);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel(`group_messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, nombre_completo, username, avatar_url")
            .eq("user_id", newMsg.sender_id)
            .single();

          const enriched: GroupMessageWithSender = {
            ...newMsg,
            sender_name: profile?.nombre_completo,
            sender_username: profile?.username,
            sender_avatar: profile?.avatar_url,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadGroupData = async () => {
    if (!id) return;

    try {
      if (isLocalBackend()) {
        const auth = await getAuthUser();
        if (!auth) {
          navigate("/auth");
          return;
        }
        setCurrentUserId(auth.id);

        const g: any = await apiFetch(`/groups/${id}`);
        setGroup({ ...g, cover_image: g.cover_url ?? null });

        const membersData = await listGroupMembers(id);
        setMembers(membersData);
        const mine = membersData.find(
          (m: any) => String(m.user_id) === String(auth.id),
        );
        if (!mine) {
          toast({
            title: "Acceso denegado",
            description: "No eres miembro de este grupo",
            variant: "destructive",
          });
          navigate("/usuarios");
          return;
        }
        setUserRole(mine.role);

        const messagesData = await listGroupMessages(id);
        setMessages(messagesData);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        setCurrentUserId(user.id);

        // Cargar grupo
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", id)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Verificar membresáa y rol
        const { data: membership } = await supabase
          .from("group_members")
          .select("role")
          .eq("group_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!membership) {
          toast({
            title: "Acceso denegado",
            description: "No eres miembro de este grupo",
            variant: "destructive",
          });
          navigate("/usuarios");
          return;
        }

        setUserRole(membership.role);

        // Cargar miembros y mensajes
        const [membersData, messagesData] = await Promise.all([
          listGroupMembers(id),
          listGroupMessages(id),
        ]);

        setMembers(membersData);
        setMessages(messagesData);
      }

      // Scroll al final
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim()) return;

    const tempMessage = newMessage.trim();
    setNewMessage("");

    try {
      await sendGroupMessage(id, tempMessage);
    } catch (e: any) {
      setNewMessage(tempMessage);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!id) return;
    try {
      await promoteToAdmin(id, userId);
      toast({ title: "Miembro promovido a administrador" });
      await loadGroupData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDemoteToMember = async (userId: string) => {
    if (!id) return;
    try {
      await demoteToMember(id, userId);
      toast({ title: "Administrador degradado a miembro" });
      await loadGroupData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleKickMember = async (userId: string) => {
    if (!id || !confirm("¿Expulsar a este miembro del grupo?")) return;
    try {
      await kickMember(id, userId);
      toast({ title: "Miembro expulsado del grupo" });
      await loadGroupData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !confirm("¿Estás seguro de que quieres salir de este grupo?"))
      return;
    try {
      await leaveGroup(id);
      toast({ title: "Has salido del grupo" });
      navigate("/usuarios");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    try {
      await deleteGroupDeep(id);
      toast({ title: "Grupo eliminado" });
      navigate("/usuarios");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const loadMutualFollowers = async () => {
    if (!id || !currentUserId) return;
    try {
      // Obtener follows que sigo (aceptados)
      const { data: iFollow, error: e1 } = await supabase
        .from("follows")
        .select("followed_id, status")
        .eq("follower_id", currentUserId)
        .eq("status", "accepted");
      if (e1) throw e1;

      // Obtener follows que me siguen (aceptados)
      const { data: followsMe, error: e2 } = await supabase
        .from("follows")
        .select("follower_id, status")
        .eq("followed_id", currentUserId)
        .eq("status", "accepted");
      if (e2) throw e2;

      const iFollowSet = new Set((iFollow || []).map((f) => f.followed_id));
      const followsMeSet = new Set((followsMe || []).map((f) => f.follower_id));

      // Intersección: mutuos
      const mutualIds: string[] = [];
      iFollowSet.forEach((uid: unknown) => {
        if (typeof uid === "string" && followsMeSet.has(uid))
          mutualIds.push(uid);
      });

      // Excluir ya miembros
      const memberIds = new Set(members.map((m) => m.user_id));
      const candidates = mutualIds.filter(
        (uid) => !memberIds.has(uid) && uid !== currentUserId,
      );

      if (candidates.length === 0) {
        setMutuals([]);
        setSelectedInvites(new Set());
        return;
      }

      const { data: profiles, error: e3 } = await supabase
        .from("profiles")
        .select("user_id, nombre_completo, username, avatar_url")
        .in("user_id", candidates);
      if (e3) throw e3;

      setMutuals(
        (profiles || []).map((p) => ({
          user_id: p.user_id as string,
          nombre_completo: (p as any).nombre_completo ?? null,
          username: (p as any).username ?? null,
          avatar_url: (p as any).avatar_url ?? null,
        })),
      );
      setSelectedInvites(new Set());
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleInviteSelected = async () => {
    if (!id || selectedInvites.size === 0) return;
    setInviteLoading(true);
    try {
      const { inserted, skipped } = await inviteMembers(
        id,
        Array.from(selectedInvites),
      );
      toast({
        title: "Invitaciones",
        description: `Agregados: ${inserted}. Omitidos: ${skipped}.`,
      });
      await loadGroupData();
      setShowInvite(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    try {
      await deleteGroupMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast({ title: "Mensaje eliminado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  if (!group) return null;

  const canManageMembers = userRole === "owner" || userRole === "admin";

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      {/* Navigation global en App.tsx */}
      <div className="h-16 sm:h-20"></div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/usuarios")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {group.cover_image && (
            <img
              src={group.cover_image}
              alt={group.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              {userRole === "owner" && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
              {userRole === "admin" && (
                <Shield className="h-5 w-5 text-blue-500" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {members.length} {members.length === 1 ? "miembro" : "miembros"}
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={showMembers} onOpenChange={setShowMembers}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Miembros
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Miembros del grupo ({members.length})
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-[60vh] overflow-auto">
                  {members.map((member) => {
                    const isCurrentUser = member.user_id === currentUserId;
                    const isOwner = member.role === "owner";
                    const isMemberAdmin = member.role === "admin";

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                      >
                        <UserAvatar
                          avatarUrl={member.avatar_url}
                          userName={member.nombre_completo}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {member.nombre_completo || "Scout"}
                            </span>
                            {isOwner && (
                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
                            {isMemberAdmin && (
                              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">
                                Tú
                              </Badge>
                            )}
                          </div>
                          {member.username && (
                            <p className="text-xs text-muted-foreground">
                              @{member.username}
                            </p>
                          )}
                        </div>

                        {canManageMembers && !isOwner && !isCurrentUser && (
                          <div className="flex gap-1">
                            {isMemberAdmin ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDemoteToMember(member.user_id)
                                }
                              >
                                Quitar admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handlePromoteToAdmin(member.user_id)
                                }
                              >
                                Hacer admin
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleKickMember(member.user_id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            {(userRole === "owner" || userRole === "admin") && (
              <Dialog
                open={showInvite}
                onOpenChange={(o) => {
                  setShowInvite(o);
                  if (o) loadMutualFollowers();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invitar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Invitar seguidores en común</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-[60vh] overflow-auto">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Agregar por @username"
                        value={usernameToAdd}
                        onChange={(e) => setUsernameToAdd(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const u = usernameToAdd.trim().replace(/^@/, "");
                          if (!u) return;
                          try {
                            const { data: prof, error } = await supabase
                              .from("profiles")
                              .select(
                                "user_id, nombre_completo, username, avatar_url",
                              )
                              .eq("username", u)
                              .maybeSingle();
                            if (error) throw error;
                            if (!prof) {
                              toast({
                                title: "No encontrado",
                                description:
                                  "No existe un usuario con ese username",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (
                              prof.user_id === currentUserId ||
                              members.some((m) => m.user_id === prof.user_id)
                            ) {
                              toast({
                                title: "Ya es miembro",
                                description:
                                  "Este usuario ya está en el grupo o eres tú mismo",
                                variant: "destructive",
                              });
                              return;
                            }
                            // Agregar a la lista visual si no estaba
                            setMutuals((prev) => {
                              if (prev.some((x) => x.user_id === prof.user_id))
                                return prev;
                              return [
                                ...prev,
                                {
                                  user_id: prof.user_id as string,
                                  nombre_completo:
                                    (prof as any).nombre_completo ?? null,
                                  username: (prof as any).username ?? null,
                                  avatar_url: (prof as any).avatar_url ?? null,
                                },
                              ];
                            });
                            setSelectedInvites((prev) =>
                              new Set(prev).add(prof.user_id as string),
                            );
                            setUsernameToAdd("");
                          } catch (e: any) {
                            toast({
                              title: "Error",
                              description: e.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Añadir
                      </Button>
                    </div>
                    {mutuals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No tienes seguidores en común disponibles para invitar.
                      </p>
                    ) : (
                      mutuals.map((m) => (
                        <div
                          key={m.user_id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                        >
                          <UserAvatar
                            avatarUrl={m.avatar_url}
                            userName={m.nombre_completo}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {m.nombre_completo || "Scout"}
                              </span>
                              {m.username && (
                                <span className="text-xs text-muted-foreground truncate">
                                  @{m.username}
                                </span>
                              )}
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedInvites.has(m.user_id)}
                            onCheckedChange={(checked) => {
                              setSelectedInvites((prev) => {
                                const next = new Set(prev);
                                if (checked === true) next.add(m.user_id);
                                else next.delete(m.user_id);
                                return next;
                              });
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowInvite(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleInviteSelected}
                      disabled={selectedInvites.size === 0 || inviteLoading}
                    >
                      {inviteLoading ? "Invitando…" : "Invitar seleccionados"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {userRole !== "owner" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive"
                onClick={handleLeaveGroup}
              >
                Salir del grupo
              </Button>
            )}

            {userRole === "owner" && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar grupo
                </Button>
                <AlertDialog
                  open={confirmDeleteOpen}
                  onOpenChange={setConfirmDeleteOpen}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Eliminar el grupo "{group.name}"?
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Esta acción es permanente y eliminará todos los mensajes y
                      miembros del grupo.
                    </p>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDeleteGroup}
                      >
                        Eliminar definitivamente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Chat */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col h-[calc(100vh-300px)]">
              <div className="flex-1 overflow-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay mensajes aún. ¡Sé el primero en escribir!
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      const canDelete = isMine || canManageMembers;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
                        >
                          <UserAvatar
                            avatarUrl={msg.sender_avatar || null}
                            userName={msg.sender_name || null}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div
                            className={`flex-1 max-w-[75%] ${isMine ? "text-right" : ""}`}
                          >
                            <div
                              className={`inline-block rounded-lg px-3 py-2 ${
                                isMine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {!isMine && (
                                <div className="text-xs opacity-70 mb-1">
                                  {msg.sender_username
                                    ? `@${msg.sender_username}`
                                    : msg.sender_name || "Scout"}
                                </div>
                              )}
                              <div className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </div>
                              <div
                                className={`text-xs mt-1 flex items-center gap-2 ${
                                  isMine
                                    ? "opacity-70 justify-end"
                                    : "opacity-50"
                                }`}
                              >
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString(
                                    "es-ES",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

