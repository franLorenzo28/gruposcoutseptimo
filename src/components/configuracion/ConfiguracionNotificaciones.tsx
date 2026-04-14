import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";

const DEFAULT_SETTINGS = {
  nuevos_mensajes: true,
  nuevos_seguidores: true,
  comentarios_fotos: true,
  eventos_proximamente: true,
  notificaciones_rama: true,
  resumen_semanal: false,
  email_notificaciones: true,
  push_notificaciones: true,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function ConfiguracionNotificaciones() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const getEffectiveUserId = async () => {
    if (isLocalBackend()) {
      return user?.user_id || user?.id || null;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    return authUser?.id || user?.user_id || user?.id || null;
  };

  // Cargar preferencias desde Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (isLocalBackend()) {
          const data = await apiFetch("/profiles/me");
          if (isPlainObject(data?.notification_preferences)) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...(data.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
            });
          }
        } else {
          const userId = await getEffectiveUserId();
          if (!userId) return;

          const { data, error } = await supabase
            .from("profiles")
            .select("notification_preferences")
            .eq("user_id", userId)
            .single();

          if (error) throw error;
          if (isPlainObject(data?.notification_preferences)) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...(data.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
            });
          }
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
        setSettings(DEFAULT_SETTINGS);
      }
    };

    loadSettings();
  }, [user?.id, user?.user_id]);

  const handleToggle = async (key: keyof typeof settings) => {
    const previousSettings = settings;
    const enablingPush = key === "push_notificaciones" && !settings.push_notificaciones;
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);

    if (
      enablingPush &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignorar si el navegador no permite pedir permiso en este contexto.
      }
    }
    
    // Guardar automáticamente en Supabase
    try {
      if (isLocalBackend()) {
        await apiFetch("/profiles/me", {
          method: "PUT",
          body: JSON.stringify({ notification_preferences: newSettings }),
        });

        const verifiedData = await apiFetch("/profiles/me");
        if (isPlainObject(verifiedData?.notification_preferences)) {
          const verifiedSettings = {
            ...DEFAULT_SETTINGS,
            ...(verifiedData.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
          };
          setSettings(verifiedSettings);
          if (JSON.stringify(verifiedSettings) !== JSON.stringify(newSettings)) {
            throw new Error("No se pudo verificar el guardado de notificaciones");
          }
        }
      } else {
        const userId = await getEffectiveUserId();
        if (!userId) {
          throw new Error("No se pudo identificar el usuario autenticado");
        }

        const { data: updatedRows, error } = await supabase
          .from("profiles")
          .update({ notification_preferences: newSettings })
          .eq("user_id", userId)
          .select("user_id")
          .limit(1);
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("No se encontró un perfil para actualizar");
        }

        const { data: verifiedData, error: verifyError } = await supabase
          .from("profiles")
          .select("notification_preferences")
          .eq("user_id", userId)
          .single();
        if (verifyError) throw verifyError;

        if (isPlainObject(verifiedData?.notification_preferences)) {
          const verifiedSettings = {
            ...DEFAULT_SETTINGS,
            ...(verifiedData.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
          };
          setSettings(verifiedSettings);
          if (JSON.stringify(verifiedSettings) !== JSON.stringify(newSettings)) {
            throw new Error("No se pudo verificar el guardado de notificaciones");
          }
        }
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      // Revertir cambio si falla
      setSettings(previousSettings);
      toast({
        title: "Error",
        description: "No pudimos guardar tus preferencias. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (isLocalBackend()) {
        await apiFetch("/profiles/me", {
          method: "PUT",
          body: JSON.stringify({ notification_preferences: settings }),
        });

        const verifiedData = await apiFetch("/profiles/me");
        if (isPlainObject(verifiedData?.notification_preferences)) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(verifiedData.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
          });
        }
      } else {
        const userId = await getEffectiveUserId();
        if (!userId) {
          throw new Error("No se pudo identificar el usuario autenticado");
        }

        const { data: updatedRows, error } = await supabase
          .from("profiles")
          .update({ notification_preferences: settings })
          .eq("user_id", userId)
          .select("user_id")
          .limit(1);
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("No se encontró un perfil para actualizar");
        }

        const { data: verifiedData, error: verifyError } = await supabase
          .from("profiles")
          .select("notification_preferences")
          .eq("user_id", userId)
          .single();
        if (verifyError) throw verifyError;

        if (isPlainObject(verifiedData?.notification_preferences)) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(verifiedData.notification_preferences as Partial<typeof DEFAULT_SETTINGS>),
          });
        }
      }

      toast({
        title: "✓ Preferencias guardadas",
        description: "Tus cambios han sido aplicados correctamente.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos guardar tus preferencias. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificaciones de actividad */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Actividad</CardTitle>
          <CardDescription>
            Recibe notificaciones sobre la actividad de otros miembros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "nuevos_mensajes" as const, label: "Nuevos mensajes", desc: "Cuando alguien te envía un mensaje directo" },
            { key: "nuevos_seguidores" as const, label: "Nuevos seguidores", desc: "Cuando alguien empieza a seguirte" },
            { key: "comentarios_fotos" as const, label: "Comentarios en fotos", desc: "Cuando dejan comentarios en tus fotos" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={settings[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={isLoading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notificaciones de Scouts */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Scouts</CardTitle>
          <CardDescription>
            Notificaciones sobre eventos y actividades scouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "eventos_proximamente" as const, label: "Eventos próximamente", desc: "Recordatorios de eventos que estás siguiendo" },
            { key: "notificaciones_rama" as const, label: "Notificaciones de unidad", desc: "Avisos internos y comunicados de tu unidad" },
            { key: "resumen_semanal" as const, label: "Resumen semanal", desc: "Resumen de actividad en el grupo" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={settings[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={isLoading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canales de notificación */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Canales</CardTitle>
          <CardDescription>
            Elige cómo deseas recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email_notificaciones" as const, label: "Notificaciones por email", desc: "Recibe notificaciones en tu correo electrónico" },
            { key: "push_notificaciones" as const, label: "Notificaciones push", desc: "Notificaciones en tiempo real en tu navegador" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={settings[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={isLoading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading} 
          className="h-10 min-w-[210px] rounded-full px-6"
        >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Guardando...
          </>
        ) : isSaved ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Guardado
          </>
        ) : (
          "Guardar preferencias"
        )}
        </Button>
      </div>
    </div>
  );
}
