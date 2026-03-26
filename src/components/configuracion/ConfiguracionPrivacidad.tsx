import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const STORAGE_KEY = "privacy-preferences";

const DEFAULT_SETTINGS = {
  perfil_publico: true,
  mostrar_email: false,
  mostrar_telefono: false,
  permitir_seguimiento: true,
  permitir_mensajes: true,
};

export default function ConfiguracionPrivacidad() {
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
      // Aquí iría la llamada a la API para guardar preferencias de privacidad
      // await apiFetch("/profiles/privacy", { method: "PUT", body: settings });

      localStorage.setItem(storageKey, JSON.stringify(settings));

      toast({
        title: "✓ Privacidad actualizada",
        description: "Tus cambios han sido guardados correctamente.",
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

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tu privacidad es importante. Puedes cambiar estas configuraciones en cualquier momento.
        </AlertDescription>
      </Alert>

      {/* Visibilidad del perfil */}
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">👁️</span> Visibilidad del perfil
          </CardTitle>
          <CardDescription>
            Controla quién puede ver tu perfil e información
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-medium">Perfil público</p>
              <p className="text-xs text-muted-foreground mt-0.5">Otros miembros pueden ver tu perfil y contactarte</p>
            </div>
            <Switch
              checked={settings.perfil_publico}
              onCheckedChange={() => handleToggle("perfil_publico")}
              disabled={isLoading}
            />
          </div>

          {settings.perfil_publico && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors opacity-100">
                <div className="flex-1">
                  <p className="text-sm font-medium">Mostrar email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tu correo será visible en tu perfil</p>
                </div>
                <Switch
                  checked={settings.mostrar_email}
                  onCheckedChange={() => handleToggle("mostrar_email")}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors opacity-100">
                <div className="flex-1">
                  <p className="text-sm font-medium">Mostrar teléfono</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tu teléfono será visible en tu perfil</p>
                </div>
                <Switch
                  checked={settings.mostrar_telefono}
                  onCheckedChange={() => handleToggle("mostrar_telefono")}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Interacciones */}
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">💬</span> Interacciones
          </CardTitle>
          <CardDescription>
            Controla cómo otros miembros pueden interactuar contigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-medium">Permitir seguimiento</p>
              <p className="text-xs text-muted-foreground mt-0.5">Otros miembros pueden seguir tu actividad</p>
            </div>
            <Switch
              checked={settings.permitir_seguimiento}
              onCheckedChange={() => handleToggle("permitir_seguimiento")}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-medium">Permitir mensajes directos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Otros miembros pueden contactarte por mensaje privado</p>
            </div>
            <Switch
              checked={settings.permitir_mensajes}
              onCheckedChange={() => handleToggle("permitir_mensajes")}
              disabled={isLoading}
            />
          </div>
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
          "Guardar cambios de privacidad"
        )}
      </Button>
    </div>
  );
}
