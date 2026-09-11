import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, isLocalBackend, resetLocalBackendAuth } from "@/lib/backend";

import { supabase } from "@/integrations/supabase/client";

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const local = isLocalBackend();
  const token = local ? params.get("token") : null;
  const resetMode = Boolean(token) || (!local && params.get("mode") === "reset");
  const [sessionReady, setSessionReady] = useState(local);
  const [checkingSession, setCheckingSession] = useState(!local && resetMode);
  const verification = local && !token && params.get("action") === "verification";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [developmentLink, setDevelopmentLink] = useState<string | null>(null);

  useEffect(() => {
    if (local || !resetMode) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) setSessionReady(true);
    });
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSessionReady(Boolean(data.session));
      if (sessionError || !data.session) setError("El enlace no es válido o venció. Solicita uno nuevo.");
    }).catch(() => {
      if (active) setError("No pudimos verificar el enlace. Solicita uno nuevo.");
    }).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [local, resetMode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevelopmentLink(null);
    if (resetMode && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      let result: { reset_token?: string; verificationUrl?: string } = {};
      if (local) {
        const path = token ? "password-reset" : verification ? "request-verification" : "request-password-reset";
        result = await apiFetch(`/v1/auth/${path}`, {
          method: "POST", auth: "none",
          body: JSON.stringify(token ? { token, password } : { email: email.trim() }),
        });
      } else if (resetMode) {
        if (!sessionReady) throw new Error("Solicita un nuevo enlace para recuperar tu cuenta.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
      } else {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/interno/restablecer-password?mode=reset`,
        });
        if (requestError) throw requestError;
      }
      if (resetMode) {
        if (local) resetLocalBackendAuth();
        setPassword("");
        setConfirmation("");
        window.history.replaceState({}, "", window.location.pathname);
        setDone(true);
        setMessage("Contraseña actualizada. Ya puedes continuar con tu cuenta.");
      } else {
        setMessage("Si la cuenta corresponde, recibirás un enlace por correo. Revisa también spam.");
        setDevelopmentLink(result.verificationUrl ?? (result.reset_token
          ? `/interno/restablecer-password?token=${encodeURIComponent(result.reset_token)}` : null));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar la solicitud.");
    } finally {
      setBusy(false);
    }
  };

  return <section className="mx-auto w-full max-w-md px-4 py-12">
    <Card>
      <CardHeader>
        <Link to="/" className="mb-3 text-sm underline underline-offset-4">Volver al sitio público</Link>
        <CardTitle>{verification ? "Verifica tu correo" : resetMode ? "Nueva contraseña" : "Recupera tu cuenta"}</CardTitle>
        <CardDescription>{resetMode ? "Elige una contraseña de al menos 8 caracteres." : "Ingresa el correo que usaste para registrarte."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkingSession && <p role="status">Verificando el enlace…</p>}
        {!done && !checkingSession && (!resetMode || sessionReady) && <form onSubmit={submit} className="space-y-4">
          {resetMode ? <>
            <div className="space-y-2"><Label htmlFor="new-password">Nueva contraseña</Label>
              <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Repite la contraseña</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </div>
          </> : <div className="space-y-2"><Label htmlFor="recovery-email">Correo electrónico</Label>
            <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>}
          <Button type="submit" disabled={busy}>{busy ? "Procesando…" : resetMode ? "Guardar contraseña" : "Enviar enlace"}</Button>
        </form>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!local && resetMode && !checkingSession && !sessionReady && <Button asChild variant="outline"><Link to="/interno/restablecer-password">Solicitar otro enlace</Link></Button>}
        {message && <p role="status" className="text-sm">{message}</p>}
        {developmentLink && <p className="text-sm"><a href={developmentLink} className="text-primary underline">Abrir enlace (desarrollo)</a></p>}
        <Button asChild variant="link"><Link to={done && !local ? "/interno/dashboard" : "/interno/auth"}>{done && !local ? "Continuar a mi cuenta" : "Volver a iniciar sesión"}</Link></Button>
      </CardContent>
    </Card>
  </section>;
}
