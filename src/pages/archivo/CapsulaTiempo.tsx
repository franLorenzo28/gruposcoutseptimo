import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Reveal } from "@/components/Reveal";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";

type HitoCorreo = {
  fecha: string;
  autor: string;
  detalle: string;
};

const hitosCorreo: HitoCorreo[] = [
  {
    fecha: "17-MAY-2014",
    autor: "Javier Lorenzo Gómes",
    detalle:
      "Se presenta la idea impulsada por Carlo: crear una cápsula de recuerdos, anécdotas y vivencias para abrirla a los 100 años del Grupo.",
  },
  {
    fecha: "21-MAY-2014",
    autor: "Ricardo Hein",
    detalle:
      "Se ordena el proyecto en cinco ejes: quiénes, cuándo, dónde, qué y cómo, para concretarlo dentro del marco de los 50 años.",
  },
  {
    fecha: "23-MAY-2014",
    autor: "Ricardo Hein",
    detalle:
      "El Colegio Alemán aprueba la iniciativa y habilita avanzar con la organización del acto y la instalación.",
  },
  {
    fecha: "29-MAY-2014",
    autor: "Marcel Barceló",
    detalle:
      "Se confirma ubicación en el patio principal del Colegio Alemán, en zona visible y accesible, con coordinación del arquitecto.",
  },
  {
    fecha: "24-JUN-2014",
    autor: "TriClan / Grupo Scout Séptimo",
    detalle:
      "Fecha definida para el acto por los 50 años y entierro de la cápsula con placa identificadora para abrirse en 2064.",
  },
];

const imagenesGaleria = [
  { src: "/archivo/capsula-tiempo/capsula.jpg", alt: "Cápsula del tiempo" },
  { src: "/archivo/capsula-tiempo/capsula_2.jpg", alt: "Cápsula del tiempo 2" },
  { src: "/archivo/capsula-tiempo/capsula_4.jpg", alt: "Cápsula del tiempo 4" },
  { src: "/archivo/capsula-tiempo/capsula_articulo.png", alt: "Artículo de la cápsula" },
  { src: "/archivo/capsula-tiempo/capsula_carlo_lorenzo.jpg", alt: "Registro Carlo Lorenzo" },
  { src: "/archivo/capsula-tiempo/capsula_ds.jpg", alt: "Cápsula DS" },
  { src: "/archivo/capsula-tiempo/capsula_ds_3.jpg", alt: "Cápsula DS 3" },
  { src: "/archivo/capsula-tiempo/capsula_placa.jpg", alt: "Placa de la cápsula" },
];

const CapsulaTiempo = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxOpen = lightboxIndex !== null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = () => {
    if (lightboxIndex === null || imagenesGaleria.length === 0) return;
    setLightboxIndex(
      (lightboxIndex - 1 + imagenesGaleria.length) % imagenesGaleria.length,
    );
  };

  const nextImage = () => {
    if (lightboxIndex === null || imagenesGaleria.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % imagenesGaleria.length);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (event.key === "ArrowLeft") prevImage();
      if (event.key === "ArrowRight") nextImage();
      if (event.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, lightboxIndex]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-primary/10 -top-20 -right-16 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/20 -bottom-16 -left-12 drift-slow" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full mb-4">
              <Clock3 className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                Archivo · Cápsula del Tiempo
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Cápsula del Tiempo
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              Proyecto del 50 aniversario del Grupo Scout Séptimo: una cápsula
              enterrada en el Colegio Alemán para abrirse en 2064, al cumplir
              100 años.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid gap-4 md:grid-cols-2">
            <Reveal>
              <Card className="border border-border/70 bg-card/85 shadow-md h-full">
                <CardContent className="p-5 sm:p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                    <CheckCircle2 className="h-4 w-4" />
                    Qué fue
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Una iniciativa del TriClan por los 50 años
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A partir de la propuesta de Carlo Lorenzo, se definió crear
                    una cápsula con recuerdos, objetos, mensajes y testimonios
                    de antiguos scouts del 7mo (generación 1964-1984) como
                    legado para las generaciones futuras.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border border-border/70 bg-card/85 shadow-md h-full">
                <CardContent className="p-5 sm:p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                    <MapPin className="h-4 w-4" />
                    Dónde y cuándo
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Colegio Alemán, acto del 24/06/2014
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Se acordó su instalación en el patio principal del Colegio
                    Alemán (calle Soca), con una placa identificadora. La
                    apertura prevista es al cumplirse los 100 años del Grupo,
                    en 2064.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Definición del proyecto (síntesis)
              </h2>
            </Reveal>
            <Reveal>
              <Card className="border border-border/70 bg-card/85 shadow-md">
                <CardContent className="p-5 sm:p-6">
                  <ol className="space-y-3 text-sm sm:text-base text-muted-foreground">
                    <li>
                      <strong className="text-foreground">1) Quiénes:</strong>{" "}
                      iniciativa y ejecución de los integrantes del TriClan,
                      antiguos scouts vinculados al 7mo entre 1964 y 1984.
                    </li>
                    <li>
                      <strong className="text-foreground">2) Cuándo:</strong>{" "}
                      acto del 24/06/2014, en el marco de los 50 años del Grupo.
                    </li>
                    <li>
                      <strong className="text-foreground">3) Dónde:</strong>{" "}
                      Colegio Alemán de la calle Soca.
                    </li>
                    <li>
                      <strong className="text-foreground">4) Qué:</strong>{" "}
                      un legado para 2064 con memoria scout y mensaje de
                      continuidad del Movimiento.
                    </li>
                    <li>
                      <strong className="text-foreground">5) Cómo:</strong>{" "}
                      mediante objetos tangibles: cartas, fotos impresas,
                      memorabilia, prendas y recuerdos debidamente referenciados.
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-4">
            <Reveal>
              <h2 className="text-2xl sm:text-3xl font-bold">Cronología de correos</h2>
            </Reveal>
            {hitosCorreo.map((hito, index) => (
              <Reveal key={`${hito.fecha}-${hito.autor}`} delay={index * 0.05}>
                <Card className="border border-border/70 bg-card/85 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                      <Badge variant="outline" className="w-fit bg-primary/5 border-primary/30 text-primary">
                        {hito.fecha}
                      </Badge>
                      <p className="text-sm font-semibold">{hito.autor}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{hito.detalle}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-6xl mx-auto">
            <video className="block w-full h-auto max-h-[58vh]" controls preload="metadata">
              <source src="/archivo/capsula-tiempo/video_capsula_tiempo.mp4" type="video/mp4" />
              Tu navegador no puede reproducir este video.
            </video>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="flex items-center gap-2 mb-5">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold">Material fotográfico del proyecto</h2>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {imagenesGaleria.map((imagen, index) => (
                <Reveal key={imagen.src} delay={index * 0.04}>
                  <Card className="overflow-hidden border border-border/70 bg-card/90 shadow-sm">
                    <button
                      type="button"
                      onClick={() => openLightbox(index)}
                      className="block w-full text-left"
                    >
                      <img
                        src={imagen.src}
                        alt={imagen.alt}
                        className="h-64 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={lightboxOpen} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-background/95 border-border/70">
          {lightboxIndex !== null && (
            <div className="relative">
              <img
                src={imagenesGaleria[lightboxIndex].src}
                alt={imagenesGaleria[lightboxIndex].alt}
                className="w-full h-[72vh] object-contain bg-black"
              />

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs text-foreground">
                {lightboxIndex + 1} / {imagenesGaleria.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CapsulaTiempo;
