import { useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch, getAuthUser } from "@/lib/backend";
import { useDebounce } from "@/hooks/use-debounce";
import UserAvatar from "@/components/UserAvatar";
import EmailVerificationGuard from "@/components/EmailVerificationGuard";
import {
  useProfiles,
  useThreads,
  useGroups,
  usePresence,
  type PresenceStatus,
} from "@/hooks/useQueryData";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users as UsersIcon,
  SlidersHorizontal,
  UserPlus,
  Settings,
  Crown,
  Shield,
  MessageCircle,
  Archive as ArchiveIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createThread,
  listThreads,
  listComments,
  addComment,
  deleteThread,
  isAdmin,
  type ThreadWithAuthor,
} from "@/lib/threads";
import {
  listGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  type GroupWithMemberCount,
} from "@/lib/groups";
import { Trash2, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  RAMA_LABEL,
  getRamaFromProfile,
  getRamaLabel,
  type RamaKey,
  type RamaProfileFields,
} from "@/lib/rama";

type Profile = RamaProfileFields & {
  user_id: string;
  nombre_completo: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  username?: string | null;
};

const ENABLE_RAMA_FILTER = false;

const Usuarios = () => {
  const [activeTab, setActiveTab] = useState<string>("personas");
  const shouldLoadThreads = activeTab === "hilos";
  const shouldLoadGroups = activeTab === "grupos";

  // React Query hooks (reemplazan useState + useEffect)
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: threadsData = [], isLoading: loadingThreads, refetch: refetchThreads } = useThreads(shouldLoadThreads);
  const { data: groupsData = [], isLoading: loadingGroups, refetch: refetchGroups } = useGroups(shouldLoadGroups);

  const [searchTerm, setSearchTerm] = useState("");
  const [ramaFilter, setRamaFilter] = useState<RamaKey | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newThreadText, setNewThreadText] = useState("");
  const [newThreadFile, setNewThreadFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [threadComments, setThreadComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Estados para grupos
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupCover, setNewGroupCover] = useState<File | null>(null);
  const [groupCoverPreview, setGroupCoverPreview] = useState<string | null>(
    null,
  );
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupAction, setGroupAction] = useState<{
    groupId: string;
    type: "join" | "leave";
  } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 220);

  const loading =
    loadingProfiles ||
    (activeTab === "hilos" && loadingThreads) ||
    (activeTab === "grupos" && loadingGroups);

  const profileById = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((profile) => {
      map.set(profile.user_id, profile);
    });
    return map;
  }, [profiles]);

  const currentUserProfile = useMemo(
    () => profileById.get(currentUserId) || null,
    [profileById, currentUserId],
  );

  const [supabasePresenceById, setSupabasePresenceById] = useState<
    Map<string, PresenceStatus>
  >(new Map());

  const presenceIds = useMemo(
    () => profiles.map((p) => p.user_id).sort(),
    [profiles],
  );

  const { data: presenceRows = [] } = usePresence(
    presenceIds,
    activeTab === "personas" && isLocalBackend(),
  );

  const presenceById = useMemo(() => {
    const map = new Map<string, PresenceStatus>();
    for (const row of presenceRows) {
      map.set(row.user_id, row.status);
    }
    return map;
  }, [presenceRows]);

  useEffect(() => {
    if (!isLocalBackend() || !currentUserId) return;

    const AWAY_AFTER_MS = 90_000;
    let lastActivityAt = Date.now();
    let currentStatus: "active" | "away" = "active";

    const sendHeartbeat = async (status: "active" | "away") => {
      await apiFetch("/presence/heartbeat", {
        method: "POST",
        body: JSON.stringify({ status }),
      }).catch(() => {
        // Silencioso para no interrumpir UX.
      });
    };

    const setActive = () => {
      lastActivityAt = Date.now();
      if (currentStatus !== "active") {
        currentStatus = "active";
        void sendHeartbeat("active");
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (currentStatus !== "away") {
          currentStatus = "away";
          void sendHeartbeat("away");
        }
        return;
      }
      setActive();
    };

    const onActivity = () => setActive();

    void sendHeartbeat("active");

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityAt;
      const nextStatus: "active" | "away" =
        document.hidden || idleFor > AWAY_AFTER_MS ? "away" : "active";

      if (nextStatus !== currentStatus) {
        currentStatus = nextStatus;
      }

      void sendHeartbeat(currentStatus);
    }, 30_000);

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (isLocalBackend() || !currentUserId) return;

    const AWAY_AFTER_MS = 90_000;
    let lastActivityAt = Date.now();
    let currentStatus: "active" | "away" = "active";

    const channel = supabase.channel("presence:comuni7", {
      config: { presence: { key: currentUserId } },
    });

    const syncPresence = () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ user_id?: string; status?: string }>
      >;
      const next = new Map<string, PresenceStatus>();

      for (const [key, entries] of Object.entries(state)) {
        const userId = entries[0]?.user_id || key;
        let resolved: PresenceStatus = "offline";

        if (entries.some((entry) => entry?.status === "active")) {
          resolved = "active";
        } else if (entries.some((entry) => entry?.status === "away")) {
          resolved = "away";
        } else if (entries.length > 0) {
          resolved = "active";
        }

        next.set(userId, resolved);
      }

      next.set(currentUserId, currentStatus);
      setSupabasePresenceById(next);
    };

    const trackPresence = async (status: "active" | "away") => {
      currentStatus = status;
      await channel
        .track({
          user_id: currentUserId,
          status,
          last_seen_at: new Date().toISOString(),
        })
        .catch(() => {
          // Silencioso para no afectar UX.
        });
      syncPresence();
    };

    const setActive = () => {
      lastActivityAt = Date.now();
      if (currentStatus !== "active") {
        void trackPresence("active");
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (currentStatus !== "away") {
          void trackPresence("away");
        }
        return;
      }
      setActive();
    };

    const onActivity = () => setActive();

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void trackPresence("active");
        }
      });

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityAt;
      const nextStatus: "active" | "away" =
        document.hidden || idleFor > AWAY_AFTER_MS ? "away" : "active";

      void trackPresence(nextStatus);
    }, 30_000);

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const getPresenceMeta = (status: PresenceStatus) => {
    if (status === "active") {
      return {
        label: "Activo",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (status === "away") {
      return {
        label: "Ausente",
        dotClass: "bg-amber-500",
        textClass: "text-amber-600 dark:text-amber-400",
      };
    }
    return {
      label: "Desconectado",
      dotClass: "bg-muted-foreground/60",
      textClass: "text-muted-foreground",
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const auth = await getAuthUser();
        if (!auth) {
          navigate("/auth");
          return;
        }
        setCurrentUserId(auth.id);
        setUserEmail(auth.email || "");
      } catch (err) {
        console.error("Error cargando usuario:", err);
      }
    })();
  }, [navigate]);

  // Enriquecer threads con datos del autor (useMemo para evitar recalcular)
  const threads = useMemo(() => {
    return threadsData.map((thread) => {
      const author = profileById.get(thread.author_id);
      return {
        ...thread,
        author_name: author?.nombre_completo,
        author_username: author?.username,
        author_avatar: author?.avatar_url,
      };
    });
  }, [threadsData, profileById]);

  const groups = groupsData;

  // Filtrado y ordenamiento con useMemo (optimización)
  const filteredProfiles = useMemo(() => {
    let filtered = profiles;

    // Filter by search term
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const searchable = [
          p.nombre_completo || "",
          p.username || "",
          getRamaLabel(p),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(term);
      });
    }

    // Filter by rama
    if (ENABLE_RAMA_FILTER && ramaFilter !== "all") {
      filtered = filtered.filter((p) => getRamaFromProfile(p) === ramaFilter);
    }

    // Filter by visibility
    if (visibilityFilter === "public") {
      filtered = filtered.filter((p) => p.is_public === true);
    } else if (visibilityFilter === "private") {
      filtered = filtered.filter((p) => p.is_public !== true);
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) =>
        (a.nombre_completo || "").localeCompare(b.nombre_completo || ""),
      );
    } else if (sortBy === "age-asc") {
      sorted.sort((a, b) => (a.edad || 0) - (b.edad || 0));
    } else if (sortBy === "age-desc") {
      sorted.sort((a, b) => (b.edad || 0) - (a.edad || 0));
    } else if (sortBy === "rama") {
      const ramaOrder: Record<RamaKey, number> = {
        manada: 1,
        tropa: 2,
        pioneros: 3,
        rovers: 4,
        adulto: 5,
        "sin-rama": 6,
      };
      sorted.sort((a, b) => {
        const ramaA = getRamaFromProfile(a);
        const ramaB = getRamaFromProfile(b);
        return ramaOrder[ramaA] - ramaOrder[ramaB];
      });
    }

    return sorted;
  }, [profiles, debouncedSearchTerm, ramaFilter, visibilityFilter, sortBy]);

  const submitThread = async () => {
    if (!newThreadText.trim() && !newThreadFile) return;

    // Validación de longitud
    if (newThreadText.length > 500) {
      toast({
        title: "Contenido muy largo",
        description: "El hilo no puede exceder 500 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setPosting(true);
      const thread = await createThread(
        newThreadText.trim(),
        newThreadFile || undefined,
      );

      // Enriquecer con datos del autor actual
      const author = profiles.find((p) => p.user_id === currentUserId);
      const enriched: ThreadWithAuthor = {
        ...thread,
        author_name: author?.nombre_completo,
        author_username: author?.username,
        author_avatar: author?.avatar_url,
      };

      // Refrescar threads con React Query
      await refetchThreads();
      setNewThreadText("");
      setNewThreadFile(null);
      setImagePreview(null);

      toast({
        title: "Hilo publicado",
        description: "Tu hilo se ha publicado correctamente",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo publicar el hilo",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validación de tipo
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP)",
          variant: "destructive",
        });
        return;
      }

      // Validación de tamaño
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no puede superar 5MB",
          variant: "destructive",
        });
        return;
      }

      setNewThreadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewThreadFile(null);
    setImagePreview(null);
  };

  const openThread = async (threadId: string) => {
    setOpenThreadId(threadId);
    try {
      const comments = await listComments(threadId);
      setThreadComments(comments);
    } catch (e) {
      console.error(e);
    }
  };

  const sendComment = async () => {
    if (!openThreadId || !newCommentText.trim()) return;
    try {
      const c = await addComment(openThreadId, newCommentText.trim());
      setThreadComments((prev) => [...prev, c]);
      setNewCommentText("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm("¿Estás seguro de eliminar este hilo?")) return;
    try {
      await deleteThread(threadId);
      await refetchThreads(); // Refrescar con React Query
      toast({
        title: "Hilo eliminado",
        description: "El hilo se eliminó correctamente",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Funciones para grupos
  const handleGroupCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP)",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no puede superar 5MB",
          variant: "destructive",
        });
        return;
      }

      setNewGroupCover(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre del grupo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingGroup(true);
      await createGroup(
        newGroupName.trim(),
        newGroupDescription.trim() || null,
        newGroupCover || undefined,
      );

      toast({
        title: "Grupo creado",
        description: "El grupo se ha creado correctamente",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupCover(null);
      setGroupCoverPreview(null);
      setShowCreateGroup(false);
      await refetchGroups(); // Refrescar con React Query
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo crear el grupo",
        variant: "destructive",
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setGroupAction({ groupId, type: "join" });
    try {
      await joinGroup(groupId);
      toast({
        title: "Te has unido al grupo",
        description: "Ahora eres miembro de este grupo",
      });
      await refetchGroups(); // Refrescar con React Query
    } catch (e: any) {
      const raw = String(e?.message || "").toLowerCase();
      const alreadyMember =
        raw.includes("duplicate") ||
        raw.includes("23505") ||
        raw.includes("already") ||
        raw.includes("already exists");

      toast({
        title: alreadyMember ? "Ya eres miembro" : "Error",
        description: alreadyMember
          ? "Ya formas parte de este grupo."
          : e.message || "No se pudo unir al grupo",
        variant: "destructive",
      });
      if (alreadyMember) {
        await refetchGroups();
      }
    } finally {
      setGroupAction(null);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("¿Estás seguro de que quieres salir de este grupo?")) return;

    setGroupAction({ groupId, type: "leave" });
    try {
      await leaveGroup(groupId);
      toast({
        title: "Has salido del grupo",
        description: "Ya no eres miembro de este grupo",
      });
      await refetchGroups(); // Refrescar con React Query
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo salir del grupo",
        variant: "destructive",
      });
    } finally {
      setGroupAction(null);
    }
  };

  // Renderizado con resaltado de menciones @usuario
  const renderWithMentions = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const regex = /@([A-Za-z0-9_]{3,32})/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={"t" + match.index}>{text.slice(lastIndex, match.index)}</span>);
      }
      parts.push(
        <span key={"m" + match.index} className="text-primary font-semibold">
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(<span key="end">{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  return (
    <EmailVerificationGuard featureName="Comuni 7">
    {loading ? (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    ) : (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header moderno */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Comuni 7</h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Personas, hilos y grupos de la comunidad scout.
                </p>
              </div>
            </div>

            <Badge className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground border-0 px-3 py-1">
              Comunidad activa
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-xs hover:border-primary/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personas</p>
              <p className="relative text-2xl font-bold text-primary mt-2">{profiles.length}</p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-blue-500/5 to-background p-4 backdrop-blur-xs hover:border-blue-500/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hilos</p>
              <p className="relative text-2xl font-bold text-blue-500 mt-2">{shouldLoadThreads ? threads.length : "-"}</p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-green-500/5 to-background p-4 backdrop-blur-xs hover:border-green-500/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupos</p>
              <p className="relative text-2xl font-bold text-green-500 mt-2">{shouldLoadGroups ? groups.length : "-"}</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
          <Link to="/mensajes">
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 sm:p-6 flex items-center gap-4">
                <div className="flex-shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:shadow-lg transition-all">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Mensajes</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Conectá con otros scouts
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/archivo">
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 sm:p-6 flex items-center gap-4">
                <div className="flex-shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:shadow-lg transition-all">
                  <ArchiveIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Archivo y Galería</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Explorá fotos e historia
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-5 sm:mb-6 h-auto w-full justify-start gap-1.5 rounded-lg border border-border/50 bg-card/60 p-1.5 backdrop-blur-xs">
            <TabsTrigger value="personas" className="text-xs sm:text-sm rounded-md px-3 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Personas</TabsTrigger>
            <TabsTrigger value="hilos" className="text-xs sm:text-sm rounded-md px-3 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Hilos</TabsTrigger>
            <TabsTrigger value="grupos" className="text-xs sm:text-sm rounded-md px-3 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="personas" className="mt-0 space-y-3 sm:space-y-4">
            {/* Búsqueda */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-xs shadow-sm">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Filtros y ordenamiento */}
                <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-3">
              {/* Filtro por unidad */}
                  <div>
                <label className="text-xs sm:text-sm font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                  Unidad
                </label>
                <Select
                  value={ENABLE_RAMA_FILTER ? ramaFilter : "all"}
                  onValueChange={(value) => setRamaFilter(value as RamaKey | "all")}
                  disabled={!ENABLE_RAMA_FILTER}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las unidades</SelectItem>
                    <SelectItem value="manada">
                      🐺 Manada (7-10 años)
                    </SelectItem>
                    <SelectItem value="tropa">⛺ Tropa (11-14 años)</SelectItem>
                    <SelectItem value="pioneros">
                      🏕️ Pioneros (15-17 años)
                    </SelectItem>
                    <SelectItem value="rovers">
                      🎒 Rovers (18-20 años)
                    </SelectItem>
                    <SelectItem value="adulto">
                      👤 Adultos (21+ años)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!ENABLE_RAMA_FILTER && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Filtro por unidad temporalmente deshabilitado.
                  </p>
                )}
                  </div>

              {/* Filtro por visibilidad */}
                  <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Privacidad
                </label>
                <Select
                  value={visibilityFilter}
                  onValueChange={setVisibilityFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos los perfiles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los perfiles</SelectItem>
                    <SelectItem value="public">🌍 Solo públicos</SelectItem>
                    <SelectItem value="private">🔒 Solo privados</SelectItem>
                  </SelectContent>
                </Select>
                  </div>

              {/* Ordenamiento */}
                  <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre (A-Z)</SelectItem>
                    <SelectItem value="age-asc">
                      Edad (menor a mayor)
                    </SelectItem>
                    <SelectItem value="age-desc">
                      Edad (mayor a menor)
                    </SelectItem>
                    <SelectItem value="rama">Unidad (Manada → Adulto)</SelectItem>
                  </SelectContent>
                </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtros activos (badges) */}
            {((ENABLE_RAMA_FILTER && ramaFilter !== "all") ||
              visibilityFilter !== "all" ||
              searchTerm) && (
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filtros activos:</span>
                </div>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Búsqueda: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {ENABLE_RAMA_FILTER && ramaFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {RAMA_LABEL[ramaFilter]}
                    <button
                      onClick={() => setRamaFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {visibilityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {visibilityFilter === "public"
                      ? "🌍 Públicos"
                      : "🔒 Privados"}
                    <button
                      onClick={() => setVisibilityFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {((ENABLE_RAMA_FILTER && ramaFilter !== "all") ||
                  visibilityFilter !== "all" ||
                  searchTerm) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm("");
                      if (ENABLE_RAMA_FILTER) setRamaFilter("all");
                      setVisibilityFilter("all");
                    }}
                    className="h-6 text-xs"
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mb-6 text-sm text-muted-foreground">
              {filteredProfiles.length === profiles.length ? (
                <p>
                  {profiles.length} {profiles.length === 1 ? "scout" : "scouts"}{" "}
                  en total
                </p>
              ) : (
                <p>
                  {filteredProfiles.length}{" "}
                  {filteredProfiles.length === 1 ? "resultado" : "resultados"}{" "}
                  de {profiles.length}
                </p>
              )}
            </div>

            {/* Grid de usuarios - Balance: Info visible + Diseño Instagram */}
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No se encontraron scouts.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProfiles.map((profile) => {
                  const isCurrentUser = profile.user_id === currentUserId;
                  const localStatus = presenceById.get(profile.user_id);
                  const supaStatus = supabasePresenceById.get(profile.user_id);
                  const status = isLocalBackend()
                    ? isCurrentUser
                      ? localStatus || "active"
                      : localStatus || "offline"
                    : isCurrentUser
                      ? supaStatus || "active"
                      : supaStatus || "offline";
                  const presence = getPresenceMeta(status);
                  return (
                    <Card
                      key={profile.user_id}
                      className="border-border/50 bg-card/70 backdrop-blur-xs shadow-sm hover:shadow-md hover:border-border/70 transition-all duration-200"
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="relative group">
                              {profile.avatar_url ? (
                                <a
                                  href={profile.avatar_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Ver imagen de ${profile.nombre_completo || "Scout"}`}
                                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                  <UserAvatar
                                    avatarUrl={profile.avatar_url}
                                    userName={profile.nombre_completo}
                                    size="lg"
                                    className="w-12 h-12 text-sm flex-shrink-0"
                                  />
                                </a>
                              ) : (
                                <UserAvatar
                                  avatarUrl={profile.avatar_url}
                                  userName={profile.nombre_completo}
                                  size="lg"
                                  className="w-12 h-12 text-sm flex-shrink-0"
                                />
                              )}

                              {profile.avatar_url && (
                                <span className="pointer-events-none absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-1.5 py-0.5 text-[10px] font-medium text-foreground opacity-0 shadow-sm transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0">
                                  Ver imagen
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex h-2 w-2 rounded-full ${presence.dotClass}`}
                                  aria-hidden="true"
                                />
                                <span className={`text-[11px] font-medium ${presence.textClass}`}>
                                  {presence.label}
                                </span>
                              </div>
                              {isCurrentUser && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="min-w-0 space-y-1.5">
                            <h3 className="text-base font-semibold leading-snug truncate">
                              {profile.nombre_completo || "Scout"}
                            </h3>
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground truncate">
                                {getRamaLabel(profile)}{profile.edad && ` • ${profile.edad} años`}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] px-2 py-0.5 rounded-sm font-medium ${
                                  profile.is_public 
                                    ? "text-green-700 dark:text-green-300 bg-green-100/60 dark:bg-green-900/20" 
                                    : "text-muted-foreground bg-muted/40"
                                }`}>
                                  {profile.is_public ? "🌍 Público" : "🔒 Privado"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isCurrentUser ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs font-medium px-3 py-0"
                              onClick={() => navigate("/perfil")}
                            >
                              Mi perfil
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-6 text-xs font-medium px-3 py-0"
                              onClick={() =>
                                navigate(`/perfil?userId=${profile.user_id}`)
                              }
                            >
                              Ver perfil
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hilos">
            <Card className="mb-6 border-border/70 bg-card/85 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <UserAvatar
                    avatarUrl={currentUserProfile?.avatar_url || null}
                    userName={currentUserProfile?.nombre_completo || null}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="¿Qué está pasando?"
                      value={newThreadText}
                      onChange={(e) => setNewThreadText(e.target.value)}
                      className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
                      maxLength={500}
                    />

                    {newThreadText.length > 0 && (
                      <div
                        className={`text-xs text-right ${
                          newThreadText.length > 450
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {newThreadText.length}/500
                      </div>
                    )}

                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="rounded-xl max-h-64 object-cover border"
                          loading="lazy"
                          decoding="async"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2 text-primary hover:bg-muted/30 px-3 py-2 rounded-full transition-colors">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Imagen</span>
                        </div>
                      </label>

                      <Button
                        onClick={submitThread}
                        disabled={
                          posting || (!newThreadText.trim() && !newThreadFile)
                        }
                        className="rounded-full px-6"
                      >
                        {posting ? "Publicando..." : "Publicar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {threads.map((t) => {
                const isThreadAuthor = t.author_id === currentUserId;
                const canDelete = isThreadAuthor || isAdmin(userEmail);

                return (
                  <Card
                    key={t.id}
                    className="border-border/70 bg-card/85 backdrop-blur-sm hover:bg-muted/30 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <UserAvatar
                          avatarUrl={t.author_avatar || null}
                          userName={t.author_name || null}
                          size="md"
                          className="flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-[0.95rem] font-semibold hover:underline cursor-pointer">
                                {t.author_name || "Scout"}
                              </span>
                              {t.author_username && (
                                <span className="text-sm text-muted-foreground">
                                  @{t.author_username}
                                </span>
                              )}
                              <span className="text-sm text-muted-foreground">
                                ·{" "}
                                {new Date(t.created_at).toLocaleDateString(
                                  "es-ES",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteThread(t.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="text-base whitespace-pre-wrap mb-3">
                            {renderWithMentions(t.content)}
                          </div>

                          {t.image_url && (
                            <div className="rounded-xl border overflow-hidden mb-3">
                              <img
                                src={t.image_url}
                                alt="imagen del hilo"
                                className="w-full max-h-96 object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openThread(t.id)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                💬 Comentarios
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Comentarios</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 max-h-[50vh] overflow-auto">
                                {threadComments.length === 0 ? (
                                  <div className="text-sm text-muted-foreground text-center py-8">
                                    Sé el primero en comentar
                                  </div>
                                ) : (
                                  threadComments.map((c) => {
                                    const commentAuthor = profiles.find(
                                      (p) => p.user_id === c.author_id,
                                    );
                                    return (
                                      <div
                                        key={c.id}
                                        className="flex gap-3 border-b pb-3 last:border-0"
                                      >
                                        <UserAvatar
                                          avatarUrl={
                                            commentAuthor?.avatar_url || null
                                          }
                                          userName={
                                            commentAuthor?.nombre_completo ||
                                            null
                                          }
                                          size="sm"
                                          className="flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">
                                              {commentAuthor?.nombre_completo ||
                                                "Scout"}
                                            </span>
                                            {commentAuthor?.username && (
                                              <span className="text-xs text-muted-foreground">
                                                @{commentAuthor.username}
                                              </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                              ·{" "}
                                              {new Date(
                                                c.created_at,
                                              ).toLocaleDateString("es-ES", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                          <div className="text-sm whitespace-pre-wrap">
                                            {renderWithMentions(c.content)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Input
                                  placeholder="Escribe un comentario"
                                  value={newCommentText}
                                  onChange={(e) =>
                                    setNewCommentText(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      sendComment();
                                    }
                                  }}
                                />
                                <Button onClick={sendComment}>Enviar</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="grupos">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Grupos de la comunidad</h2>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Crear Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crear nuevo grupo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nombre del grupo *
                      </label>
                      <Input
                        placeholder="Ej: Patrulla Águila"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        maxLength={100}
                      />
                      {newGroupName.length > 90 && (
                        <p className="text-xs text-muted-foreground">
                          {100 - newGroupName.length} caracteres restantes
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descripción</label>
                      <Textarea
                        placeholder="Describe de qué trata el grupo..."
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        maxLength={500}
                        className="min-h-[100px]"
                      />
                      {newGroupDescription.length > 450 && (
                        <p
                          className={`text-xs ${newGroupDescription.length > 480 ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {500 - newGroupDescription.length} caracteres
                          restantes
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Imagen de portada
                      </label>
                      {groupCoverPreview ? (
                        <div className="relative">
                          <img
                            src={groupCoverPreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            onClick={() => {
                              setNewGroupCover(null);
                              setGroupCoverPreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Click para subir imagen
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, GIF o WEBP (máx. 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleGroupCoverChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateGroup}
                        disabled={creatingGroup || !newGroupName.trim()}
                        className="flex-1"
                      >
                        {creatingGroup ? "Creando..." : "Crear Grupo"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateGroup(false);
                          setNewGroupName("");
                          setNewGroupDescription("");
                          setNewGroupCover(null);
                          setGroupCoverPreview(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const isMember = !!group.user_role;
                const isOwner = group.user_role === "owner";
                const isAdmin = group.user_role === "admin";
                const isGroupJoining =
                  groupAction?.groupId === group.id && groupAction.type === "join";
                const isGroupLeaving =
                  groupAction?.groupId === group.id && groupAction.type === "leave";

                return (
                  <Card
                    key={group.id}
                    className="overflow-hidden border-border/70 bg-card/85 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {group.cover_image && (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={group.cover_image}
                          alt={group.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base sm:text-[1.05rem] font-semibold leading-snug">{group.name}</h3>
                        {isOwner && (
                          <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        )}
                        {isAdmin && !isOwner && (
                          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>

                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">
                          {group.member_count}{" "}
                          {group.member_count === 1 ? "miembro" : "miembros"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(group.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {isMember ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/grupos/${group.id}`)}
                              disabled={isGroupLeaving}
                            >
                              Abrir
                            </Button>
                            {!isOwner && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLeaveGroup(group.id)}
                                disabled={isGroupLeaving}
                              >
                                {isGroupLeaving ? "Saliendo..." : "Salir"}
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={isGroupJoining}
                          >
                            <UserPlus className="h-4 w-4" />
                            {isGroupJoining ? "Uniéndote..." : "Unirse"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {groups.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No hay grupos aún
                  </p>
                  <Button
                    onClick={() => setShowCreateGroup(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Crear el primer grupo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    )}
    </EmailVerificationGuard>
  );
};

export default Usuarios;



