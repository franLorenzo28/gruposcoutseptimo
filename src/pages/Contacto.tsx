import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import { PageGridBackground } from "@/components/PageGridBackground";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { supabase } from "@/integrations/supabase/client";

import { Link, useSearchParams } from "react-router-dom";
import { validateContact, type ContactFields } from "@/lib/contact-validation";

const Contacto = () => {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [unit, setUnit] = useState(params.get("unidad") ?? "");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ContactFields, string>>>({});
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar y sanear datos antes de enviar
    const { valid, errors, fieldErrors: validationErrors, sanitized } = validateContact(formData);
    setFieldErrors(validationErrors);
    setFeedback("");
    if (!valid) {
      document.getElementById(`contact-${Object.keys(validationErrors)[0]}`)?.focus();
      toast({
        title: "Error en el formulario",
        description: errors.length > 1 ? errors.join(" • ") : errors[0],
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      let avatarHtml = "";
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("user_id", session.user.id).single();
          if (profile?.avatar_url) {
             let url = profile.avatar_url;
             if (!url.startsWith("http")) {
               const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(url);
               url = pubData.publicUrl;
             }
             avatarHtml = `<img src="${url}" alt="Foto de perfil" width="80" height="80" style="border-radius: 50%; object-fit: cover; border: 2px solid #2c3e50; display: block;" />`;
          }
        }
      } catch (e) {
        console.error("No se pudo obtener el avatar", e);
      }

      await emailjs.send(
        "service_wiq2pwk",
        "template_ofrt3il",
        {
          name: sanitized.name,
          email: sanitized.email,
          phone: sanitized.phone,
          message: unit ? `Consulta por ${unit}\n\n${sanitized.message}` : sanitized.message,
          reply_to: sanitized.email,
          from_name: sanitized.name,
          avatar_html: avatarHtml,
        },
        "xJn0Mb0ukQ_M5UYIc"
      );

      // Show success message
      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      setFeedback("¡Mensaje enviado! Nos pondremos en contacto contigo pronto.");
      // Reset form
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      console.error("EmailJS error:", err);
      setFeedback("No pudimos enviar tu mensaje. Tus datos siguen aquí; puedes reintentar o escribirnos por correo.");
      toast({
        title: "Error al enviar",
        description: err?.message || "No se pudo enviar el mensaje. Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const units = ["Manada", "Tropa", "Pioneros", "Rovers", "Educadores", "Comité"];
  return (
    <PageGridBackground>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Contacto · Montevideo</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Tu próxima aventura empieza acá.</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">¿Quieres sumarte al Séptimo? Cuéntanos tu edad y qué te gustaría saber. No necesitas una cuenta para contactarnos.</p>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <section aria-labelledby="contact-info" className="flex flex-col gap-5">
            <h2 id="contact-info" className="text-2xl font-bold">Nos encontramos los sábados</h2>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-3"><Clock className="size-5 shrink-0 text-primary" aria-hidden="true" /><span><strong>15:00 a 18:00</strong><span className="block text-sm text-muted-foreground">Consulta antes de venir por primera vez.</span></span></p>
              <p className="flex items-start gap-3"><MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" /><span>Volteadores 1753, Montevideo<span className="block text-sm text-muted-foreground">Entre Av. Italia y Almirón</span></span></p>
              <div className="flex flex-wrap gap-2">
                <Button asChild><a href="tel:+59898138668"><Phone aria-hidden="true" />Llamar al grupo</a></Button>
                <Button asChild variant="outline"><a href="https://www.google.com/maps/search/?api=1&query=Volteadores+1753+Montevideo" target="_blank" rel="noopener noreferrer">Cómo llegar<span className="sr-only"> (abre otra pestaña)</span></a></Button>
              </div>
              <a className="flex min-h-11 items-center gap-2 break-all text-sm underline underline-offset-4" href="mailto:scoutsseptimo7@gmail.com"><Mail className="size-4 shrink-0" aria-hidden="true" />scoutsseptimo7@gmail.com</a>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Cómo sumarte</h2>
              <ol className="ml-5 flex list-decimal flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                <li>Escríbenos o llama para conocer el grupo y consultar por la unidad correspondiente a tu edad.</li>
                <li>Coordina con el equipo una primera visita y pregunta qué necesitas llevar.</li>
                <li>El equipo te orientará sobre los siguientes pasos para participar.</li>
              </ol>
              <Link to="/#unidades" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Conocer las unidades y edades</Link>
            </div>
          </section>
          <Card id="formulario" className="scroll-mt-28">
            <CardHeader><CardTitle className="text-2xl">Envíanos un mensaje</CardTitle><p className="text-sm text-muted-foreground">Los campos marcados con * son obligatorios.</p></CardHeader>
            <CardContent>
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
                {([{ key: "name", label: "Nombre", type: "text", autoComplete: "name", placeholder: "Tu nombre" }, { key: "email", label: "Correo electrónico", type: "email", autoComplete: "email", placeholder: "nombre@correo.com" }, { key: "phone", label: "Teléfono (opcional)", type: "tel", autoComplete: "tel", placeholder: "+598 99 123 456" }] as const).map(field => <div key={field.key} className="flex flex-col gap-2">
                  <label htmlFor={`contact-${field.key}`} className="text-sm font-semibold">{field.label}{field.key !== "phone" && " *"}</label>
                  <Input id={`contact-${field.key}`} type={field.type} autoComplete={field.autoComplete} placeholder={field.placeholder} value={formData[field.key]} required={field.key !== "phone"} disabled={sending} aria-invalid={Boolean(fieldErrors[field.key])} aria-describedby={fieldErrors[field.key] ? `error-${field.key}` : undefined} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  {fieldErrors[field.key] && <p id={`error-${field.key}`} className="text-sm text-destructive">{fieldErrors[field.key]}</p>}
                </div>)}
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-unit" className="text-sm font-semibold">Unidad que te interesa (opcional)</label>
                  <select id="contact-unit" value={units.includes(unit) ? unit : ""} onChange={e => setUnit(e.target.value)} disabled={sending} className="min-h-11 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Todavía no lo sé / consulta general</option>{units.map(name => <option key={name}>{name}</option>)}</select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-sm font-semibold">Mensaje *</label>
                  <Textarea id="contact-message" rows={5} className="text-base" placeholder="Cuéntanos cómo podemos ayudarte…" required disabled={sending} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? "error-message" : undefined} />
                  {fieldErrors.message && <p id="error-message" className="text-sm text-destructive">{fieldErrors.message}</p>}
                </div>
                <Button type="submit" disabled={sending} className="w-full">{sending ? <><Loader2 className="animate-spin" aria-hidden="true" />Enviando…</> : "Enviar mensaje"}</Button>
                {feedback && <p role="status" className="text-sm leading-relaxed">{feedback}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageGridBackground>
  );
};
export default Contacto;
