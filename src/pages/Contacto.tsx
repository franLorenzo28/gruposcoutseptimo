// --- Validación y sanitización ---
function validateContact({ name, email, phone, message }: { name: string; email: string; phone?: string; message: string }) {
  const errors: string[] = [];
  // Nombre obligatorio, mínimo 3 caracteres, sin caracteres peligrosos
  if (!name.trim()) errors.push("El nombre es obligatorio.");
  if (name && name.length < 3) errors.push("El nombre debe tener al menos 3 caracteres.");
  if (name && /[<>"']/.test(name)) errors.push("El nombre contiene caracteres inválidos.");
  // Email obligatorio y formato válido
  if (!email.trim()) errors.push("El email es obligatorio.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push("El email no es válido.");
  // Teléfono: opcional pero si existe debe ser numérico
  if (phone && !/^\+?\d{7,15}$/.test(phone)) errors.push("El teléfono debe ser válido (solo números, puede incluir +).");
  // Mensaje obligatorio y mínimo 10 caracteres
  if (!message.trim()) errors.push("El mensaje es obligatorio.");
  if (message && message.length < 10) errors.push("El mensaje debe tener al menos 10 caracteres.");
  // Sanitización básica
  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      name: name.trim().replace(/[<>"']/g, ""),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.replace(/[^\d+]/g, "") : "",
      message: message.trim().replace(/[<>"']/g, ""),
    },
  };
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useToast } from "@/hooks/use-toast";
// Usa MapComponentEmbed si tienes problemas con billing de Google Cloud
// import MapComponent from "../components/MapComponentEmbed";
import MapComponent from "../components/MapComponentEmbed";

const Contacto = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar y sanear datos antes de enviar
    const { valid, errors, sanitized } = validateContact(formData);
    if (!valid) {
      toast({
        title: "Error en el formulario",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }
    // Show success message
    toast({
      title: "¡Mensaje enviado!",
      description: "Nos pondremos en contacto contigo pronto.",
    });
    // Reset form
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Dirección",
      content:
        "Volteadores 1753 entre Av. Italia y Almirón, Montevideo, Uruguay",
    },
    {
      icon: Phone,
      title: "Teléfono",
      content: "+598 098 138 668 (Pablo Silva, Jefe de Grupo)",
    },
    {
      icon: Mail,
      title: "Email",
      content: "scoutsseptimo7@gmail.com",
    },
    {
      icon: Clock,
      title: "Horarios",
      content: "Sábados 15:00h - 18:00h ",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-12 drift-slow" />
          <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/40 top-[54%] left-[7%] [filter:blur(26px)_saturate(1.2)] float-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_45%)]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                Contacto
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              ¿Quieres unirte al Séptimo?
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Estamos aquí para responder tus preguntas y ayudarte a formar
              parte de nuestra comunidad scout.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            {/* Contact Form */}
            <Reveal>
              <Card id="formulario" className="border-border/70 bg-card/85 shadow-lg backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                  Envíanos un mensaje
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                  Completa el formulario y nos pondremos en contacto contigo a
                  la brevedad.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">
                      Nombre completo *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Juan Pérez"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="juan@ejemplo.com"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">
                      Teléfono
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+598 99 123 456"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">
                      Mensaje *
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      rows={6}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    variant="hero"
                    className="w-full text-base sm:text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
                  >
                    <Mail className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                    Enviar Mensaje
                  </Button>
                </form>
                </CardContent>
              </Card>
            </Reveal>

            {/* Contact Info */}
            <Reveal>
              <div id="info" className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                    Información de contacto
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    Encuentra toda la información para comunicarte con nosotros.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {contactInfo.map((info, index) => (
                    <Card
                      key={index}
                      className="card-hover border-2 hover:border-primary/50 transition-all duration-500 group"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                            <info.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
                              {info.title}
                            </h3>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                              {info.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Map */}
                <Card id="mapa" className="overflow-hidden shadow-xl border-2">
                  <CardContent className="p-0">
                    <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden">
                      <MapComponent />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer global en App.tsx */}
    </div>
  );
};

export default Contacto;






