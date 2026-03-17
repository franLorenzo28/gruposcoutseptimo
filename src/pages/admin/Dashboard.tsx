import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Edit2,
  Trash2,
  Users,
  Shield,
  Clock,
  CalendarDays,
  MessageSquare,
  MessagesSquare,
  FileText,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, admins: 0, registradosHoy: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadComments, setThreadComments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [editGroup, setEditGroup] = useState<any | null>(null);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [editPage, setEditPage] = useState<any | null>(null);
  const { toast } = useToast();

  function computeStats(list: any[]) {
    const admins = list?.filter((u: any) => u.role === "admin").length || 0;
    const registradosHoy = list?.filter((u: any) => u.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length || 0;
    setStats({ total: list?.length || 0, admins, registradosHoy });
  }

  async function fetchData() {
    setLoading(true);
    const { data: usuarios, error } = await supabase.from("profiles").select("*");
    if (error) {
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
      computeStats([]);
      setLoading(false);
      return;
    }
    setUsers(usuarios || []);
    computeStats(usuarios || []);
    setLoading(false);
  }

  async function fetchAdminData() {
    setLoadingAdmin(true);
    const [groupsRes, eventsRes, threadsRes, commentsRes, messagesRes, groupMessagesRes, pagesRes] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("eventos").select("*").order("fecha_inicio", { ascending: false }).limit(200),
      supabase.from("threads").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("thread_comments").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("group_messages").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("site_pages").select("*").order("updated_at", { ascending: false }),
    ]);

    if (groupsRes.error || eventsRes.error || threadsRes.error || commentsRes.error || messagesRes.error || groupMessagesRes.error || pagesRes.error) {
      toast({
        title: "Error al cargar datos admin",
        description: "Revisa permisos y poláticas en Supabase.",
        variant: "destructive",
      });
    }

    setGroups(groupsRes.data || []);
    setEvents(eventsRes.data || []);
    setThreads(threadsRes.data || []);
    setThreadComments(commentsRes.data || []);
    setMessages(messagesRes.data || []);
    setGroupMessages(groupMessagesRes.data || []);
    setPages(pagesRes.data || []);
    setLoadingAdmin(false);
  }

  useEffect(() => {
    fetchData();
    fetchAdminData();
  }, []);

  function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("es-ES");
  }

  async function handleDeleteById(table: string, idField: string, id: string) {
    const { error } = await (supabase as any).from(table).delete().eq(idField, id);
    if (error) {
      toast({
        title: "No se pudo eliminar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    toast({
      title: "Eliminado",
      description: "Registro eliminado correctamente.",
    });
    return true;
  }

  async function saveGroup() {
    if (!editGroup) return;
    setSaving(true);
    const payload = {
      name: editGroup.name,
      description: editGroup.description || null,
      cover_image: editGroup.cover_image || null,
    };
    const { error } = await supabase.from("groups").update(payload).eq("id", editGroup.id);
    if (error) {
      toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
    } else {
      setGroups((prev) => prev.map((g) => (g.id === editGroup.id ? { ...g, ...payload } : g)));
      toast({ title: "Grupo actualizado" });
      setEditGroup(null);
    }
    setSaving(false);
  }

  async function saveEvent() {
    if (!editEvent) return;
    setSaving(true);
    const payload = {
      titulo: editEvent.titulo,
      descripcion: editEvent.descripcion || null,
      fecha_inicio: editEvent.fecha_inicio,
      fecha_fin: editEvent.fecha_fin || null,
    };
    const { error } = await supabase.from("eventos").update(payload).eq("id", editEvent.id);
    if (error) {
      toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
    } else {
      setEvents((prev) => prev.map((e) => (e.id === editEvent.id ? { ...e, ...payload } : e)));
      toast({ title: "Evento actualizado" });
      setEditEvent(null);
    }
    setSaving(false);
  }

  async function savePage() {
    if (!editPage) return;
    setSaving(true);
    const payload = {
      slug: editPage.slug,
      title: editPage.title,
      content: editPage.content || "",
      updated_at: new Date().toISOString(),
    };

    if (editPage.id) {
      const { error } = await supabase.from("site_pages").update(payload).eq("id", editPage.id);
      if (error) {
        toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
      } else {
        setPages((prev) => prev.map((p) => (p.id === editPage.id ? { ...p, ...payload } : p)));
        toast({ title: "Página actualizada" });
        setEditPage(null);
      }
    } else {
      const { data, error } = await supabase.from("site_pages").insert(payload).select("*").single();
      if (error) {
        toast({ title: "No se pudo crear", description: error.message, variant: "destructive" });
      } else {
        setPages((prev) => [data, ...prev]);
        toast({ title: "Página creada" });
        setEditPage(null);
      }
    }
    setSaving(false);
  }

  const filtered = users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.nombre_completo || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(u: any) {
    setEditUser(u);
    setEditData({
      user_id: u.user_id,
      email: u.email ?? "",
      nombre_completo: u.nombre_completo ?? "",
      username: u.username ?? "",
      role: u.role ?? "user",
    });
    setUsernameStatus("idle");
    setUsernameMessage("");
  }

  useEffect(() => {
    if (!editUser) return;

    const raw = (editData.username || "").trim();
    if (!raw) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const normalized = raw.toLowerCase();
    const usernameRegex = /^[a-z0-9._-]{3,30}$/;

    if (!usernameRegex.test(normalized)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Formato inválido: 3-30 caracteres, letras, números, punto, guion o guion bajo.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Verificando disponibilidad...");

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", normalized)
        .maybeSingle();

      if (error) {
        setUsernameStatus("idle");
        setUsernameMessage("");
        return;
      }

      if (data && data.user_id !== editUser.user_id) {
        setUsernameStatus("taken");
        setUsernameMessage("Ese username ya está en uso.");
        return;
      }

      setUsernameStatus("available");
      setUsernameMessage("Username disponible.");
    }, 400);

    return () => clearTimeout(timer);
  }, [editData.username, editUser]);
  
  async function handleSaveEdit() {
    if (!editUser) return;
    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      toast({
        title: "No se pudo guardar",
        description: usernameMessage || "El username no es válido o ya está en uso.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        email: editData.email || null,
        nombre_completo: editData.nombre_completo || null,
        username: editData.username ? String(editData.username).toLowerCase() : null,
        role: editData.role || "user",
      };
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", editUser.user_id);

      if (error) {
        toast({
          title: "No se pudo guardar",
          description: error.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.user_id === editUser.user_id ? { ...u, ...payload } : u,
        );
        computeStats(updated);
        return updated;
      });

      toast({
        title: "Cambios guardados",
        description: "El usuario fue actualizado correctamente.",
      });
      setEditUser(null);
      setEditData({});
    } catch (err: any) {
      toast({
        title: "Error inesperado",
        description: err?.message || "No se pudo guardar el usuario.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }
  
  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("user_id", id);
      if (error) {
        toast({
          title: "No se pudo eliminar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setUsers((prev) => {
        const updated = prev.filter((u) => u.user_id !== id);
        computeStats(updated);
        return updated;
      });
      toast({
        title: "Usuario eliminado",
        description: "El usuario fue eliminado correctamente.",
      });
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast({
        title: "Error inesperado",
        description: "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    }
  }
  
  function exportCSV() {
    const header = ["ID", "Email", "Nombre", "Username", "Rol", "Fecha de registro"];
    const rows = users.map((u) => [u.user_id, u.email, u.nombre_completo, u.username, u.role || "user", u.created_at?.slice(0, 10)]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv; charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge className="bg-red-600 hover:bg-red-700 text-white">Admin</Badge>;
    }
    return <Badge variant="secondary">User</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-1 sm:mb-2">
            Panel de Admin
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Gestiona usuarios y contenido</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="hidden sm:inline">Administradores</span>
                <span className="sm:hidden">Admins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground mt-1">Con rol admin</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 sm:col-span-2 md:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="hidden sm:inline">Registrados Hoy</span>
                <span className="sm:hidden">Hoy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.registradosHoy}</div>
              <p className="text-xs text-muted-foreground mt-1">Nuevos usuarios</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="flex flex-wrap gap-1 sm:gap-2 bg-muted/50 p-1 sm:p-2 rounded-lg w-full justify-start overflow-x-auto">
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Usuarios</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Grupos</TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Eventos</TabsTrigger>
            <TabsTrigger value="threads" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Posts</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Comentarios</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Msgs</TabsTrigger>
            <TabsTrigger value="groupMessages" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Msgs Grupo</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Páginas</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <Input
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs sm:text-sm flex-1"
              />
              <Button onClick={exportCSV} className="gap-2 whitespace-nowrap text-xs sm:text-sm w-full sm:w-auto">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span>Usuarios ({filtered.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-xs sm:text-sm text-muted-foreground">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 font-semibold text-muted-foreground text-xs">Email</th>
                          <th className="text-left p-2 sm:p-3 font-semibold text-muted-foreground text-xs">Nombre</th>
                          <th className="text-left p-2 sm:p-3 font-semibold text-muted-foreground text-xs">Usuario</th>
                          <th className="text-left p-2 sm:p-3 font-semibold text-muted-foreground text-xs">Rol</th>
                          <th className="text-right p-2 sm:p-3 font-semibold text-muted-foreground text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                              No se encontraron usuarios
                            </td>
                          </tr>
                        ) : (
                          filtered.map((u) => (
                            <tr key={u.user_id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm truncate">{u.email || "-"}</td>
                              <td className="p-2 sm:p-3 text-xs sm:text-sm truncate">{u.nombre_completo || "-"}</td>
                              <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground truncate">{u.username || "-"}</td>
                              <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                {getRoleBadge(u.role || "user")}
                              </td>
                              <td className="p-2 sm:p-3 text-right">
                                <div className="flex gap-1 sm:gap-2 justify-end flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(u)}
                                    className="gap-1 text-xs h-8 px-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Editar</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(u.user_id)}
                                    className="gap-1 text-xs h-8 px-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Layers className="w-4 h-4" />
                  Grupos ({groups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando grupos...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs">Nombre</th>
                          <th className="text-left p-2 sm:p-3 text-xs hidden md:table-cell">Descripción</th>
                          <th className="text-left p-2 sm:p-3 text-xs hidden lg:table-cell">Creador</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Creado</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map((g) => (
                          <tr key={g.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm truncate">{g.name}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground hidden md:table-cell truncate">{g.description || "-"}</td>
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden lg:table-cell truncate">{g.creator_id}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(g.created_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <div className="flex gap-1 sm:gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setEditGroup(g)} className="text-xs h-8 px-2">
                                  <Edit2 className="w-3 h-3" />
                                  <span className="hidden sm:inline ml-1">Editar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    const ok = await handleDeleteById("groups", "id", g.id);
                                    if (ok) setGroups((prev) => prev.filter((x) => x.id !== g.id));
                                  }}
                                  className="text-xs h-8 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalendarDays className="w-4 h-4" />
                  Eventos ({events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando eventos...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs">Título</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Inicio</th>
                          <th className="text-left p-2 sm:p-3 text-xs hidden sm:table-cell">Fin</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((e) => (
                          <tr key={e.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm truncate">{e.titulo}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(e.fecha_inicio)}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell">{formatDate(e.fecha_fin)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <div className="flex gap-1 sm:gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setEditEvent(e)} className="text-xs h-8 px-2">
                                  <Edit2 className="w-3 h-3" />
                                  <span className="hidden sm:inline ml-1">Editar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    const ok = await handleDeleteById("eventos", "id", e.id);
                                    if (ok) setEvents((prev) => prev.filter((x) => x.id !== e.id));
                                  }}
                                  className="text-xs h-8 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="w-4 h-4" />
                  Publicaciones ({threads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando publicaciones...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs hidden md:table-cell">Autor</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Contenido</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Fecha</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {threads.map((t) => (
                          <tr key={t.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden md:table-cell truncate">{t.author_id}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm truncate">{String(t.content).slice(0, 40)}...</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(t.created_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  const ok = await handleDeleteById("threads", "id", t.id);
                                  if (ok) setThreads((prev) => prev.filter((x) => x.id !== t.id));
                                }}
                                className="text-xs h-8 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="w-4 h-4" />
                  Comentarios ({threadComments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando comentarios...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs hidden md:table-cell">Autor</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Contenido</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Fecha</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {threadComments.map((c) => (
                          <tr key={c.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden md:table-cell truncate">{c.author_id}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm truncate">{String(c.content).slice(0, 40)}...</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(c.created_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  const ok = await handleDeleteById("thread_comments", "id", c.id);
                                  if (ok) setThreadComments((prev) => prev.filter((x) => x.id !== c.id));
                                }}
                                className="text-xs h-8 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessagesSquare className="w-4 h-4" />
                  Mensajes ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando mensajes...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs hidden md:table-cell">Remitente</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Contenido</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Fecha</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map((m) => (
                          <tr key={m.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden md:table-cell truncate">{m.sender_id}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm truncate">{String(m.content).slice(0, 40)}...</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(m.created_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  const ok = await handleDeleteById("messages", "id", m.id);
                                  if (ok) setMessages((prev) => prev.filter((x) => x.id !== m.id));
                                }}
                                className="text-xs h-8 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groupMessages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessagesSquare className="w-4 h-4" />
                  Mensajes de Grupo ({groupMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando mensajes de grupo...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs hidden lg:table-cell">Grupo</th>
                          <th className="text-left p-2 sm:p-3 text-xs hidden md:table-cell">Remitente</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Contenido</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Fecha</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupMessages.map((m) => (
                          <tr key={m.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden lg:table-cell truncate">{m.group_id}</td>
                            <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden md:table-cell truncate">{m.sender_id}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm truncate">{String(m.content).slice(0, 40)}...</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(m.created_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  const ok = await handleDeleteById("group_messages", "id", m.id);
                                  if (ok) setGroupMessages((prev) => prev.filter((x) => x.id !== m.id));
                                }}
                                className="text-xs h-8 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-base sm:text-lg">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" />Páginas ({pages.length})</span>
                  <Button size="sm" onClick={() => setEditPage({ slug: "", title: "", content: "" })} className="text-xs w-full sm:w-auto">
                    Nueva página
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmin ? (
                  <div className="py-8 text-xs sm:text-sm text-muted-foreground">Cargando páginas...</div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-max">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2 sm:p-3 text-xs">Slug</th>
                          <th className="text-left p-2 sm:p-3 text-xs hidden sm:table-cell">Título</th>
                          <th className="text-left p-2 sm:p-3 text-xs">Actualizado</th>
                          <th className="text-right p-2 sm:p-3 text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pages.map((p) => (
                          <tr key={p.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm truncate">{p.slug}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell truncate">{p.title || "-"}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(p.updated_at)}</td>
                            <td className="p-2 sm:p-3 text-right">
                              <div className="flex gap-1 sm:gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setEditPage(p)} className="text-xs h-8 px-2">
                                  <Edit2 className="w-3 h-3" />
                                  <span className="hidden sm:inline ml-1">Editar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    const ok = await handleDeleteById("site_pages", "id", p.id);
                                    if (ok) setPages((prev) => prev.filter((x) => x.id !== p.id));
                                  }}
                                  className="text-xs h-8 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && !saving && setEditUser(null)}>
        <DialogContent className="max-w-xs sm:max-w-md w-11/12">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={editData.nombre_completo || ""}
                  onChange={(e) => setEditData({ ...editData, nombre_completo: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editData.username || ""}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase() })}
                  className="mt-1"
                  disabled={saving}
                />
                {usernameStatus !== "idle" && (
                  <p
                    className={
                      "mt-2 text-xs " +
                      (usernameStatus === "available"
                        ? "text-green-600"
                        : usernameStatus === "checking"
                          ? "text-muted-foreground"
                          : "text-destructive")
                    }
                  >
                    {usernameMessage}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={editData.role || "user"}
                  onValueChange={(value) => setEditData({ ...editData, role: value })}
                  disabled={saving}
                >
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario Normal</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editGroup} onOpenChange={(open) => !open && !saving && setEditGroup(null)}>
        <DialogContent className="max-w-xs sm:max-w-md w-11/12">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          {editGroup && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="group-name">Nombre</Label>
                <Input
                  id="group-name"
                  value={editGroup.name || ""}
                  onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="group-desc">Descripción</Label>
                <Textarea
                  id="group-desc"
                  value={editGroup.description || ""}
                  onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setEditGroup(null)} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={saveGroup} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editEvent} onOpenChange={(open) => !open && !saving && setEditEvent(null)}>
        <DialogContent className="max-w-xs sm:max-w-md w-11/12">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="event-title">Título</Label>
                <Input
                  id="event-title"
                  value={editEvent.titulo || ""}
                  onChange={(e) => setEditEvent({ ...editEvent, titulo: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="event-desc">Descripción</Label>
                <Textarea
                  id="event-desc"
                  value={editEvent.descripcion || ""}
                  onChange={(e) => setEditEvent({ ...editEvent, descripcion: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="event-start">Fecha inicio</Label>
                <Input
                  id="event-start"
                  type="date"
                  value={(editEvent.fecha_inicio || "").slice(0, 10)}
                  onChange={(e) => setEditEvent({ ...editEvent, fecha_inicio: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="event-end">Fecha fin</Label>
                <Input
                  id="event-end"
                  type="date"
                  value={(editEvent.fecha_fin || "").slice(0, 10)}
                  onChange={(e) => setEditEvent({ ...editEvent, fecha_fin: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setEditEvent(null)} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={saveEvent} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Page Dialog */}
      <Dialog open={!!editPage} onOpenChange={(open) => !open && !saving && setEditPage(null)}>
        <DialogContent className="max-w-xs sm:max-w-xl w-11/12 max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPage?.id ? "Editar Página" : "Nueva Página"}</DialogTitle>
          </DialogHeader>
          {editPage && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="page-slug">Slug</Label>
                <Input
                  id="page-slug"
                  value={editPage.slug || ""}
                  onChange={(e) => setEditPage({ ...editPage, slug: e.target.value })}
                  className="mt-1"
                  disabled={saving || !!editPage.id}
                />
              </div>
              <div>
                <Label htmlFor="page-title">Título</Label>
                <Input
                  id="page-title"
                  value={editPage.title || ""}
                  onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
                  className="mt-1"
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="page-content">Contenido</Label>
                <Textarea
                  id="page-content"
                  rows={4}
                  value={editPage.content || ""}
                  onChange={(e) => setEditPage({ ...editPage, content: e.target.value })}
                  className="mt-1 text-xs sm:text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setEditPage(null)} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={savePage} disabled={saving} className="text-xs sm:text-sm w-full sm:w-auto">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



