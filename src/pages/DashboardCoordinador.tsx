import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  TrendingUp,
  Award,
  ArrowLeft,
  Activity,
  Send,
  MessageSquare,
} from "lucide-react";
import { getAuthUser } from "@/lib/backend";
import { createOrGetConversation, sendDM } from "@/lib/dms";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ScoutStats {
  totalScouts: number;
  porRama: {
    manada: number;
    tropa: number;
    pioneros: number;
    rovers: number;
  };
}

const DashboardCoordinador = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [coordinadorProfile, setCoordinadorProfile] = useState<Profile | null>(null);
  const [scouts, setScouts] = useState<Profile[]>([]);
  const [stats, setStats] = useState<ScoutStats>({
    totalScouts: 0,
    porRama: { manada: 0, tropa: 0, pioneros: 0, rovers: 0 },
  });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [groupMessage, setGroupMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUnit, setShowOnlyUnit] = useState(false);

  const filteredScouts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = scouts;
    if (term) {
      list = list.filter((s) => (s.nombre_completo || "").toLowerCase().includes(term));
    }
    if (showOnlyUnit && coordinadorProfile) {
      const rama = getEffectiveRama(coordinadorProfile as any);
      if (rama === "manada" && coordinadorProfile.seisena) {
        list = list.filter((s) => s.seisena === coordinadorProfile.seisena);
      } else if (rama === "tropa" && coordinadorProfile.patrulla) {
        list = list.filter((s) => s.patrulla === coordinadorProfile.patrulla);
      } else if (rama === "pioneros" && coordinadorProfile.equipo_pioneros) {
        list = list.filter((s) => s.equipo_pioneros === coordinadorProfile.equipo_pioneros);
      } else if (rama === "rovers" && coordinadorProfile.comunidad_rovers) {
        list = list.filter((s) => s.comunidad_rovers === coordinadorProfile.comunidad_rovers);
      }
    }
    return list;
  }, [scouts, searchTerm, showOnlyUnit, coordinadorProfile]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const auth = await getAuthUser();
      if (!auth) {
        navigate("/auth");
        return;
      }

      // Obtener perfil del coordinador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", auth.id)
        .single();

      if (profileError) throw profileError;

      // Verificar que sea educador
      if (!profile || profile.edad < 21 || profile.rol_adulto !== "Educador/a") {
        toast({
          title: "Acceso restringido",
          description: "Solo educadores pueden acceder a este dashboard",
          variant: "destructive",
        });
        navigate("/perfil");
        return;
      }

      setCoordinadorProfile(profile);

      // Obtener scouts según las secciones que coordina
      await loadScouts(profile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScouts = async (coordinador: Profile) => {
    try {
  // Usar rama_que_educa o deducir por unidades
  const ramaEducador = getEffectiveRama(coordinador as any);
      
      if (!ramaEducador) {
        setScouts([]);
        toast({
          title: "Configura tu rama",
          description: "Ve a tu perfil y selecciona qué rama diriges",
          variant: "default",
        });
        return;
      }

      // Obtener scouts según la rama que educa
      let scoutsData: Profile[] = [];

      if (ramaEducador === "manada") {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .gte("edad", 7)
          .lte("edad", 10);
        if (data) scoutsData = data;
      } else if (ramaEducador === "tropa") {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .gte("edad", 11)
          .lte("edad", 14);
        if (data) scoutsData = data;
      } else if (ramaEducador === "pioneros") {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .gte("edad", 15)
          .lte("edad", 17);
        if (data) scoutsData = data;
      } else if (ramaEducador === "rovers") {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .gte("edad", 18)
          .lte("edad", 20);
        if (data) scoutsData = data;
      }

      // Filtrar scouts excluyendo educadores
      const scoutsOnly = scoutsData.filter(s => s.edad < 21);
      setScouts(scoutsOnly);

      // Calcular estadásticas
      const porRama = {
        manada: scoutsOnly.filter((s) => s.edad >= 7 && s.edad <= 10).length,
        tropa: scoutsOnly.filter((s) => s.edad >= 11 && s.edad <= 14).length,
        pioneros: scoutsOnly.filter((s) => s.edad >= 15 && s.edad <= 17).length,
        rovers: scoutsOnly.filter((s) => s.edad >= 18 && s.edad <= 20).length,
      };

      setStats({
        totalScouts: scoutsOnly.length,
        porRama,
      });
    } catch (error: any) {
      toast({
        title: "Error al cargar scouts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRamaActual = (edad: number | null) => {
    if (!edad) return "Sin rama";
    if (edad >= 21) return "Adulto";
    if (edad >= 18) return "Rover";
    if (edad >= 15) return "Pionero";
    if (edad >= 11) return "Tropa";
    if (edad >= 7) return "Manada";
    return "Sin rama";
  };

  const getRamaBadgeColor = (edad: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!edad) return "secondary";
    if (edad >= 18) return "default";
    if (edad >= 15) return "destructive";
    if (edad >= 11) return "outline";
    if (edad >= 7) return "secondary";
    return "secondary";
  };

  // Fallback: determina la rama efectiva del educador
  const getEffectiveRama = (
    p: any
  ): "manada" | "tropa" | "pioneros" | "rovers" | null => {
    if (p?.rama_que_educa) return p.rama_que_educa as any;
    if (p?.seisena) return "manada";
    if (p?.patrulla) return "tropa";
    if (p?.equipo_pioneros) return "pioneros";
    if (p?.comunidad_rovers) return "rovers";
    return null;
  };

  const handleSendGroupMessage = async () => {
    if (!groupMessage.trim()) {
      toast({
        title: "Mensaje vacáo",
        description: "Escribe un mensaje para enviar",
        variant: "destructive",
      });
      return;
    }

    if (filteredScouts.length === 0) {
      toast({
        title: "Sin destinatarios",
        description: "No hay scouts que coincidan con el filtro actual",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingMessage(true);
      let successCount = 0;
      let errorCount = 0;

      // Enviar mensaje a cada scout
      for (const scout of filteredScouts) {
        try {
          // Crear conversación con el scout
          const conversation = await createOrGetConversation(scout.user_id);
          // Enviar mensaje
          await sendDM(conversation.id, groupMessage);
          successCount++;
        } catch (error) {
          console.error(`Error enviando a ${scout.nombre_completo}:`, error);
          errorCount++;
        }
      }

      // Mostrar resultado
      if (errorCount === 0) {
        toast({
          title: "✅ Mensajes enviados",
          description: `Se enviaron ${successCount} mensajes correctamente`,
        });
      } else {
        toast({
          title: "Mensajes enviados parcialmente",
          description: `${successCount} exitosos, ${errorCount} fallidos`,
          variant: "destructive",
        });
      }

      // Limpiar y cerrar
      setGroupMessage("");
      setShowMessageDialog(false);
    } catch (error: any) {
      toast({
        title: "Error al enviar mensajes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background/60 backdrop-blur-sm">
        <div className="h-20"></div>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>

          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* List skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <div className="h-20"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Dashboard de Coordinación</h1>
            <p className="text-muted-foreground">
              Panel de gestión para educadores
            </p>
          </div>
          {filteredScouts.length > 0 && (
            <Button
              onClick={() => setShowMessageDialog(true)}
              className="gap-2"
              size="sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Mensaje grupal</span>
              <span className="sm:hidden">Mensaje</span>
            </Button>
          )}
        </div>

        {/* Controles de filtro */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar scout por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="solo-unidad"
              checked={showOnlyUnit}
              onCheckedChange={(v) => setShowOnlyUnit(Boolean(v))}
            />
            <label htmlFor="solo-unidad" className="text-sm text-muted-foreground select-none">
              Solo mi unidad
            </label>
          </div>
        </div>

        {/* Banner estado configuración / datos */}
        {coordinadorProfile && !getEffectiveRama(coordinadorProfile as any) && (
          <div className="mb-6 p-4 rounded-md border bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium">Configura tu rama</p>
              <p className="text-sm">Selecciona en tu perfil qué rama diriges para ver tus scouts.</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/perfil/editar")}>Editar perfil</Button>
          </div>
        )}
        {coordinadorProfile && getEffectiveRama(coordinadorProfile as any) && scouts.length === 0 && (
          <div className="mb-6 p-4 rounded-md border bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900">
            No hay scouts con edades dentro de la rama seleccionada aún.
          </div>
        )}

        {/* Resumen de unidad coordinada */}
        {coordinadorProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Mi sección
              </CardTitle>
              <CardDescription>
                Rama y unidad que coordinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getEffectiveRama(coordinadorProfile as any) === "manada" && (
                <div className="p-4 bg-muted/30 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🐺</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rama Manada
                      </p>
                      {coordinadorProfile.seisena && (
                        <p className="text-lg font-semibold">{coordinadorProfile.seisena}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">7-10 años</p>
                </div>
              )}
              {getEffectiveRama(coordinadorProfile as any) === "tropa" && (
                <div className="p-4 bg-muted/30 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚜️</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rama Tropa
                      </p>
                      {coordinadorProfile.patrulla && (
                        <p className="text-lg font-semibold">{coordinadorProfile.patrulla}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">11-14 años</p>
                </div>
              )}
              {getEffectiveRama(coordinadorProfile as any) === "pioneros" && (
                <div className="p-4 bg-muted/30 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏔️</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rama Pioneros
                      </p>
                      {coordinadorProfile.equipo_pioneros && (
                        <p className="text-lg font-semibold">{coordinadorProfile.equipo_pioneros}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">15-17 años</p>
                </div>
              )}
              {getEffectiveRama(coordinadorProfile as any) === "rovers" && (
                <div className="p-4 bg-muted/30 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🚶</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rama Rovers
                      </p>
                      {coordinadorProfile.comunidad_rovers && (
                        <p className="text-lg font-semibold">{coordinadorProfile.comunidad_rovers}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">18-20 años</p>
                </div>
              )}
              {!getEffectiveRama(coordinadorProfile as any) && (
                <p className="text-sm text-muted-foreground">
                  No has asignado ninguna rama. Ve a{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate("/perfil/editar")}
                  >
                    editar tu perfil
                  </Button>{" "}
                  para seleccionar la rama que diriges.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estadásticas generales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Scouts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScouts}</div>
              <p className="text-xs text-muted-foreground">
                En tus secciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manada</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porRama.manada}</div>
              <p className="text-xs text-muted-foreground">7-10 años</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tropa</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porRama.tropa}</div>
              <p className="text-xs text-muted-foreground">11-14 años</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pioneros/Rovers
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.porRama.pioneros + stats.porRama.rovers}
              </div>
              <p className="text-xs text-muted-foreground">15-20 años</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con contenido */}
        <Tabs defaultValue="scouts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scouts">
              <Users className="w-4 h-4 mr-2" />
              Mis Scouts
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              Estadásticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Scouts</CardTitle>
                <CardDescription>
                  Scouts en las secciones que coordinas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredScouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay scouts en tus secciones aún
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredScouts.map((scout) => (
                      <div
                        key={scout.user_id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors animate-fade-in cursor-pointer"
                        onClick={() =>
                          navigate(`/perfil?userId=${scout.user_id}`)
                        }
                      >
                        <UserAvatar
                          avatarUrl={scout.avatar_url}
                          userName={scout.nombre_completo}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {scout.nombre_completo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {scout.edad} años
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={getRamaBadgeColor(scout.edad)}>
                            {getRamaActual(scout.edad)}
                          </Badge>
                          {scout.seisena && (
                            <span className="text-xs text-muted-foreground">
                              {scout.seisena}
                            </span>
                          )}
                          {scout.patrulla && (
                            <span className="text-xs text-muted-foreground">
                              {scout.patrulla}
                            </span>
                          )}
                          {scout.equipo_pioneros && (
                            <span className="text-xs text-muted-foreground">
                              {scout.equipo_pioneros}
                            </span>
                          )}
                          {scout.comunidad_rovers && (
                            <span className="text-xs text-muted-foreground">
                              {scout.comunidad_rovers}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Rama</CardTitle>
                <CardDescription>
                  Cantidad de scouts en cada rama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Manada (7-10 años)</span>
                      <span className="font-medium">{stats.porRama.manada}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${stats.totalScouts > 0 ? (stats.porRama.manada / stats.totalScouts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Tropa (11-14 años)</span>
                      <span className="font-medium">{stats.porRama.tropa}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${stats.totalScouts > 0 ? (stats.porRama.tropa / stats.totalScouts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Pioneros (15-17 años)</span>
                      <span className="font-medium">
                        {stats.porRama.pioneros}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${stats.totalScouts > 0 ? (stats.porRama.pioneros / stats.totalScouts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Rovers (18-20 años)</span>
                      <span className="font-medium">{stats.porRama.rovers}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${stats.totalScouts > 0 ? (stats.porRama.rovers / stats.totalScouts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de mensaje grupal */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mensaje grupal a tu sección
              </DialogTitle>
              <DialogDescription>
                Enváa un mensaje a todos los scouts de tus secciones ({scouts.length} destinatarios)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje aquá... Ej: Recordatorio: Reunión este sábado a las 15:00 en la sede."
                  value={groupMessage}
                  onChange={(e) => setGroupMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                  disabled={sendingMessage}
                />
                <p className="text-xs text-muted-foreground">
                  El mensaje se enviará como conversación individual a cada scout
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">📨 Destinatarios:</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {scouts.slice(0, 10).map((scout) => (
                    <Badge key={scout.user_id} variant="secondary" className="text-xs">
                      {scout.nombre_completo}
                    </Badge>
                  ))}
                  {scouts.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{scouts.length - 10} más
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMessageDialog(false);
                  setGroupMessage("");
                }}
                disabled={sendingMessage}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendGroupMessage}
                disabled={sendingMessage || !groupMessage.trim()}
                className="gap-2"
              >
                {sendingMessage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar a {scouts.length} scout{scouts.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardCoordinador;


