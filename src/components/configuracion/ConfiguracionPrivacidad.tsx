import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_SETTINGS = {
  perfil_publico: true,
  mostrar_email: false,
  mostrar_telefono: false,
  permitir_seguimiento: true,
  permitir_mensajes: true,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSettings(
  profileData: { privacy_preferences?: unknown; is_public?: boolean | null } | null | undefined,
) {
  const preferences = isPlainObject(profileData?.privacy_preferences)
    ? (profileData.privacy_preferences as Partial<typeof DEFAULT_SETTINGS>)
    : {};

  const hasIsPublic = typeof profileData?.is_public === "boolean";
  const normalizedProfilePublic = hasIsPublic
    ? Boolean(profileData?.is_public)
    : typeof preferences.perfil_publico === "boolean"
      ? preferences.perfil_publico
      : DEFAULT_SETTINGS.perfil_publico;

  return {
    ...DEFAULT_SETTINGS,
    ...preferences,
    perfil_publico: normalizedProfilePublic,
  };
}

export default function ConfiguracionPrivacidad() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
          setSettings(normalizeSettings(data));
        } else {
          const userId = await getEffectiveUserId();
          if (!userId) return;

          const { data, error } = await supabase
            .from("profiles")
            .select("privacy_preferences, is_public")
            .eq("user_id", userId)
            .single();

          if (error) throw error;
          setSettings(normalizeSettings(data));
        }
      } catch (error) {
        console.error("Error loading privacy preferences:", error);
        setSettings(DEFAULT_SETTINGS);
      }
    };

    loadSettings();
  }, [user?.id, user?.user_id]);

  const handleToggle = async (key: keyof typeof settings) => {
    const previousSettings = settings;
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    
    // Guardar automáticamente en Supabase
    try {
      if (isLocalBackend()) {
        await apiFetch("/profiles/me", {
          method: "PUT",
          body: JSON.stringify({
            privacy_preferences: newSettings,
            is_public: newSettings.perfil_publico,
          }),
        });

        const verifiedData = await apiFetch("/profiles/me");
        const verifiedSettings = normalizeSettings(verifiedData);
        setSettings(verifiedSettings);
        if (JSON.stringify(verifiedSettings) !== JSON.stringify(newSettings)) {
          throw new Error("No se pudo verificar el guardado de privacidad");
        }
      } else {
        const userId = await getEffectiveUserId();
        if (!userId) {
          throw new Error("No se pudo identificar el usuario autenticado");
        }

        const { data: updatedRows, error } = await supabase
          .from("profiles")
          .update({
            privacy_preferences: newSettings,
            is_public: newSettings.perfil_publico,
          })
          .eq("user_id", userId)
          .select("user_id")
          .limit(1);
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("No se encontró un perfil para actualizar");
        }

        const { data: verifiedData, error: verifyError } = await supabase
          .from("profiles")
          .select("privacy_preferences, is_public")
          .eq("user_id", userId)
          .single();
        if (verifyError) throw verifyError;

        const verifiedSettings = normalizeSettings(verifiedData);
        setSettings(verifiedSettings);
        if (JSON.stringify(verifiedSettings) !== JSON.stringify(newSettings)) {
          throw new Error("No se pudo verificar el guardado de privacidad");
        }
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
      const effectiveUserId = await getEffectiveUserId();
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (effectiveUserId) {
        await queryClient.invalidateQueries({ queryKey: ["profile", effectiveUserId] });
      }
    } catch (error) {
      console.error("Error saving privacy preferences:", error);
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
          body: JSON.stringify({
            privacy_preferences: settings,
            is_public: settings.perfil_publico,
          }),
        });

        const verifiedData = await apiFetch("/profiles/me");
        setSettings(normalizeSettings(verifiedData));
      } else {
        const userId = await getEffectiveUserId();
        if (!userId) {
          throw new Error("No se pudo identificar el usuario autenticado");
        }

        const { data: updatedRows, error } = await supabase
          .from("profiles")
          .update({
            privacy_preferences: settings,
            is_public: settings.perfil_publico,
          })
          .eq("user_id", userId)
          .select("user_id")
          .limit(1);
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("No se encontró un perfil para actualizar");
        }

        const { data: verifiedData, error: verifyError } = await supabase
          .from("profiles")
          .select("privacy_preferences, is_public")
          .eq("user_id", userId)
          .single();
        if (verifyError) throw verifyError;

        setSettings(normalizeSettings(verifiedData));
      }

      toast({
        title: "✓ Privacidad actualizada",
        description: "Tus cambios han sido guardados correctamente.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
      const effectiveUserId = await getEffectiveUserId();
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (effectiveUserId) {
        await queryClient.invalidateQueries({ queryKey: ["profile", effectiveUserId] });
      }
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
      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tu privacidad es importante. Puedes cambiar estas configuraciones en cualquier momento.
        </AlertDescription>
      </Alert>

      {/* Visibilidad del perfil */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Visibilidad del perfil</CardTitle>
          <CardDescription>
            Controla quién puede ver tu perfil e información
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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

              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Interacciones</CardTitle>
          <CardDescription>
            Controla cómo otros miembros pueden interactuar contigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading} 
          className="h-10 min-w-[220px] rounded-full px-6"
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
    </div>
  );
}
