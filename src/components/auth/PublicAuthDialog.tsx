import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getBackendUrl, isLocalBackend, saveLocalAccessToken } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/providers/AppProviders";
import logo from "@/assets/grupo-scout-logo.png";

type Mode = "login" | "register";

export default function PublicAuthDialog() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const selected = params.get("auth");
  const open = selected === "login" || selected === "register";
  const mode: Mode = selected === "register" ? "register" : "login";
  const { refreshUser } = useSupabaseUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  useEffect(() => { setMessage(""); setVerificationUrl(null); }, [selected]);

  const setMode = (next: Mode) => {
    const updated = new URLSearchParams(params);
    updated.set("auth", next);
    setParams(updated);
  };
  const close = () => {
    const updated = new URLSearchParams(params);
    updated.delete("auth");
    updated.delete("next");
    setParams(updated);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "register") {
        const result = await apiFetch<{ verificationUrl?: string }>("/v1/public/register", {
          method: "POST", auth: "none",
          body: JSON.stringify({ nombre_completo: name.trim(), email: email.trim().toLowerCase(), password }),
        });
        setVerificationUrl(result.verificationUrl ?? null);
        setMessage("Revisá tu correo para verificar la cuenta. Después podrás iniciar sesión.");
        setPassword("");
      } else {
        if (isLocalBackend()) {
          const result = await apiFetch<{ access_token: string }>("/v1/auth/login", {
            method: "POST", auth: "none",
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          saveLocalAccessToken(result.access_token);
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
          if (error) throw error;
        }
        await refreshUser();
        setPassword("");
        const next = params.get("next");
        if (next?.startsWith("/") && !next.startsWith("//")) navigate(next, { replace: true });
        else close();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la operación.");
    } finally { setBusy(false); }
  };

  const loginWithGoogle = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (isLocalBackend()) {
        window.location.assign(getBackendUrl("/v1/auth/google?intent=login"));
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/interno/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-h-[min(92dvh,780px)] max-w-md overflow-y-auto border-0 bg-[#fbfaf6] p-0 text-[#192820] shadow-[0_32px_100px_rgba(5,24,14,.4)] [&>button]:z-10 [&>button]:text-white dark:bg-[#16251d] dark:text-[#f6f3e9] sm:rounded-[28px]">
        <div className="relative overflow-hidden bg-[#193b2c] px-8 pb-7 pt-8 text-[#f9f5e9]">
          <span className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[28px] border-[#e5bd63]/20" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 p-2"><img src={logo} alt="" className="h-10 w-10 object-contain" /></span>
            <span className="text-[11px] font-bold uppercase tracking-[.22em] text-[#e5bd63]">Grupo Scout Séptimo</span>
          </div>
          <DialogHeader className="relative mt-6 text-left">
            <DialogTitle className="font-serif text-3xl font-semibold tracking-tight text-[#f9f5e9]">
              {mode === "login" ? "Qué bueno verte de nuevo" : "Sumate a la comunidad"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-relaxed text-[#f9f5e9]/75">
              {mode === "login" ? "Ingresá a tu cuenta para explorar y cuidar tu perfil." : "Creá tu perfil público. El acceso interno lo habilita el administrador."}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-8 pb-8 pt-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-[#e9e8dc] p-1 dark:bg-white/10">
              <TabsTrigger value="login" className="rounded-lg">Ingresar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">Crear cuenta</TabsTrigger>
            </TabsList>
          </Tabs>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "register" && <div className="space-y-1.5">
              <Label htmlFor="public-name">Nombre completo</Label>
              <div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="public-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={160} required className="h-11 pl-10" placeholder="Tu nombre y apellido" /></div>
            </div>}
            <div className="space-y-1.5">
              <Label htmlFor="public-email">Correo electrónico</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="public-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 pl-10" placeholder="tu@correo.com" /></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="public-password">Contraseña</Label>
              <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="public-password" type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 8 : undefined} required className="h-11 pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              {mode === "register" && <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>}
            </div>
            {mode === "login" && <Link to="/interno/restablecer-password" onClick={close} className="block text-right text-xs font-medium text-[#a93527] underline underline-offset-2">Olvidé mi contraseña</Link>}
            {message && <p role="status" className="rounded-xl border border-[#cfb46f]/40 bg-[#e5bd63]/10 p-3 text-sm leading-relaxed">{message}</p>}
            {verificationUrl && <a href={verificationUrl} className="block text-sm font-medium underline">Verificar correo (desarrollo)</a>}
            <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-[#bc402f] font-semibold text-white hover:bg-[#a93527]">
              {busy ? "Un momento..." : mode === "login" ? "Ingresar" : "Crear cuenta"}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          {mode === "login" && <Button type="button" variant="outline" disabled={busy} onClick={() => void loginWithGoogle()} className="h-11 w-full rounded-xl">Continuar con Google</Button>}
          <p className="text-center text-xs leading-relaxed text-muted-foreground">¿Sos miembro del grupo? Pedile al administrador que habilite tu acceso interno.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
