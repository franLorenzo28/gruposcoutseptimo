import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, isLocalBackend, resetLocalBackendAuth } from "@/lib/backend";

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const verification = !token && params.get("action") === "verification";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [developmentLink, setDevelopmentLink] = useState<string | null>(null);

  if (!isLocalBackend()) return <Navigate to="/interno/auth" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevelopmentLink(null);
    if (token && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const path = token ? "password-reset" : verification ? "request-verification" : "request-password-reset";
      const result = await apiFetch<{ reset_token?: string; verificationUrl?: string }>(`/v1/auth/${path}`, {
        method: "POST", auth: "none",
        body: JSON.stringify(token ? { token, password } : { email }),
      });
      if (token) {
        resetLocalBackendAuth();
        setPassword("");
        setConfirmation("");
        window.history.replaceState({}, "", window.location.pathname);
        setDone(true);
        setMessage("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
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

  return <main className="mx-auto w-full max-w-md px-4 py-12">
    <Card>
      <CardHeader>
        <CardTitle>{verification ? "Verifica tu correo" : token ? "Nueva contraseña" : "Recupera tu cuenta"}</CardTitle>
        <CardDescription>{token ? "Elige una contraseña de al menos 8 caracteres." : "Ingresa el correo que usaste para registrarte."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!done && <form onSubmit={submit} className="space-y-4">
          {token ? <>
            <div className="space-y-2"><Label htmlFor="new-password">Nueva contraseña</Label>
              <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Repite la contraseña</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </div>
          </> : <div className="space-y-2"><Label htmlFor="recovery-email">Correo electrónico</Label>
            <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>}
          <Button type="submit" disabled={busy}>{busy ? "Procesando…" : token ? "Guardar contraseña" : "Enviar enlace"}</Button>
        </form>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm">{message}</p>}
        {developmentLink && <p className="text-sm"><a href={developmentLink} className="text-primary underline">Abrir enlace (desarrollo)</a></p>}
        <Button asChild variant="link"><Link to="/interno/auth">Volver a iniciar sesión</Link></Button>
      </CardContent>
    </Card>
  </main>;
}
