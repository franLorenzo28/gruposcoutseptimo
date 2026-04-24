// --- Validación y sanitización ---
function validateAuth({ email, password, nombreCompleto }: { email: string; password: string; nombreCompleto?: string }) {
  const errors: string[] = [];
  // Email obligatorio y formato válido
  if (!email.trim()) errors.push("El email es obligatorio.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push("El email no es válido.");
  // Password obligatorio y mánimo 6 caracteres
  if (!password.trim()) errors.push("La contraseña es obligatoria.");
  if (password && password.length < 6) errors.push("La contraseña debe tener al menos 6 caracteres.");
  // Nombre: opcional pero si existe, mánimo 3 caracteres y sin caracteres peligrosos
  if (nombreCompleto && nombreCompleto.length < 3) errors.push("El nombre debe tener al menos 3 caracteres.");
  if (nombreCompleto && /[<>"']/.test(nombreCompleto)) errors.push("El nombre contiene caracteres inválidos.");
  // Sanitización básica
  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      nombreCompleto: nombreCompleto ? nombreCompleto.replace(/[<>"']/g, "") : "",
    },
  };
}
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import logoImage from "@/assets/grupo-scout-logo.png";
import PageLoader from "@/components/ui/PageLoader";

function isVercelAppHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

function inferVercelProductionBaseUrl(hostname: string): string | null {
  if (!isVercelAppHost(hostname)) return null;
  const marker = "-git-";
  const markerIndex = hostname.indexOf(marker);
  if (markerIndex === -1) return null;

  const projectSlug = hostname.slice(0, markerIndex);
  if (!projectSlug) return null;

  return `https://${projectSlug}.vercel.app`;
}

function getOAuthSafety() {
  const configuredBaseUrl =
    (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || "";

  // En desarrollo siempre usamos el origen actual (localhost o IP LAN)
  // para evitar que OAuth redirija accidentalmente al dominio de producción.
  if (!import.meta.env.PROD) {
    return { safe: true, baseUrl: window.location.origin, reason: "", warning: "" };
  }

  if (configuredBaseUrl) {
    try {
      const parsed = new URL(configuredBaseUrl);
      const baseUrl = parsed.origin.replace(/\/+$/, "");
      return { safe: true, baseUrl, reason: "", warning: "" };
    } catch {
      return {
        safe: false,
        baseUrl: window.location.origin,
        reason:
          "VITE_APP_URL no tiene un formato válido. Configura una URL completa (https://tu-dominio.com).",
        warning: "",
      };
    }
  }

  if (import.meta.env.PROD) {
    const inferredBaseUrl = inferVercelProductionBaseUrl(window.location.hostname);
    if (inferredBaseUrl) {
      return {
        safe: true,
        baseUrl: inferredBaseUrl,
        reason: "",
        warning:
          "Se detectó preview de Vercel. OAuth usará automáticamente el dominio de producción inferido. Configura VITE_APP_URL para evitar ambigüedades.",
      };
    }
  }

  if (import.meta.env.PROD && isVercelAppHost(window.location.hostname) && !configuredBaseUrl) {
    return {
      safe: true,
      baseUrl: window.location.origin,
      reason: "",
      warning:
        "Estás usando un dominio vercel.app sin VITE_APP_URL. Configura un dominio canónico para estabilizar callbacks OAuth.",
    };
  }

  return { safe: true, baseUrl: window.location.origin, reason: "", warning: "" };
}

function getAuthBaseUrl(): string {
  return getOAuthSafety().baseUrl.replace(/\/+$/, "");
}

function getRuntimeAuthBaseUrl(): string {
  if (!import.meta.env.PROD) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return getAuthBaseUrl();
}

function buildAuthRedirect(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getRuntimeAuthBaseUrl()}${normalizedPath}`;
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const [googleLoginAllowed, setGoogleLoginAllowed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [inlineMessage, setInlineMessage] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLogin = authTab === "login";
  const oauthSafety = useMemo(() => getOAuthSafety(), []);
  const oauthProfileToastShownRef = useRef(false);

  useEffect(() => {
    if (!isLocalBackend() && !oauthSafety.safe && oauthSafety.reason) {
      console.warn("OAuth safety check:", oauthSafety.reason);
    }
    if (!isLocalBackend() && oauthSafety.warning) {
      console.warn("OAuth warning:", oauthSafety.warning);
    }
  }, [oauthSafety.safe, oauthSafety.reason, oauthSafety.warning]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const oauthError = queryParams.get("error");
    const oauthErrorDescription = queryParams.get("error_description");

    if (oauthError) {
      localStorage.removeItem("oauth_intent");
      toast({
        title: "Error de Google OAuth",
        description:
          oauthErrorDescription ||
          "No se pudo completar la autenticación con Google. Intenta nuevamente.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Detectar si venimos de un callback de OAuth (tiene hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      setProcessingOAuth(true);
      setLoading(true);
    }
  }, [toast]);

  useEffect(() => {
    // Verificar sesión actual y manejar callback de OAuth
    const checkSession = async () => {
      try {
        // Obtener accessToken del hash si existe
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        // Obtener la sesión actual (importante para callback de OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error al obtener sesión:", sessionError);
          return;
        }

        if (session?.user) {
          // Validar intent de OAuth (login vs signup)
          if (!isLocalBackend()) {
            const oauthIntent = localStorage.getItem("oauth_intent");

            if (oauthIntent && !oauthProfileToastShownRef.current) {
              toast({
                title: "¡Ya estás dentro!",
                description:
                  "Tip: completa o actualiza tu perfil para que la comunidad te conozca mejor.",
                action: (
                  <ToastAction altText="Ir a editar perfil" onClick={() => navigate("/perfil")}>
                    Editar perfil
                  </ToastAction>
                ),
              });
              oauthProfileToastShownRef.current = true;
            }

            if (oauthIntent === "login" && session.user.email) {
              const { data: isRegistered, error: regErr } = await (supabase as any).rpc("is_email_registered", {
                p_email: session.user.email,
              });

              if (regErr) {
                console.warn("No se pudo validar registro por RPC, se permite continuar OAuth login:", regErr);
              } else if (!isRegistered) {
                // No mostramos toast aquí: el RPC puede no reflejar de inmediato el estado real y generar falsos positivos.
              }
            }

            if (oauthIntent === "signup" && session.user.email) {
              const { data: isRegistered, error: regErr } = await (supabase as any).rpc("is_email_registered", {
                p_email: session.user.email,
              });

              if (regErr) {
                console.warn("No se pudo validar registro por RPC en signup OAuth:", regErr);
              } else if (isRegistered) {
                await supabase.auth.signOut();
                localStorage.removeItem("oauth_intent");
                toast({
                  title: "Ese correo ya está registrado",
                  description:
                    "Ya existe una cuenta con ese correo. Iniciá sesión con Google en la pestaña de ingreso.",
                  variant: "destructive",
                });
                setProcessingOAuth(false);
                setLoading(false);
                return;
              }
            }
            localStorage.removeItem("oauth_intent");
          }
          // Pequeño delay para asegurar que la sesión se persiste
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 100);
          return;
        }

        // Si no hay sesión, necesitamos acceso al token antes de llamar getUser()
        // getUser() requiere una sesión válida, así que solo verificamos el token
        if (accessToken && !session) {
          try {
            const { data, error } = await supabase.auth.getUser(accessToken);
            if (!error && data?.user) {
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 100);
            }
          } catch (err) {
            // Silenciar error esperado si el token no es válido en la primera carga
          }
        }
      } catch (error) {
        console.error("Error inesperado al verificar sesión:", error);
      }
    };

    checkSession();

    // Suscribirse a cambios de autenticación
    let subscription: any;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Solo redirigir en eventos específicos de login exitoso
        if (event === "SIGNED_IN" && session?.user) {
          const pendingOauthIntent = localStorage.getItem("oauth_intent");
          if (pendingOauthIntent) {
            // Durante callback OAuth dejamos que checkSession aplique reglas de login/signup.
            return;
          }
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 200);
        }
      });
      subscription = sub;
    } catch (error) {
      console.error("Error al suscribirse a cambios de auth:", error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Validar si el email está registrado (para login con Google)
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setGoogleLoginAllowed(false);
      setCheckingEmail(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setGoogleLoginAllowed(false);
      setCheckingEmail(false);
      return;
    }
    if (isLocalBackend()) {
      setGoogleLoginAllowed(true);
      setCheckingEmail(false);
      return;
    }

    let isCancelled = false;
    setCheckingEmail(true);

    const timer = setTimeout(async () => {
      try {
        const { data: isRegistered, error } = await (supabase as any).rpc("is_email_registered", {
          p_email: trimmed,
        });
        if (isCancelled) return;
        if (error) {
          setGoogleLoginAllowed(false);
          setCheckingEmail(false);
          return;
        }
        setGoogleLoginAllowed(!!isRegistered);
      } finally {
        if (!isCancelled) setCheckingEmail(false);
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar y sanear datos antes de registrar
    const { valid, errors, sanitized } = validateAuth({ email, password, nombreCompleto });
    if (!valid) {
      setInlineMessage(errors.length > 1 ? errors.join(" • ") : errors[0]);
      toast({
        title: "Error en el formulario",
        description: errors.length > 1 ? errors.join(" • ") : errors[0],
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setInlineMessage("");
    try {
      // Usar cliente Supabase (mock o real según configuración)
      const redirectUrl = buildAuthRedirect("/");
      const { error } = await supabase.auth.signUp({
        email: sanitized.email,
        password: sanitized.password,
        options: {
          data: { nombre: sanitized.nombreCompleto || "" },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("ya está registrado")
        ) {
          toast({
            title: "Usuario ya registrado",
            description:
              "Este correo ya está registrado. Intenta iniciar sesión.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al registrarse",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // En modo mock, el registro es instantáneo y auto-login
        // En modo Supabase real, requiere verificación de email
        if (isLocalBackend()) {
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada.",
          });
          navigate("/");
        } else {
          toast({
            title: "Confirma tu correo electrónico",
            description: `Te enviamos un correo a ${sanitized.email}. Abre ese email y haz clic en el enlace de confirmación (revisa también la carpeta de spam).`,
          });
        }
        setEmail("");
        setPassword("");
        setNombreCompleto("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar y sanear datos antes de login
    const { valid, errors, sanitized } = validateAuth({ email, password });
    if (!valid) {
      setInlineMessage(errors.length > 1 ? errors.join(" • ") : errors[0]);
      toast({
        title: "Error en el formulario",
        description: errors.length > 1 ? errors.join(" • ") : errors[0],
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setInlineMessage("");
    try {
      // Usar cliente Supabase (mock o real según configuración)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitized.email,
        password: sanitized.password,
      });
      if (error) {
        console.error("Error en login:", error);
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Usuario no encontrado")
        ) {
          toast({
            title: "Credenciales inválidas",
            description: "El correo o la contraseña son incorrectos.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed") || error.message.includes("correo no confirmado")) {
          toast({
            title: "Correo no verificado",
            description: "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y spam.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al iniciar sesión",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Verificar si el usuario está verificado
        if (data?.user && !data.user.confirmed_at) {
          toast({
            title: "Correo no verificado",
            description: "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y spam.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });
        }
      }
    } catch (error) {
      console.error("Error inesperado en login:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (intent: "login" | "signup") => {
    if (!oauthSafety.safe) {
      toast({
        title: "Configuración OAuth incompleta",
        description: oauthSafety.reason,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Evita redirects a deployments efímeros usando dominio canónico cuando esté configurado.
      const redirectUrl = buildAuthRedirect("/auth/callback");

      localStorage.setItem("oauth_intent", intent);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error("Error en signInWithOAuth:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      } else {
        // No desactivar loading aquá porque la página se redirigirá
      }
    } catch (error: any) {
      console.error("Error inesperado en Google Sign In:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-start sm:items-center justify-center px-4 pt-8 pb-10 max-[390px]:px-3 max-[390px]:pt-6 sm:py-8 bg-gradient-to-br from-red-700 via-red-600 to-orange-400 dark:from-red-950 dark:via-red-900 dark:to-orange-800 relative overflow-hidden text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/20 dark:bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/15 dark:bg-white/5 blur-3xl" />
      {processingOAuth ? (
        <Card className="w-full max-w-md border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <PageLoader compact message="Procesando inicio de sesión con Google..." className="min-h-0 py-8" />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={
              isLogin
                ? "absolute inset-0 bg-gradient-to-br from-red-500/25 via-red-500/10 to-transparent"
                : "absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent"
            }
          />
          <div
            className={
              isLogin
                ? "absolute top-0 left-0 right-0 h-1.5 bg-red-600/80"
                : "absolute top-0 left-0 right-0 h-1.5 bg-yellow-400/80"
            }
          />
        </div>
        <CardHeader className="text-center text-foreground relative z-10 px-5 pb-4 max-[390px]:px-4">
          <div className="flex justify-center mb-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24">
              <img
                src={logoImage}
                alt="Grupo Scout Séptimo"
                className="w-full h-full object-contain drop-shadow-sm"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Grupo Scout Séptimo
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Únete a nuestra comunidad scout</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 px-5 pb-6 max-[390px]:px-4">
          <Tabs
            value={authTab}
            onValueChange={(value) => {
              setAuthTab(value as "login" | "signup");
              setInlineMessage("");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-background/80 dark:bg-background/70 backdrop-blur-md border border-white/40 dark:border-white/10">
              <TabsTrigger value="login" className="min-h-11 transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="min-h-11 transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {inlineMessage && (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert" aria-live="assertive">
                {inlineMessage}
              </p>
            )}

            <TabsContent value="login" className="data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-500">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="pepe@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                  <p className="text-xs text-muted-foreground">Usa el correo con el que creaste tu cuenta.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPasswordLogin ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (inlineMessage) setInlineMessage("");
                      }}
                      required
                      className="min-h-11"
                    />
                    <button
                      type="button"
                      aria-pressed={showPasswordLogin}
                      aria-label={
                        showPasswordLogin
                          ? "Ocultar contraseña"
                          : "Ver contraseña"
                      }
                      onClick={() => setShowPasswordLogin((s) => !s)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center text-muted-foreground p-1"
                    >
                      {showPasswordLogin ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                      <span className="sr-only">
                        {showPasswordLogin
                          ? "Ocultar contraseña"
                          : "Ver contraseña"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
                </div>
                <Button type="submit" className="w-full min-h-11 shadow-md" disabled={loading || !email.trim() || !password.trim()}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                {!isLocalBackend() && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/90 px-2 text-muted-foreground">
                          O continúa con
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-11 bg-background/90 hover:bg-background"
                      onClick={() => handleGoogleSignIn("login")}
                      disabled={loading || !oauthSafety.safe}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Iniciar sesión con Google
                    </Button>
                    {checkingEmail && (
                      <p className="text-xs text-muted-foreground mt-2">Verificando correo…</p>
                    )}
                    {googleLoginAllowed && !checkingEmail && email.trim() !== "" && (
                      <p className="text-xs text-foreground/80 mt-2">
                        Correo encontrado. Puedes entrar con Google de forma rápida.
                      </p>
                    )}
                    {!googleLoginAllowed && email.trim() !== "" && !checkingEmail && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Si ese correo no está registrado, al iniciar sesión con Google se creará tu cuenta automáticamente.
                      </p>
                    )}
                    {!oauthSafety.safe && (
                      <p className="text-xs text-destructive mt-2">{oauthSafety.reason}</p>
                    )}
                    {oauthSafety.warning && (
                      <p className="text-xs text-muted-foreground mt-2">{oauthSafety.warning}</p>
                    )}
                  </>
                )}
              </form>
            </TabsContent>

            <TabsContent value="signup" className="data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-500">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nombre">Nombre completo</Label>
                  <Input
                    id="signup-nombre"
                    type="text"
                    autoComplete="name"
                    placeholder="Pepe González"
                    value={nombreCompleto}
                    onChange={(e) => {
                      setNombreCompleto(e.target.value);
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                  <p className="text-xs text-muted-foreground">Como quieres que te vea la comunidad.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="pepe@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPasswordSignup ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (inlineMessage) setInlineMessage("");
                      }}
                      required
                      minLength={6}
                      className="min-h-11"
                    />
                    <button
                      type="button"
                      aria-pressed={showPasswordSignup}
                      aria-label={
                        showPasswordSignup
                          ? "Ocultar contraseña"
                          : "Ver contraseña"
                      }
                      onClick={() => setShowPasswordSignup((s) => !s)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center text-muted-foreground p-1"
                    >
                      {showPasswordSignup ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                      <span className="sr-only">
                        {showPasswordSignup
                          ? "Ocultar contraseña"
                          : "Ver contraseña"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
                </div>
                <Button type="submit" className="w-full min-h-11 shadow-md" disabled={loading || !nombreCompleto.trim() || !email.trim() || !password.trim()}>
                  {loading ? "Registrando..." : "Registrarse"}
                </Button>

                {!isLocalBackend() && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/90 px-2 text-muted-foreground">
                          O continúa con
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-11 bg-background/90 hover:bg-background"
                      onClick={() => handleGoogleSignIn("signup")}
                      disabled={loading || !oauthSafety.safe}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Registrarse con Google
                    </Button>
                    {!oauthSafety.safe && (
                      <p className="text-xs text-destructive mt-2">{oauthSafety.reason}</p>
                    )}
                    {oauthSafety.warning && (
                      <p className="text-xs text-muted-foreground mt-2">{oauthSafety.warning}</p>
                    )}
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Auth;

