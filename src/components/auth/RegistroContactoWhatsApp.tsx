import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WhatsAppContact = {
  unidad: string;
  phone: string;
};

type RegistroContactoWhatsAppProps = {
  nombreCompleto?: string;
  onBack?: () => void;
};

const CONTACTS: WhatsAppContact[] = [
  { unidad: "Manada", phone: "+59894004149" },
  { unidad: "Tropa", phone: "+59893403713" },
  { unidad: "Pioneros", phone: "+59800000000" },
  { unidad: "Rovers", phone: "+59800000000" },
];

const DEFAULT_NAME = "Nombre Apellido";

const buildMessage = (name: string) =>
  `Hola, soy ${name}. Me registre en la pagina del Grupo Scout Septimo y quiero solicitar acceso a un usuario.`;

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const buildWhatsAppUrl = (phone: string, message: string) => {
  const digits = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
};

export default function RegistroContactoWhatsApp({ nombreCompleto, onBack }: RegistroContactoWhatsAppProps) {
  const safeName = nombreCompleto?.trim() || DEFAULT_NAME;
  const message = buildMessage(safeName);

  return (
    <Card className="w-full max-w-xl border border-white/30 dark:border-white/10 bg-background/90 dark:bg-background/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-emerald-200/10 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-400/80" />
      </div>
      <CardHeader className="text-center text-foreground relative z-10 px-5 pb-3">
        <CardTitle className="text-xl sm:text-2xl font-bold">Contacto obligatorio</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Antes de aprobar tu acceso, tenes que escribir a un responsable por WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 px-5 pb-6 space-y-4">
        <div className="rounded-md border border-border/70 bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Mensaje sugerido</p>
          <p className="mt-2 text-sm">{message}</p>
        </div>

        <div className="grid gap-3">
          {CONTACTS.map((contact) => (
            <div key={contact.unidad} className="flex flex-col gap-2 rounded-md border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{contact.unidad}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
                <Button asChild className="h-9">
                  <a
                    href={buildWhatsAppUrl(contact.phone, message)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Importante: no se aprobaran usuarios que no hayan pasado por este contacto.
        </p>

        {onBack ? (
          <Button type="button" variant="outline" className="w-full h-10" onClick={onBack}>
            Volver al inicio de sesion
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
