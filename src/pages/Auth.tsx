import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { useSupabaseUser } from "@/providers/AppProviders";
import logoImage from "@/assets/grupo-scout-logo.png";
import PageLoader from "@/components/ui/PageLoader";
import { PageGridBackground } from "@/components/PageGridBackground";
import RegistroContactoWhatsApp from "@/components/auth/RegistroContactoWhatsApp";
import { apiFetch, getBackendUrl, isLocalBackend, saveLocalAccessToken } from "@/lib/backend";

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
  // para evitar que OAuth redirija accidentalmente al dominio de producci�n.
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

function sanitizeText(value: string): string {
  return value.replace(/[<>"']/g, "").trim();
}

function splitFullName(fullName: string): { nombre: string; apellido: string } {
  const parts = sanitizeText(fullName)
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) {
    return { nombre: parts[0] || "", apellido: "" };
  }
  return {
    nombre: parts.slice(0, -1).join(" "),
    apellido: parts[parts.length - 1] || "",
  };
}

type GoogleCompletionDraft = {
  nombre: string;
  apellido: string;
  email: string;
  grupo: string;
  otroGrupo: string;
  rama: string;
  nombre_scout_relacionado: string;
};

function getMetadataRecord(user: SupabaseUser): Record<string, unknown> {
  return (user.user_metadata || {}) as Record<string, unknown>;
}

function getMetadataString(user: SupabaseUser, key: string): string {
  const value = getMetadataRecord(user)[key];
  return typeof value === "string" ? value : "";
}

function getMetadataBoolean(user: SupabaseUser, key: string): boolean {
  const value = getMetadataRecord(user)[key];
  return value === true || value === "true" || value === "1";
}

function isGoogleProvider(user: SupabaseUser): boolean {
  const provider = (user.app_metadata as Record<string, unknown> | undefined)?.provider;
  return String(provider || "").toLowerCase() === "google";
}

function buildGoogleCompletionDraft(user: SupabaseUser): GoogleCompletionDraft {
  const rawName =
    getMetadataString(user, "nombre_completo") ||
    getMetadataString(user, "full_name") ||
    getMetadataString(user, "name");
  const split = splitFullName(rawName);

  return {
    nombre: getMetadataString(user, "nombre") || split.nombre,
    apellido: getMetadataString(user, "apellido") || split.apellido,
    email: typeof user.email === "string" ? user.email : "",
    grupo: getMetadataString(user, "grupo_scout") || "septimo",
    otroGrupo: getMetadataString(user, "otro_grupo") || "",
    rama: getMetadataString(user, "rama"),
    nombre_scout_relacionado: getMetadataString(user, "nombre_scout_relacionado"),
  };
}

function shouldPromptGoogleCompletion(user: SupabaseUser): boolean {
  return isGoogleProvider(user) && !getMetadataBoolean(user, "profile_complete");
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsGoogleCompletion, setNeedsGoogleCompletion] = useState(false);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [googleCompletionDraft, setGoogleCompletionDraft] = useState<GoogleCompletionDraft>({
    nombre: "",
    apellido: "",
    email: "",
    grupo: "septimo",
    otroGrupo: "",
    rama: "",
    nombre_scout_relacionado: "",
  });
  const [signupNombre, setSignupNombre] = useState("");
  const [signupApellido, setSignupApellido] = useState("");
  const [signupGrupo, setSignupGrupo] = useState("septimo");
  const [signupOtroGrupo, setSignupOtroGrupo] = useState("");
  const [signupRama, setSignupRama] = useState("");
  const [signupNombreScoutRelacionado, setSignupNombreScoutRelacionado] = useState("");
  const [showOptionalSignup, setShowOptionalSignup] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const [googleLoginAllowed, setGoogleLoginAllowed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [inlineMessage, setInlineMessage] = useState<string>("");
  const [signupVerificationUrl, setSignupVerificationUrl] = useState<string | null>(null);
  const [localOAuthTicket, setLocalOAuthTicket] = useState<string | null>(null);
  const [loginRedirecting, setLoginRedirecting] = useState(false);
  const [showWhatsappContacts, setShowWhatsappContacts] = useState(false);
  const [recentSignupName, setRecentSignupName] = useState("");
  const [pendingSignup, setPendingSignup] = useState<{
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    grupo: string;
    otroGrupo: string;
    rama: string;
    nombreScoutRelacionado: string;
  } | null>(null);
  const [whatsappGateActive, setWhatsappGateActive] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLogin = authTab === "login";
  const oauthSafety = useMemo(() => getOAuthSafety(), []);
  const { session: memberSession, isCheckingAuth } = useMemberAuth();
  const { user, isUserLoading, accountStatus } = useSupabaseUser();
  const localOAuthStartedRef = useRef(false);
  const oauthAvailable = isLocalBackend() || oauthSafety.safe;

  useEffect(() => {
    if (!isLocalBackend()) return;
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const oauthError = hash.get("oauth_error");
    const ticket = hash.get("oauth_ticket") || sessionStorage.getItem("grupo7_google_oauth_ticket");
    if (!oauthError && !ticket) return;
    if (localOAuthStartedRef.current) return;
    localOAuthStartedRef.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    if (oauthError) {
      sessionStorage.removeItem("grupo7_google_oauth_ticket");
      setInlineMessage({
        account_not_found: "No existe una cuenta con ese correo. Usa Registrarse para solicitar acceso.",
        account_pending_approval: "La cuenta está pendiente de aprobación.",
        account_rejected: "La solicitud de acceso fue rechazada.",
        access_denied: "Cancelaste el acceso con Google.",
      }[oauthError] || "No se pudo completar el acceso con Google. Intenta nuevamente.");
      return;
    }
    sessionStorage.setItem("grupo7_google_oauth_ticket", ticket!);
    setProcessingOAuth(true);
    void apiFetch<{ intent: "login" | "signup"; email: string; user_metadata: Record<string, unknown> }>(
      "/v1/auth/google/ticket", { method: "POST", auth: "none", body: JSON.stringify({ ticket }) },
    ).then(async (info) => {
      if (info.intent === "login") {
        const session = await apiFetch<{ access_token: string }>("/v1/auth/google/exchange", {
          method: "POST", auth: "none", body: JSON.stringify({ ticket }),
        });
        saveLocalAccessToken(session.access_token);
        sessionStorage.removeItem("grupo7_google_oauth_ticket");
        // Los proveedores validan la sesión antes de navegar.
        return;
      }
      const metadata = info.user_metadata || {};
      const fullName = String(metadata.name || metadata.full_name || "").trim();
      const [first = "", ...rest] = fullName.split(/\s+/);
      setLocalOAuthTicket(ticket);
      setGoogleCompletionDraft((current) => ({
        ...current,
        nombre: String(metadata.given_name || first),
        apellido: String(metadata.family_name || rest.join(" ")),
        email: info.email,
      }));
      setAuthTab("signup");
      setNeedsGoogleCompletion(true);
    }).catch((error) => {
      sessionStorage.removeItem("grupo7_google_oauth_ticket");
      setInlineMessage(error instanceof Error ? error.message : "La sesión de Google expiró.");
    }).finally(() => setProcessingOAuth(false));
  }, [navigate]);


  useEffect(() => {
    if (!oauthSafety.safe && oauthSafety.reason) {
      console.warn("OAuth safety check:", oauthSafety.reason);
    }
    if (oauthSafety.warning) {
      console.warn("OAuth warning:", oauthSafety.warning);
    }
  }, [oauthSafety.safe, oauthSafety.reason, oauthSafety.warning]);

  useEffect(() => {
    if (isLocalBackend()) return;
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const error = query.get("error") || hash.get("error");
    if (!error) return;

    localStorage.removeItem("oauth_intent");
    setInlineMessage(query.get("error_description") || hash.get("error_description") ||
      "No se pudo completar el acceso con Google. Intenta nuevamente.");
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (showWhatsappContacts || whatsappGateActive || pendingSignup || registrationSubmitted) return;
    if (isUserLoading || isCheckingAuth) return;

    // Supabase procesa el callback al inicializarse. No intercambiar el código
    // otra vez ni navegar por SIGNED_IN: el acceso interno puede no estar listo.
    setProcessingOAuth(false);
    setLoading(false);
    setLoginRedirecting(false);
    if (!user) return;

    localStorage.removeItem("oauth_intent");
    if (needsGoogleCompletion) return;
    if (!isLocalBackend() && shouldPromptGoogleCompletion(user)) {
      setGoogleCompletionDraft(buildGoogleCompletionDraft(user));
      setNeedsGoogleCompletion(true);
      return;
    }
    if (accountStatus !== "activo") {
      setInlineMessage(accountStatus === "rechazado"
        ? "La solicitud de acceso fue rechazada. Contacta a un administrador."
        : "Tu cuenta está pendiente de aprobación. Contacta a un administrador.");
      return;
    }

    // Usar la misma sesión validada que exige RequireMemberAuth, incluida su
    // identidad, evita el rebote auth → dashboard → auth con perfiles incompletos.
    if (memberSession?.authUserId === user.id) {
      navigate("/interno/dashboard", { replace: true });
      return;
    }
    setInlineMessage("Tu sesión está iniciada, pero tu perfil no tiene acceso al área de miembros. Revisa tu perfil o contacta a un administrador.");
  }, [user, isUserLoading, accountStatus, memberSession, isCheckingAuth,
    needsGoogleCompletion, showWhatsappContacts, whatsappGateActive, pendingSignup, registrationSubmitted, navigate]);

  const handleGoogleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = sanitizeText(googleCompletionDraft.nombre);
    const apellido = sanitizeText(googleCompletionDraft.apellido);
    const emailValue = googleCompletionDraft.email.trim().toLowerCase();

    if (!nombre || !apellido) {
      setInlineMessage("Nombre y apellido son obligatorios.");
      return;
    }
    if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
      setInlineMessage("El correo no es válido.");
      return;
    }

    setCompletionSaving(true);
    setInlineMessage("");
    try {
      // Skip updateUser and go directly to registration request flow
      // This avoids "auth session missing" errors from unstable OAuth sessions
      const fullName = `${nombre} ${apellido}`.trim();
      
      setPendingSignup({
        nombre,
        apellido,
        email: emailValue,
        password: '', // No password for Google users
        grupo: googleCompletionDraft.grupo,
        otroGrupo: googleCompletionDraft.otroGrupo.trim(),
        rama: googleCompletionDraft.rama.trim(),
        nombreScoutRelacionado: googleCompletionDraft.nombre_scout_relacionado.trim(),
      });
      
      setRecentSignupName(fullName);
      setShowWhatsappContacts(true);
      setNeedsGoogleCompletion(false);
      setProcessingOAuth(false);
      localStorage.removeItem("oauth_intent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo completar el perfil";
      setInlineMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCompletionSaving(false);
    }
  };

  // Evita enumerar cuentas mediante una RPC pública. Google y el backend
  // resuelven el estado real después de autenticar al usuario.
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    setGoogleLoginAllowed(/^\S+@\S+\.\S+$/.test(trimmed));
    setCheckingEmail(false);
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInlineMessage("");
    setWhatsappGateActive(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password;

      if (!signupNombre.trim() || !signupApellido.trim()) {
        throw new Error("Nombre y apellido son obligatorios.");
      }
      if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        throw new Error("El correo no es válido.");
      }
      if (trimmedPassword.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres.");
      }

      const fullName = `${signupNombre.trim()} ${signupApellido.trim()}`.trim();
      
      // Store registration data and show WhatsApp screen - don't create user yet
      setPendingSignup({
        nombre: signupNombre.trim(),
        apellido: signupApellido.trim(),
        email: trimmedEmail,
        password: trimmedPassword,
        grupo: signupGrupo,
        otroGrupo: signupOtroGrupo.trim(),
        rama: signupRama.trim(),
        nombreScoutRelacionado: signupNombreScoutRelacionado.trim(),
      });
      setRecentSignupName(fullName);
      setShowWhatsappContacts(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      setInlineMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setWhatsappGateActive(false);
    } finally {
      setLoading(false);
    }
  };

  // Called when user clicks "Ya fui contactado" on WhatsApp screen
  const handleContactedAndSignup = async () => {
    if (!pendingSignup) return;
    setLoading(true);
    try {
      const existingSession = isLocalBackend() ? null : (await supabase.auth.getSession()).data.session;
      const isLocalGoogleSignup = isLocalBackend() && Boolean(localOAuthTicket) && !pendingSignup.password;
      const profileData = {
        nombre: sanitizeText(pendingSignup.nombre),
        apellido: sanitizeText(pendingSignup.apellido),
        grupo_scout: pendingSignup.grupo === "otro" ? sanitizeText(pendingSignup.otroGrupo) : "septimo",
        rama: pendingSignup.rama || null,
        nombre_scout_relacionado: pendingSignup.nombreScoutRelacionado || null,
      };

      if (existingSession?.user) {
        await apiFetch("/v1/registration-requests/oauth", {
          method: "POST",
          body: JSON.stringify(profileData),
        });
      } else if (isLocalBackend() && localOAuthTicket && !pendingSignup.password) {
        await apiFetch("/v1/registration-requests/oauth/local", {
          method: "POST",
          auth: "none",
          body: JSON.stringify({ ...profileData, ticket: localOAuthTicket }),
        });
        sessionStorage.removeItem("grupo7_google_oauth_ticket");
        setLocalOAuthTicket(null);
      } else {
        const result = await apiFetch<{ verificationUrl?: string }>("/v1/registration-requests", {
          method: "POST",
          auth: "none",
          body: JSON.stringify({
            ...profileData,
            email: pendingSignup.email.toLowerCase().trim(),
            password: pendingSignup.password,
          }),
        });
        setSignupVerificationUrl(result.verificationUrl ?? null);
      }

      toast({
        title: "¡Solicitud enviada!",
        description: isLocalGoogleSignup
          ? "Google verificó tu correo. Un admin revisará la solicitud."
          : "Confirma tu correo. Un admin revisará la solicitud sin acceder a tu contraseña.",
      });

      setRegistrationSubmitted(true);
      setShowWhatsappContacts(false);
      setPendingSignup(null);
      setAuthTab("login");
      setWhatsappGateActive(false);

      setEmail("");
      setPassword("");
      setSignupNombre("");
      setSignupApellido("");
      setSignupGrupo("septimo");
      setSignupOtroGrupo("");
      setSignupRama("");
      setSignupNombreScoutRelacionado("");
      
      setInlineMessage("Solicitud enviada. Tu cuenta está pendiente de aprobación.");
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      toast({
        title: "Error al registrarse",
        description: message,
        variant: "destructive",
      });
      setPendingSignup(null);
      setShowWhatsappContacts(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationSubmitted(false);
    setLoading(true);
    setInlineMessage("");
    setLoginRedirecting(false);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password;

      if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        throw new Error("El correo no es válido.");
      }
      if (!trimmedPassword) {
        throw new Error("La contraseña es obligatoria.");
      }

      // Evita que un intent OAuth viejo bloquee la navegaci�n post-login normal.
      localStorage.removeItem("oauth_intent");

      let localLogin = false;
      let data: { user?: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null } | null = null;
      let error: Error | null = null;

      if (isLocalBackend()) {
        try {
          const response = await apiFetch<{
            access_token: string;
            user: { email_confirmed_at?: string | null; confirmed_at?: string | null };
          }>("/v1/auth/login", {
            method: "POST",
            auth: "none",
            body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
          });
          saveLocalAccessToken(response.access_token);
          data = response;
          localLogin = true;
        } catch (requestError) {
          error = requestError instanceof Error ? requestError : new Error("No se pudo iniciar sesión.");
        }
      } else {
        const result = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        data = result.data;
        error = result.error;
      }

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
        // Verificar si el usuario est� verificado
        if (!localLogin && data?.user && !data.user.confirmed_at) {
          toast({
            title: "Correo no verificado",
            description: "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y spam.",
            variant: "destructive",
          });
        } else {
          setLoginRedirecting(true);
          setInlineMessage("Inicio de sesión correcto. Redirigiendo...");
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });
          // La navegación espera a la validación de los proveedores.
          return;
        }
      }
    } catch (error) {
      setLoginRedirecting(false);
      console.error("Error inesperado en login:", error);
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      setInlineMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (intent: "login" | "signup") => {
    if (isLocalBackend()) {
      sessionStorage.removeItem("grupo7_google_oauth_ticket");
      setLoading(true);
      window.location.assign(getBackendUrl(`/v1/auth/google?intent=${intent}`));
      return;
    }
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
      const redirectUrl = buildAuthRedirect("/interno/auth/callback");

      localStorage.setItem("oauth_intent", intent);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
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
      }
    } catch (error) {
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
    <PageGridBackground className="overflow-hidden">
      <div className="relative min-h-[100svh] flex items-center justify-center px-4 py-3 max-[390px]:px-3 text-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-orange-400 dark:from-red-950 dark:via-red-900 dark:to-orange-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/20 dark:bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/15 dark:bg-white/5 blur-3xl" />
      {showWhatsappContacts ? (
        <RegistroContactoWhatsApp
          nombreCompleto={recentSignupName}
          onBack={() => {
            setShowWhatsappContacts(false);
            setPendingSignup(null);
            setAuthTab("login");
          }}
          onContacted={handleContactedAndSignup}
        />
      ) : needsGoogleCompletion ? (
        <Card className="w-full max-w-lg border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400/80" />
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
            <CardTitle className="text-xl sm:text-2xl font-bold">Completa tu perfil</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Ya entraste con Google. Falta confirmar unos datos para activar tu acceso.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-6 max-[390px]:px-4">
            <form onSubmit={handleGoogleProfileCompletion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="google-profile-nombre">Nombre</Label>
                  <Input
                    id="google-profile-nombre"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Pepe"
                    value={googleCompletionDraft.nombre}
                    onChange={(e) => {
                      setGoogleCompletionDraft((current) => ({ ...current, nombre: e.target.value }));
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-profile-apellido">Apellido</Label>
                  <Input
                    id="google-profile-apellido"
                    type="text"
                    autoComplete="family-name"
                    placeholder="González"
                    value={googleCompletionDraft.apellido}
                    onChange={(e) => {
                      setGoogleCompletionDraft((current) => ({ ...current, apellido: e.target.value }));
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-profile-email">Correo electrónico</Label>
                <Input
                  id="google-profile-email"
                  type="email"
                  value={googleCompletionDraft.email}
                  readOnly
                  className="min-h-11 bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">Usamos el correo de tu cuenta de Google.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-profile-grupo">Grupo Scout</Label>
                <Select
                  value={googleCompletionDraft.grupo}
                  onValueChange={(value) => {
                    setGoogleCompletionDraft((current) => ({ ...current, grupo: value }));
                    if (inlineMessage) setInlineMessage("");
                  }}
                >
                  <SelectTrigger id="google-profile-grupo" className="min-h-11">
                    <SelectValue placeholder="Selecciona tu grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="septimo">Grupo Scout Séptimo</SelectItem>
                    <SelectItem value="otro">Otro grupo scout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {googleCompletionDraft.grupo === "otro" && (
                <div className="space-y-2">
                  <Label htmlFor="google-profile-otro-grupo">¿Cuál grupo?</Label>
                  <Input
                    id="google-profile-otro-grupo"
                    type="text"
                    placeholder="Ej: Grupo Scout Tercero"
                    value={googleCompletionDraft.otroGrupo}
                    onChange={(e) => {
                      setGoogleCompletionDraft((current) => ({ ...current, otroGrupo: e.target.value }));
                      if (inlineMessage) setInlineMessage("");
                    }}
                    required
                    className="min-h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="google-profile-rama">Rama o unidad</Label>
                <Input
                  id="google-profile-rama"
                  type="text"
                  placeholder="Lobatos, Tropa, Pioneros o Rover"
                  value={googleCompletionDraft.rama}
                  onChange={(e) => {
                    setGoogleCompletionDraft((current) => ({ ...current, rama: e.target.value }));
                    if (inlineMessage) setInlineMessage("");
                  }}
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-profile-scout-relacionado">Nombre del scout relacionado</Label>
                <Input
                  id="google-profile-scout-relacionado"
                  type="text"
                  placeholder="Opcional"
                  value={googleCompletionDraft.nombre_scout_relacionado}
                  onChange={(e) => {
                    setGoogleCompletionDraft((current) => ({
                      ...current,
                      nombre_scout_relacionado: e.target.value,
                    }));
                    if (inlineMessage) setInlineMessage("");
                  }}
                  className="min-h-11"
                />
              </div>

              {inlineMessage && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert" aria-live="assertive">
                  {inlineMessage}
                </p>
              )}

              <Button type="submit" className="w-full min-h-11 shadow-md" disabled={completionSaving}>
                {completionSaving ? "Guardando..." : "Continuar"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full min-h-11"
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.removeItem("oauth_intent");
                  setNeedsGoogleCompletion(false);
                }}
              >
                Salir de Google
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : processingOAuth ? (
        <Card className="w-full max-w-md border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <PageLoader compact message="Procesando inicio de sesión con Google..." className="min-h-0 py-8" />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-lg border border-white/30 dark:border-white/10 bg-background/85 dark:bg-background/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
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
          <CardHeader className="text-center text-foreground relative z-10 px-4 pb-3 pt-4 sm:px-5">
            <div className="flex justify-center mb-2">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
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
            <CardDescription className="text-xs sm:text-sm">Únete a nuestra comunidad scout</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4 sm:px-5 sm:pb-5">
            <Tabs
              value={authTab}
              onValueChange={(value) => {
                setAuthTab(value as "login" | "signup");
                setInlineMessage("");
                setLoginRedirecting(false);
              }}
              className="w-full"
            >
              <TabsList className="grid h-11 w-full grid-cols-2 overflow-hidden rounded-xl bg-background/80 p-1 backdrop-blur-md border border-white/40 dark:bg-background/70 dark:border-white/10">
                <TabsTrigger value="login" className="h-9 rounded-md text-sm transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="h-9 rounded-md text-sm transition-all data-[state=active]:bg-background/95 data-[state=active]:shadow-sm">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {inlineMessage && (
                <p
                  className={
                    loginRedirecting
                      ? "mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                      : "mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  }
                  role={loginRedirecting ? "status" : "alert"}
                  aria-live={loginRedirecting ? "polite" : "assertive"}
                >
                  {loginRedirecting ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent"
                        aria-hidden="true"
                      />
                      {inlineMessage}
                    </span>
                  ) : (
                    inlineMessage
                  )}
                </p>
              )}

              <TabsContent value="login" className="data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300 mt-3">
                {signupVerificationUrl && <p className="text-sm"><a className="text-primary underline" href={signupVerificationUrl}>Verificar correo (desarrollo)</a></p>}
                {isLocalBackend() && <div className="flex flex-wrap gap-2">
                  <Button asChild variant="link" size="sm"><Link to="/interno/restablecer-password">Olvidé mi contraseña</Link></Button>
                  <Button asChild variant="link" size="sm"><Link to="/interno/restablecer-password?action=verification">Reenviar verificación</Link></Button>
                </div>}
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
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
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
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
                        className="h-10"
                      />
                      <button
                        type="button"
                        aria-pressed={showPasswordLogin}
                        aria-label={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}
                        onClick={() => setShowPasswordLogin((s) => !s)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center text-muted-foreground p-1"
                      >
                        {showPasswordLogin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span className="sr-only">{showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}</span>
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 shadow-md" disabled={loading || !email.trim() || !password.trim()}>
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>

                  <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background/90 px-2 text-muted-foreground">O continúa con</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 bg-background/90 hover:bg-background"
                        onClick={() => handleGoogleSignIn("login")}
                        disabled={loading || !oauthAvailable}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Iniciar sesión con Google
                      </Button>
                      {checkingEmail && <p className="text-xs text-muted-foreground mt-2">Verificando correo...</p>}
                      {googleLoginAllowed && !checkingEmail && email.trim() !== "" && (
                        <p className="text-xs text-foreground/80 mt-2">Correo encontrado. Puedes entrar con Google de forma rápida.</p>
                      )}
                      {!googleLoginAllowed && email.trim() !== "" && !checkingEmail && (
                        <p className="text-xs text-muted-foreground mt-2">El correo escrito no es válido; Google usará el correo de la cuenta que elijas.</p>
                      )}
                      {!oauthAvailable && <p className="text-xs text-destructive mt-2">{oauthSafety.reason}</p>}
                      {!isLocalBackend() && oauthSafety.warning && <p className="text-xs text-muted-foreground mt-2">{oauthSafety.warning}</p>}
                  </>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 bg-background/90 hover:bg-background mb-3"
                  onClick={() => handleGoogleSignIn("signup")}
                  disabled={loading || !oauthAvailable}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Registrarse con Google
                </Button>

                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-nombre">Nombre</Label>
                      <Input
                        id="signup-nombre"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Pepe"
                        value={signupNombre}
                        onChange={(e) => {
                          setSignupNombre(e.target.value);
                          if (inlineMessage) setInlineMessage("");
                        }}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-apellido">Apellido</Label>
                      <Input
                        id="signup-apellido"
                        type="text"
                        autoComplete="family-name"
                        placeholder="González"
                        value={signupApellido}
                        onChange={(e) => {
                          setSignupApellido(e.target.value);
                          if (inlineMessage) setInlineMessage("");
                        }}
                        required
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-grupo">Grupo Scout</Label>
                    <Select
                      value={signupGrupo}
                      onValueChange={(value) => {
                        setSignupGrupo(value);
                        if (inlineMessage) setInlineMessage("");
                      }}
                    >
                      <SelectTrigger id="signup-grupo" className="h-10">
                        <SelectValue placeholder="Selecciona tu grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="septimo">Grupo Scout Séptimo</SelectItem>
                        <SelectItem value="otro">Otro grupo scout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {signupGrupo === "otro" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-otro-grupo">¿Cuál grupo?</Label>
                      <Input
                        id="signup-otro-grupo"
                        type="text"
                        placeholder="Ej: Grupo Scout Tercero"
                        value={signupOtroGrupo}
                        onChange={(e) => {
                          setSignupOtroGrupo(e.target.value);
                          if (inlineMessage) setInlineMessage("");
                        }}
                        required
                        className="h-10"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1.5">
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
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
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
                          minLength={8}
                          className="h-10"
                        />
                        <button
                          type="button"
                          aria-pressed={showPasswordSignup}
                          aria-label={showPasswordSignup ? "Ocultar contraseña" : "Ver contraseña"}
                          onClick={() => setShowPasswordSignup((s) => !s)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center text-muted-foreground p-1"
                        >
                          {showPasswordSignup ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span className="sr-only">{showPasswordSignup ? "Ocultar contraseña" : "Ver contraseña"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowOptionalSignup((current) => !current)}
                    className="w-full rounded-md border border-border/70 bg-background/50 px-3 py-2 text-left text-sm text-muted-foreground inline-flex items-center justify-between"
                  >
                    Datos opcionales
                    {showOptionalSignup ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showOptionalSignup && (
                    <div className="space-y-3 rounded-md border border-border/70 bg-muted/30 p-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-rama">Rama o unidad</Label>
                        <Input
                          id="signup-rama"
                          type="text"
                          placeholder="Lobatos, Tropa, Pioneros o Rover"
                          value={signupRama}
                          onChange={(e) => {
                            setSignupRama(e.target.value);
                            if (inlineMessage) setInlineMessage("");
                          }}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-scout-relacionado">Nombre del scout relacionado</Label>
                        <Input
                          id="signup-scout-relacionado"
                          type="text"
                          placeholder="Opcional"
                          value={signupNombreScoutRelacionado}
                          onChange={(e) => {
                            setSignupNombreScoutRelacionado(e.target.value);
                            if (inlineMessage) setInlineMessage("");
                          }}
                          className="h-10"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-10 shadow-md"
                    disabled={
                      loading ||
                      !signupNombre.trim() ||
                      !signupApellido.trim() ||
                      !email.trim() ||
                      !password.trim() ||
                      (signupGrupo === "otro" && !signupOtroGrupo.trim())
                    }
                  >
                    {loading ? "Registrando..." : "Registrarse"}
                  </Button>

                  {!oauthAvailable && <p className="text-xs text-destructive mt-2">{oauthSafety.reason}</p>}
                  {!isLocalBackend() && oauthSafety.warning && <p className="text-xs text-muted-foreground mt-2">{oauthSafety.warning}</p>}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      </div>
    </PageGridBackground>
  );
};

export default Auth;
