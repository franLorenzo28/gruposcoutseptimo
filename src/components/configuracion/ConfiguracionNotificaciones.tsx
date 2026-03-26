import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";

const STORAGE_KEY = "notification-preferences";

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

export default function ConfiguracionNotificaciones() {
  const { user } = useUser();
  const { toast } = useToast();
  const storageKey = user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Cargar preferencias desde localStorage
  useEffect(() => {
    const scoped = localStorage.getItem(storageKey);
    const legacy = user?.id ? localStorage.getItem(STORAGE_KEY) : null;
    const saved = scoped ?? legacy;

    if (!scoped && legacy && user?.id) {
      localStorage.setItem(storageKey, legacy);
    }

    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, [storageKey, user?.id]);

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    localStorage.setItem(storageKey, JSON.stringify(newSettings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Aquí iría la llamada a la API para guardar preferencias de notificaciones
      // await apiFetch("/profiles/notifications", { method: "PUT", body: settings });

      localStorage.setItem(storageKey, JSON.stringify(settings));

      toast({
        title: "✓ Preferencias guardadas",
        description: "Tus cambios han sido aplicados correctamente.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
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
      {isSaved && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm animate-in slide-in-from-top">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Cambios guardados automáticamente</span>
        </div>
      )}

      {/* Notificaciones de actividad */}
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">👥</span> Actividad
          </CardTitle>
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
            <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
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
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">⚜️</span> Scouts
          </CardTitle>
          <CardDescription>
            Notificaciones sobre eventos y actividades scouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "eventos_proximamente" as const, label: "Eventos próximamente", desc: "Recordatorios de eventos que estás siguiendo" },
            { key: "notificaciones_rama" as const, label: "Notificaciones de rama", desc: "Avisos internos y comunicados de tu rama" },
            { key: "resumen_semanal" as const, label: "Resumen semanal", desc: "Resumen de actividad en el grupo" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
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
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">📬</span> Canales
          </CardTitle>
          <CardDescription>
            Elige cómo deseas recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email_notificaciones" as const, label: "Notificaciones por email", desc: "Recibe notificaciones en tu correo electrónico" },
            { key: "push_notificaciones" as const, label: "Notificaciones push", desc: "Notificaciones en tiempo real en tu navegador" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
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

      <Button 
        onClick={handleSave} 
        disabled={isLoading} 
        className="w-full bg-primary transition-transform duration-300 hover:scale-105 hover:bg-primary/90 active:scale-95"
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
  );
}
