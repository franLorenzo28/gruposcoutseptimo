// --- Validación y sanitización ---
function validateAuth({ email, password, nombreCompleto, telefono }: { email: string; password: string; nombreCompleto?: string; telefono?: string }) {
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
  // Teléfono: opcional pero si existe debe ser numérico
  if (telefono && !/^\+?\d{7,15}$/.test(telefono)) errors.push("El teléfono debe ser válido (solo números, puede incluir +).");
  // Sanitización básica
  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      nombreCompleto: nombreCompleto ? nombreCompleto.replace(/[<>"']/g, "") : "",
      telefono: telefono ? telefono.replace(/[^\d+]/g, "") : "",
    },
  };
}
import { useState, useEffect } from "react";
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
import logoImage from "@/assets/grupo-scout-logo.png";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const [googleLoginAllowed, setGoogleLoginAllowed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLogin = authTab === "login";

  useEffect(() => {
    // Detectar si venimos de un callback de OAuth (tiene hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      console.log("Detectado callback de OAuth con access_token");
      setProcessingOAuth(true);
      setLoading(true);
    }
  }, []);

  useEffect(() => {
    // Verificar sesión actual y manejar callback de OAuth
    const checkSession = async () => {
      try {
        // Obtener la sesión actual (importante para callback de OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error al obtener sesión:", sessionError);
          return;
        }

        if (session?.user) {
          console.log("Usuario autenticado detectado en checkSession:", session.user.email);
          // Validar intent de OAuth (login vs signup)
          if (!isLocalBackend()) {
            const oauthIntent = localStorage.getItem("oauth_intent");
            if (oauthIntent === "login" && session.user.email) {
              const { data: isRegistered, error: regErr } = await supabase.rpc("is_email_registered", {
                p_email: session.user.email,
              });
              if (regErr || !isRegistered) {
                await supabase.auth.signOut();
                localStorage.removeItem("oauth_intent");
                toast({
                  title: "Primero debes registrarte",
                  description: "Ese correo no está registrado. Regástrate y luego podrás iniciar sesión con Google.",
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

        // Si no hay sesión, verificar usuario por si acaso
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error al obtener usuario:", error);
          return;
        }
        if (data?.user) {
          console.log("Usuario autenticado detectado en getUser:", data.user.email);
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 100);
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
        console.log("Auth state change evento:", event, "email:", session?.user?.email);
        
        // Solo redirigir en eventos especáficos de login exitoso
        if (event === "SIGNED_IN" && session?.user) {
          console.log("SIGNED_IN detectado, redirigiendo a /");
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 200);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          console.log("TOKEN_REFRESHED con usuario activo");
        } else if (event === "USER_UPDATED" && session?.user) {
          console.log("USER_UPDATED con usuario activo");
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
        const { data: isRegistered, error } = await supabase.rpc("is_email_registered", {
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
    const { valid, errors, sanitized } = validateAuth({ email, password, nombreCompleto, telefono });
    if (!valid) {
      toast({
        title: "Error en el formulario",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Usar cliente Supabase (mock o real según configuración)
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: sanitized.email,
        password: sanitized.password,
        options: {
          data: { nombre: sanitized.nombreCompleto || null, telefono: sanitized.telefono || null },
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
        setTelefono("");
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
      toast({
        title: "Error en el formulario",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
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
    setLoading(true);
    try {
      // Usar la URL actual completa para el redirect
      const redirectUrl = window.location.origin + "/auth";
      console.log("Iniciando OAuth con redirect a:", redirectUrl);

      localStorage.setItem("oauth_intent", intent);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.log("OAuth iniciado correctamente:", data);
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
    <div className="min-h-[100svh] flex items-start sm:items-center justify-center px-4 pt-8 pb-10 sm:py-8 bg-gradient-to-br from-red-700 via-red-600 to-orange-400 dark:from-red-950 dark:via-red-900 dark:to-orange-800 relative overflow-hidden text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/20 dark:bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/15 dark:bg-white/5 blur-3xl" />
      {processingOAuth ? (
        <Card className="w-full max-w-md border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Procesando inicio de sesión con Google...</p>
            </div>
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
        <CardHeader className="text-center text-foreground relative z-10">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <img
                src={logoImage}
                alt="Grupo Scout Séptimo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Grupo Scout Séptimo
          </CardTitle>
          <CardDescription>Únete a nuestra comunidad scout</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Tabs
            value={authTab}
            onValueChange={(value) => setAuthTab(value as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-background/80 dark:bg-background/70 backdrop-blur-md border border-white/40 dark:border-white/10">
              <TabsTrigger value="login" className="transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                Registrarse
              </TabsTrigger>
            </TabsList>

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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                </div>
                <Button type="submit" className="w-full shadow-md" disabled={loading}>
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
                      className="w-full bg-background/90 hover:bg-background"
                      onClick={() => handleGoogleSignIn("login")}
                      disabled={loading}
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
                    {!googleLoginAllowed && email.trim() !== "" && !checkingEmail && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Si ese correo no está registrado, el login con Google se rechazará y se te pedirá registrarte.
                      </p>
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
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-telefono">Teléfono</Label>
                  <Input
                    id="signup-telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+598 123 456 789"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                </div>
                <Button type="submit" className="w-full shadow-md" disabled={loading}>
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
                      className="w-full bg-background/90 hover:bg-background"
                      onClick={() => handleGoogleSignIn("signup")}
                      disabled={loading}
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

