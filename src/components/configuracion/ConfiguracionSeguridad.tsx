import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Shield, Trash2 } from "lucide-react";

const passwordSchema = z.object({
  password_actual: z.string().min(1, "Ingresa tu contraseña actual"),
  password_nueva: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  password_confirmar: z.string(),
}).refine(
  (data) => data.password_nueva === data.password_confirmar,
  {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmar"],
  }
);

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ConfiguracionSeguridad() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password_actual: "",
      password_nueva: "",
      password_confirmar: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setIsLoading(true);

      // Aquí iría la llamada a la API para cambiar la contraseña
      // await apiFetch("/auth/change-password", {
      //   method: "POST",
      //   body: {
      //     currentPassword: data.password_actual,
      //     newPassword: data.password_nueva,
      //   },
      // });

      toast({
        title: "✓ Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });

      form.reset();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos cambiar tu contraseña. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValue = form.watch("password_nueva");
  const hasUpperCase = /[A-Z]/.test(passwordValue);
  const hasLowerCase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasMinLength = passwordValue?.length >= 8;

  return (
    <div className="space-y-6">
      {isSaved && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm animate-in slide-in-from-top">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Contraseña cambiada correctamente</span>
        </div>
      )}

      {/* Cambiar contraseña */}
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5" /> Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña de forma regular para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password_actual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ingresa tu contraseña actual"
                        {...field}
                        disabled={isLoading}
                        className="focus:ring-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_nueva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ingresa tu nueva contraseña"
                        {...field}
                        disabled={isLoading}
                        className="focus:ring-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Requisitos de seguridad
                    </FormDescription>
                    <div className="space-y-2 mt-3">
                      <div className={`flex items-center gap-2 text-xs ${
                        hasMinLength ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasMinLength ? "bg-green-600 border-green-600" : "border-muted-foreground"
                        }`}>
                          {hasMinLength && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasUpperCase ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasUpperCase ? "bg-green-600 border-green-600" : "border-muted-foreground"
                        }`}>
                          {hasUpperCase && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Una mayúscula (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasLowerCase ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasLowerCase ? "bg-green-600 border-green-600" : "border-muted-foreground"
                        }`}>
                          {hasLowerCase && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Una minúscula (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasNumber ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasNumber ? "bg-green-600 border-green-600" : "border-muted-foreground"
                        }`}>
                          {hasNumber && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Un número (0-9)</span>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirma tu nueva contraseña"
                        {...field}
                        disabled={isLoading}
                        className="focus:ring-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isLoading || !hasUpperCase || !hasLowerCase || !hasNumber || !hasMinLength}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Cambiando...
                  </>
                ) : isSaved ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Cambiado
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Seguridad de la cuenta */}
      <Card className="border-border/50 hover:border-border/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" /> Seguridad de la cuenta
          </CardTitle>
          <CardDescription>
            Opciones avanzadas para proteger tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Autenticación de dos factores (2FA) está disponible próximamente
            </AlertDescription>
          </Alert>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-muted/20">
              <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                <span className="text-lg">📱</span> Sesiones activas
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Gestiona los dispositivos con acceso a tu cuenta</p>
              <Button variant="outline" disabled className="w-full text-xs">
                Ver sesiones activas
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-muted/20">
              <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                <span className="text-lg">📊</span> Actividad de cuenta
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Revisa el historial de inicios de sesión y cambios</p>
              <Button variant="outline" disabled className="w-full text-xs">
                Ver actividad
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eliminar cuenta */}
      <Card className="border-destructive/50 bg-destructive/5 hover:border-destructive/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-base text-destructive font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Zona de peligro
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectarán tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Si eliminas tu cuenta, toda tu información será perdida permanentemente. Esta acción no se puede deshacer.
          </p>
          <Button
            variant="destructive"
            disabled
            className="w-full"
          >
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
