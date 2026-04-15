import { useEffect, useState } from "react";
import { sendVerificationEmail, checkEmailVerified } from "@/lib/email-verification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MailCheck, MailQuestion, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type VerifiedToastMode = "always" | "once-per-login" | "never";

const VERIFIED_TOAST_STORAGE_PREFIX = "email-verified-toast-shown";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  featureName?: string;
  verifiedToastMode?: VerifiedToastMode;
  verifiedToastScope?: string;
}

/**
 * Envuelve contenido que requiere email verificado.
 * Si el email no está verificado, muestra instrucciones y opción para reenviar.
 */
const EmailVerificationGuard = ({
  children,
  featureName = "Funcionalidad",
  verifiedToastMode = "always",
  verifiedToastScope,
}: EmailVerificationGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [lastVerificationLink, setLastVerificationLink] = useState<string | null>(null);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const { toast } = useToast();

  const resolveVerifiedToastKey = async () => {
    if (typeof window === "undefined") return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const scope = (verifiedToastScope || featureName || "feature").toLowerCase();
    return `${VERIFIED_TOAST_STORAGE_PREFIX}:${scope}:${user.id}`;
  };

  const shouldShowVerifiedToast = async () => {
    if (verifiedToastMode === "never") return false;
    if (verifiedToastMode === "always") return true;

    try {
      const storageKey = await resolveVerifiedToastKey();
      if (!storageKey) return true;
      return window.sessionStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  };

  const markVerifiedToastAsShown = async () => {
    if (verifiedToastMode !== "once-per-login") return;

    try {
      const storageKey = await resolveVerifiedToastKey();
      if (!storageKey) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // noop
    }
  };

  const clearVerifiedToastSessionFlags = () => {
    if (typeof window === "undefined") return;

    try {
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index);
        if (key?.startsWith(`${VERIFIED_TOAST_STORAGE_PREFIX}:`)) {
          window.sessionStorage.removeItem(key);
        }
      }
    } catch {
      // noop
    }
  };

  const recheckVerification = async (notifyIfPending = false) => {
    try {
      const ok = await checkEmailVerified();
      setVerified(ok);
      if (ok) {
        const canNotify = await shouldShowVerifiedToast();
        if (canNotify) {
          toast({
            title: "Email verificado",
            description: `Ya podés acceder a ${featureName}.`,
          });
          await markVerifiedToastAsShown();
        }
      } else if (notifyIfPending) {
        toast({
          title: "Aún sin verificar",
          description: "Si ya abriste el enlace, esperá unos segundos y vuelve a intentar.",
        });
      }
      return ok;
    } catch (e) {
      console.warn("Error refrescando verificación", e);
      if (notifyIfPending) {
        toast({
          title: "No se pudo comprobar",
          description: "Intentá de nuevo en unos segundos.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Chequear estado inicial de verificación
  useEffect(() => {
    (async () => {
      try {
        await recheckVerification(false);
      } catch (e) {
        console.warn("Error comprobando verificación", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (verifiedToastMode !== "once-per-login") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearVerifiedToastSessionFlags();
      }
    });

    return () => subscription.unsubscribe();
  }, [verifiedToastMode]);

  // Polling suave para desbloquear el contenido sin recargar la página.
  useEffect(() => {
    if (loading || verified) return;
    const id = window.setInterval(() => {
      recheckVerification(false);
    }, 15000);
    return () => window.clearInterval(id);
  }, [loading, verified]);

  const handleResend = async () => {
    setSending(true);
    try {
      const result: any = await sendVerificationEmail();
      if (result?.verificationUrl) {
        setLastVerificationLink(result.verificationUrl);
        if (result.developmentMode) setDevelopmentMode(true);
      }
      toast({
        title: "Token generado",
        description: result?.developmentMode
          ? "Link copiado / visible en consola (modo desarrollo)."
          : "Si el envío está habilitado, revisa tu correo.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo generar el token.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Mientras carga estado
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Si ya verificado, mostrar contenido protegido
  if (verified) {
    return <>{children}</>;
  }

  // Bloque de verificación pendiente
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Alert className="mb-6">
        <MailQuestion className="h-5 w-5" />
        <AlertTitle>Email sin verificar</AlertTitle>
        <AlertDescription>
          Necesitas verificar tu email para acceder a <strong>{featureName}</strong>.<br />
          Presiona el botón para generar / reenviar tu link de verificación.
        </AlertDescription>
      </Alert>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>
              El sistema usa un <strong>token de un solo uso</strong> válido por 24 horas. Al
              hacer clic en el enlace tu email quedará marcado como verificado.
            </p>
            {developmentMode && lastVerificationLink && (
              <p className="mt-2 text-xs bg-muted p-2 rounded">
                Modo desarrollo: abre manualmente este link si no recibes correo:<br />
                <a
                  href={lastVerificationLink}
                  className="text-primary underline break-all"
                >
                  {lastVerificationLink}
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleResend} disabled={sending} variant="default">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Generar / Reenviar link
                </>
              )}
            </Button>
            {lastVerificationLink && (
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard
                    .writeText(lastVerificationLink)
                    .then(() =>
                      toast({
                        title: "Copiado",
                        description: "Link copiado al portapapeles.",
                      }),
                    )
                    .catch(() =>
                      toast({
                        title: "No se pudo copiar",
                        description: "Copialo manualmente desde el texto.",
                        variant: "destructive",
                      }),
                    );
                }}
              >
                <MailCheck className="h-4 w-4 mr-2" /> Copiar link
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => recheckVerification(true)}
              disabled={sending}
            >
              Ya verifiqué mi email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si el correo tarda, revisa spam. En desarrollo puede no enviarse y sólo mostrarse el link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationGuard;

