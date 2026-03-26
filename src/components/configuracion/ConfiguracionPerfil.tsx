import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Progress } from "@/components/ui/progress";

const profileSchema = z.object({
  nombre_completo: z.string().min(3, "Nombre debe tener al menos 3 caracteres"),
  profesion_ocupacion: z.string().optional().default(""),
  descripcion_personal: z.string().max(500, "Máximo 500 caracteres").optional().default(""),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ConfiguracionPerfil() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [charCount, setCharCount] = useState(user?.profile?.descripcion_personal?.length || 0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre_completo: user?.profile?.nombre_completo || "",
      profesion_ocupacion: user?.profile?.profesion_ocupacion || "",
      descripcion_personal: user?.profile?.descripcion_personal || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);

      // Aquí iría la llamada a la API para actualizar perfil
      // await apiFetch("/profiles/update", { method: "PUT", body: data });

      toast({
        title: "✓ Perfil actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
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

  const completionPercentage = Math.round((
    (form.watch("nombre_completo") ? 33 : 0) +
    (form.watch("profesion_ocupacion") ? 33 : 0) +
    (form.watch("descripcion_personal") ? 34 : 0)
  ));

  return (
    <div className="space-y-6">
      {isSaved && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm animate-in slide-in-from-top">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Cambios guardados correctamente</span>
        </div>
      )}

      {/* Indicador de completitud */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Completitud del perfil</CardTitle>
          <CardDescription>Completa tu perfil para una mejor experiencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{completionPercentage}%</span>
            <span className="text-xs text-muted-foreground">completado</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="nombre_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span className="text-lg">👤</span> Nombre completo
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tu nombre completo"
                    {...field}
                    disabled={isLoading}
                    className="focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
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
                <FormLabel className="flex items-center gap-2">
                  <span className="text-lg">💼</span> Profesión u ocupación
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Ingeniero, Docente, Estudiante..."
                    {...field}
                    disabled={isLoading}
                    className="focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
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
                <FormLabel className="flex items-center gap-2">
                  <span className="text-lg">📝</span> Sobre mí
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cuéntanos un poco sobre ti, tus intereses, experiencias en scouts..."
                    className="resize-none focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
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

          <Button type="submit" disabled={isLoading} className="w-full bg-primary transition-transform duration-300 hover:scale-105 hover:bg-primary/90 active:scale-95">
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
        </form>
      </Form>
    </div>
  );
}
