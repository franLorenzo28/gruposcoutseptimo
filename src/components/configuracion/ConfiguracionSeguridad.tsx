import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertCircle, Lock, MailCheck, Shield, Smartphone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/api";
import { apiFetch, getAuthUser, isLocalBackend } from "@/lib/backend";
import {
  parseEducatorUnits,
  requestEducatorPermissions,
  type EducatorUnit,
} from "@/lib/admin-permissions";
import { checkEmailVerified, sendVerificationEmail } from "@/lib/email-verification";

const EDUCATOR_UNIT_OPTIONS: Array<{ value: EducatorUnit; label: string }> = [
  { value: "manada", label: "Manada (Lobatos)" },
  { value: "tropa", label: "Tropa (11-14 años)" },
  { value: "pioneros", label: "Pioneros" },
  { value: "rovers", label: "Rovers" },
];

function normalizeRole(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  const { refreshUser } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [requestUnits, setRequestUnits] = useState<EducatorUnit[]>([]);
  const [requestNote, setRequestNote] = useState("");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [loadingRequestContext, setLoadingRequestContext] = useState(true);
  const [canRequestEducatorPermissions, setCanRequestEducatorPermissions] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [loadingEmailVerification, setLoadingEmailVerification] = useState(true);
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false);
  const [lastVerificationLink, setLastVerificationLink] = useState<string | null>(null);
  const allowDeleteAccount = isLocalBackend();

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

      if (isLocalBackend()) {
        // Para backend local, usar la API Express (no implementado aún)
        throw new Error("Cambio de contraseña disponible solo en Supabase");
      } else {
        // Para Supabase, usar updateUser que maneja la seguridad internamente
        // Nota: Supabase no valida la contraseña actual en updateUser,
        // envía un email de confirmación en su lugar
        const { error } = await supabase.auth.updateUser({
          password: data.password_nueva,
        });
        
        if (error) throw error;
      }

      toast({
        title: "✓ Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente. Por favor recarga la página.",
      });

      form.reset();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      await refreshUser();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No pudimos cambiar tu contraseña. Intenta de nuevo.",
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
  const deleteReady =
    deletePhrase.trim().toUpperCase() === "BORRAR" &&
    deleteConfirmPhrase.trim().toUpperCase() === "BORRAR";

  useEffect(() => {
    let active = true;

    (async () => {
      if (isLocalBackend()) {
        if (!active) return;
        setCanRequestEducatorPermissions(false);
        setLoadingRequestContext(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        if (!user) {
          setCanRequestEducatorPermissions(false);
          setLoadingRequestContext(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("rol_adulto, rama_que_educa")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;

        const role = normalizeRole(profile?.rol_adulto);
        const isEducador =
          role === "educador/a" || role === "educador" || role === "educadora";

        setCanRequestEducatorPermissions(isEducador);
        setRequestUnits(parseEducatorUnits(profile?.rama_que_educa || ""));
      } catch {
        if (!active) return;
        setCanRequestEducatorPermissions(false);
      } finally {
        if (active) setLoadingRequestContext(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const toggleRequestUnit = (unit: EducatorUnit) => {
    setRequestUnits((prev) =>
      prev.includes(unit) ? prev.filter((value) => value !== unit) : [...prev, unit],
    );
  };

  const refreshEmailVerificationStatus = async (notifyIfPending = false) => {
    try {
      setLoadingEmailVerification(true);
      const authUser = await getAuthUser();

      if (!authUser) {
        setEmailVerified(false);
        setEmailAddress(null);
        return;
      }

      setEmailAddress(authUser.email || null);

      if (authUser.isLocal) {
        const verified = !!authUser.email_verified;
        setEmailVerified(verified);
        if (notifyIfPending && !verified) {
          toast({
            title: "Correo pendiente",
            description: "Tu correo todavía no figura como verificado.",
          });
        }
        return;
      }

      const verified = await checkEmailVerified();
      setEmailVerified(verified);
      if (notifyIfPending && !verified) {
        toast({
          title: "Correo pendiente",
          description: "Tu correo todavía no figura como verificado.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No pudimos comprobar el estado de verificación del correo.",
        variant: "destructive",
      });
    } finally {
      setLoadingEmailVerification(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (emailVerified) {
      toast({
        title: "Correo ya verificado",
        description: "Tu cuenta ya tiene el correo verificado.",
      });
      return;
    }

    try {
      setSendingVerificationEmail(true);

      if (isLocalBackend()) {
        await apiFetch("/auth/resend-verification", { method: "POST" });
        setLastVerificationLink(null);
        toast({
          title: "Email enviado",
          description: "Revisa tu bandeja para verificar tu cuenta.",
        });
      } else {
        const result = await sendVerificationEmail();
        setLastVerificationLink(result.verificationUrl || null);
        toast({
          title: "Email enviado",
          description: result.message || "Revisa tu bandeja para verificar tu cuenta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo enviar el email de verificación.",
        variant: "destructive",
      });
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  useEffect(() => {
    void refreshEmailVerificationStatus(false);
  }, []);

  const handleRequestEducatorPermissions = async () => {
    if (!canRequestEducatorPermissions) {
      toast({
        title: "No habilitado",
        description: "Esta solicitud está disponible para perfiles con rol educador/a.",
        variant: "destructive",
      });
      return;
    }

    if (requestUnits.length === 0) {
      toast({
        title: "Selecciona unidades",
        description: "Debes elegir al menos una unidad para solicitar permisos.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRequestingPermission(true);
      const result = await requestEducatorPermissions({
        units: requestUnits,
        note: requestNote,
      });

      toast({
        title: "Solicitud enviada",
        description: `Se notificó a ${result.sentCount} administrador(es)/mod para revisión.`,
      });
      setRequestNote("");
    } catch (error: any) {
      toast({
        title: "No se pudo enviar",
        description: error?.message || "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReady) return;
    try {
      setDeletingAccount(true);
      await deleteMyAccount();

      try {
        localStorage.removeItem("local_api_token");
      } catch {
        // noop
      }
      try {
        await supabase.auth.signOut();
      } catch {
        // noop
      }

      toast({ title: "Cuenta eliminada" });
      navigate("/auth");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seguridad de la cuenta */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" /> Seguridad de la cuenta
          </CardTitle>
          <CardDescription>
            Opciones avanzadas para proteger tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
            <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <MailCheck className="h-4 w-4" /> Verificación de correo
            </h4>
            {loadingEmailVerification ? (
              <p className="text-xs text-muted-foreground">Comprobando estado del correo...</p>
            ) : emailVerified ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Correo verificado{emailAddress ? `: ${emailAddress}` : ""}.
                </p>
                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                  Correo verificado
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Tu correo aún no está verificado{emailAddress ? ` (${emailAddress})` : ""}.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleResendVerificationEmail}
                    disabled={sendingVerificationEmail}
                  >
                    {sendingVerificationEmail ? "Enviando..." : "Verificar email"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => refreshEmailVerificationStatus(true)}
                    disabled={loadingEmailVerification}
                  >
                    Ya verifiqué, actualizar estado
                  </Button>
                </div>
                {lastVerificationLink && (
                  <a
                    href={lastVerificationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-primary underline"
                  >
                    Abrir enlace de verificación
                  </a>
                )}
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Autenticación de dos factores (2FA) está disponible próximamente
            </AlertDescription>
          </Alert>

          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Sesiones activas
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Gestiona los dispositivos con acceso a tu cuenta</p>
              <Button variant="outline" disabled className="w-full text-xs">
                Ver sesiones activas
              </Button>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Actividad de cuenta
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Revisa el historial de inicios de sesión y cambios</p>
              <Button variant="outline" disabled className="w-full text-xs">
                Ver actividad
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitud de permisos educador */}
      <Card className="border-border/60 bg-background/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" /> Permisos de educador por unidad
          </CardTitle>
          <CardDescription>
            Si te faltan permisos para subir archivos, difusión o gestión interna, envía una solicitud a administración.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLocalBackend() ? (
            <p className="text-sm text-muted-foreground">
              Esta función está disponible en modo Supabase.
            </p>
          ) : loadingRequestContext ? (
            <p className="text-sm text-muted-foreground">Verificando tu perfil...</p>
          ) : !canRequestEducatorPermissions ? (
            <p className="text-sm text-muted-foreground">
              Necesitas tener rol <strong>Educador/a</strong> en tu perfil para solicitar permisos de unidad.
            </p>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium">Unidades para habilitar</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EDUCATOR_UNIT_OPTIONS.map((option) => {
                    const selected = requestUnits.includes(option.value);
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => toggleRequestUnit(option.value)}
                        disabled={requestingPermission}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Detalle opcional para admin/mod</label>
                <Textarea
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  placeholder="Ej: necesito habilitación en Tropa y Pioneros para gestión de documentos y difusión."
                  className="mt-2"
                  maxLength={600}
                  disabled={requestingPermission}
                />
                <p className="mt-1 text-xs text-muted-foreground">{requestNote.length}/600</p>
              </div>

              <Button
                type="button"
                onClick={handleRequestEducatorPermissions}
                disabled={requestingPermission || requestUnits.length === 0}
                className="w-full"
              >
                {requestingPermission ? "Enviando solicitud..." : "Solicitar permisos de educador"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card className="border-border/60 bg-background/40 shadow-none">
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
                        className="focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
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
                        className="focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
                      />
                    </FormControl>
                    <FormDescription>
                      Requisitos de seguridad
                    </FormDescription>
                    <div className="space-y-2 mt-3">
                      <div className={`flex items-center gap-2 text-xs ${
                        hasMinLength ? "text-scout-red" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasMinLength ? "bg-scout-red border-scout-red" : "border-muted-foreground"
                        }`}>
                          {hasMinLength && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasUpperCase ? "text-scout-red" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasUpperCase ? "bg-scout-red border-scout-red" : "border-muted-foreground"
                        }`}>
                          {hasUpperCase && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Una mayúscula (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasLowerCase ? "text-scout-red" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasLowerCase ? "bg-scout-red border-scout-red" : "border-muted-foreground"
                        }`}>
                          {hasLowerCase && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span>Una minúscula (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        hasNumber ? "text-scout-red" : "text-muted-foreground"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasNumber ? "bg-scout-red border-scout-red" : "border-muted-foreground"
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
                        className="focus:ring-2 focus:shadow-[0_0_0_3px_hsla(0,100%,50%,0.1)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit" 
                disabled={isLoading || !hasUpperCase || !hasLowerCase || !hasNumber || !hasMinLength}
                className="h-10 w-full rounded-full"
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

      {/* ATENCION */}
      <Card className="border-destructive/40 bg-destructive/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-destructive font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> ATENCION
          </CardTitle>
          <CardDescription>
            Eliminar tu cuenta es irreversible y borrará todos tus datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta acción eliminará perfil, seguidores, solicitudes, mensajes y demás contenido asociado a tu usuario.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Escribe BORRAR para continuar</label>
            <Input
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              placeholder="BORRAR"
              className="bg-background"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vuelve a escribir BORRAR para confirmar</label>
            <Input
              value={deleteConfirmPhrase}
              onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
              placeholder="BORRAR"
              className="bg-background"
              autoComplete="off"
            />
          </div>

          {!allowDeleteAccount && (
            <p className="text-xs text-muted-foreground">
              La eliminación de cuenta está disponible actualmente en modo local.
            </p>
          )}

          <Button
            variant="destructive"
            disabled={!deleteReady || deletingAccount || !allowDeleteAccount}
            className="w-full"
            onClick={handleDeleteAccount}
          >
            {deletingAccount ? "Eliminando..." : "Eliminar mi cuenta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
