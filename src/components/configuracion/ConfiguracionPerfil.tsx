import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";

const profileSchema = z.object({
  nombre_completo: z.string().min(3, "Nombre debe tener al menos 3 caracteres"),
  profesion_ocupacion: z.string().optional().default(""),
  descripcion_personal: z.string().max(500, "Máximo 500 caracteres").optional().default(""),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ConfiguracionPerfil() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre_completo: user?.profile?.nombre_completo || user?.nombre_completo || "",
      profesion_ocupacion: user?.profile?.profesion_ocupacion || user?.profesion_ocupacion || "",
      descripcion_personal:
        user?.profile?.descripcion_personal || user?.descripcion_personal || "",
    },
  });

  // Cargar datos del perfil desde Supabase
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isLocalBackend()) {
          const data = await apiFetch("/profiles/me");
          if (data) {
            form.reset({
              nombre_completo: data.nombre_completo || "",
              profesion_ocupacion: data.profesion_ocupacion || "",
              descripcion_personal: data.descripcion_personal || "",
            });
            setCharCount(data.descripcion_personal?.length || 0);
          }
        } else {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          const userId = authUser?.id || user?.user_id || user?.id;
          if (!userId) return;

          const { data, error } = await supabase
            .from("profiles")
            .select("nombre_completo, profesion_ocupacion, descripcion_personal")
            .eq("user_id", userId)
            .single();

          if (error) throw error;
          if (data) {
            form.reset({
              nombre_completo: data.nombre_completo || "",
              profesion_ocupacion: data.profesion_ocupacion || "",
              descripcion_personal: data.descripcion_personal || "",
            });
            setCharCount(data.descripcion_personal?.length || 0);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [user?.id, user?.user_id, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);

      if (isLocalBackend()) {
        await apiFetch("/profiles/me", {
          method: "PUT",
          body: JSON.stringify({
            nombre_completo: data.nombre_completo,
            profesion_ocupacion: data.profesion_ocupacion || null,
            descripcion_personal: data.descripcion_personal || null,
          }),
        });
      } else {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        const userId = authUser?.id || user?.user_id || user?.id;
        if (!userId) {
          throw new Error("No se pudo identificar el usuario autenticado");
        }

        const { data: updatedRows, error } = await supabase
          .from("profiles")
          .update({
            nombre_completo: data.nombre_completo,
            profesion_ocupacion: data.profesion_ocupacion || null,
            descripcion_personal: data.descripcion_personal || null,
          })
          .eq("user_id", userId)
          .select("user_id")
          .limit(1);

        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("No se encontró un perfil para actualizar");
        }
      }

      toast({
        title: "✓ Perfil actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos guardar tu perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="nombre_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tu nombre completo"
                    {...field}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-border/70 bg-background/70"
                  />
                </FormControl>
                <FormDescription>
                  Este es el nombre que aparece en tu perfil público
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profesion_ocupacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profesión u ocupación</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Ingeniero, Docente, Estudiante..."
                    {...field}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-border/70 bg-background/70"
                  />
                </FormControl>
                <FormDescription>
                  Opcional - Comparte tu profesión con otros miembros
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion_personal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobre mí</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cuéntanos un poco sobre ti, tus intereses, experiencias en scouts..."
                    className="resize-none rounded-xl border-border/70 bg-background/70"
                    rows={4}
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      setCharCount(e.target.value.length);
                    }}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormDescription>
                    Aparece en tu perfil público
                  </FormDescription>
                  <span className={`text-xs ${
                    charCount > 450 ? "text-orange-600" : "text-muted-foreground"
                  }`}>
                    {charCount}/500
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 min-w-[170px] rounded-full px-6"
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
              "Guardar cambios"
            )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
