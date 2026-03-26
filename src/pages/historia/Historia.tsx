import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, BookOpen } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageProps } from "@/lib/optimized-images";
import { useCountUp } from "@/hooks/useCountUp";
import { Link } from "react-router-dom";

type TimelineItem = {
  year: string;
  title: string;
  description: string;
  place: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const Historia = () => {
  const heroImages = getOptimizedImageProps("hero");
  const fundacion = useCountUp(1964, 800, { start: 1950 });
  const anios = useCountUp(60, 1200, { start: 0 });
  const locales = useCountUp(8, 600, { start: 0 });

  const timeline: TimelineItem[] = [
    {
      year: "1964",
      title: "Fundación del grupo",
      description:
        "Comienza la historia del Grupo Scout Séptimo en el Colegio Alemán, con una comunidad que apostó por educar en valores y aventura.",
      place: "Colegio Alemán",
    },
    {
      year: "1965",
      title: "Primer local propio",
      description:
        "El grupo inaugura su primer local y consolida su presencia en la comunidad.",
      place: "Primer local institucional",
    },
    {
      year: "1990",
      title: "Expansión de ramas",
      description:
        "Se consolida la propuesta de ramas del grupo, desde Manada hasta Rovers, para ofrecer una formación integral.",
      place: "Comunidad y locales del grupo",
    },
    {
      year: "2004",
      title: "Nace el BAUEN",
      description:
        "El grupo impulsa BAUEN, una referencia nacional para el escultismo uruguayo y un hito de liderazgo juvenil que año tras año sigue creciendo.",
      place: "Parque Baroffio",
    },
    {
      year: "2014",
      title: "50 años de legado",
      description:
        "La comunidad celebra medio siglo de historia y proyecta un legado para futuras generaciones scout, incluyendo la iniciativa de la Cápsula del Tiempo para su apertura en 2064.",
      place: "Aniversario del Grupo",
      ctaLabel: "Ver Cápsula del Tiempo",
      ctaHref: "/archivo/capsula-del-tiempo",
    },
    {
      year: "2020",
      title: "Adaptación y continuidad",
      description:
        "En un contexto desafiante, se sostienen actividades y vínculos en formatos nuevos para no perder el espíritu de grupo.",
      place: "Casas y plataformas digitales",
    },
    {
      year: "2025",
      title: "20 años del BAUEN",
      description:
        "La comunidad celebra dos décadas de una competencia emblemática para el escultismo uruguayo.",
      place: "Parque Baroffio",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,hsl(var(--primary)/0.14),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_82%,hsl(45_85%_55%/0.12),transparent_46%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0)_0%,hsl(var(--background)/0.55)_68%,hsl(var(--background)/0.9)_100%)]" />
      </div>

      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
        <div className="absolute inset-0" aria-hidden="true">
          <OptimizedImage
            src={heroImages.src}
            webpSrc={heroImages.webpSrc}
            alt=""
            className="h-full w-full"
            objectFit="cover"
            priority
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-scout-black/72 via-scout-black/52 to-scout-black/24 dark:from-scout-black/90 dark:via-scout-black/70 dark:to-scout-black/35" />
        </div>

        <div className="relative container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/25 px-4 py-2 text-xs font-semibold text-white/95 backdrop-blur-sm sm:text-sm">
              <BookOpen className="h-4 w-4" />
              Memoria viva del Grupo Scout Séptimo
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-white [text-shadow:0_3px_14px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl">
              Nuestra historia,
              <span className="block text-primary">contada como camino</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/92 [text-shadow:0_2px_10px_rgba(0,0,0,0.45)] sm:text-lg md:text-xl">
              Más de seis décadas formando personas con propósito. Cada etapa dejó huellas en nuestros locales, en nuestras tradiciones y en la forma de vivir el servicio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-border bg-background/45 text-foreground hover:bg-background/75 dark:border-white/50 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                onClick={() =>
                  document
                    .getElementById("timeline")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Ver linea temporal completa
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p ref={fundacion.ref} className="text-4xl font-black text-primary">{fundacion.value}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Año de fundación
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p ref={anios.ref} className="text-4xl font-black text-primary">
                    {anios.value >= 60 ? "60+" : anios.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Años de historia activa
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p ref={locales.ref} className="text-4xl font-black text-primary">{locales.value}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Locales y etapas clave
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="timeline" className="relative overflow-hidden py-10 sm:py-14">
        <div className="absolute inset-0" aria-hidden="true">
          <OptimizedImage
            src={heroImages.src}
            webpSrc={heroImages.webpSrc}
            alt=""
            className="h-full w-full opacity-[0.16] dark:opacity-[0.09]"
            objectFit="cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/72 to-background/92 dark:from-scout-black/25 dark:via-background/70 dark:to-background/90" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <Reveal>
              <aside className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-sm lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </div>
                <h2 className="text-3xl font-bold">Momentos de nuestra historia</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Un recorrido vertical por los momentos que moldearon la identidad del Grupo Scout Séptimo.
                </p>
              </aside>
            </Reveal>

            <div className="relative">
              <div className="absolute bottom-0 left-5 top-0 w-px bg-border/70 sm:left-1/2 sm:-translate-x-1/2" />
              <div className="space-y-8 sm:space-y-10">
                {timeline.map((item, index) => (
                  <Reveal key={item.year + item.title}>
                    <article
                      className={`relative grid gap-4 sm:grid-cols-2 sm:gap-8 ${
                        index % 2 !== 0 ? "sm:[&>*:first-child]:order-2" : ""
                      }`}
                    >
                      <div className="pl-12 sm:pl-0">
                        <Card className="group h-full rounded-2xl border border-border/70 bg-card/90 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                          <CardContent className="flex h-full flex-col p-5 sm:p-6">
                            <div className="mb-3 flex items-center gap-3">
                              <Badge className="rounded-full px-3 py-1 text-sm">{item.year}</Badge>
                            </div>
                            <h3 className="text-xl font-bold sm:text-2xl">{item.title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                              {item.description}
                            </p>
                            {item.place ? (
                              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                <MapPin className="h-4 w-4" />
                                {item.place}
                              </p>
                            ) : null}
                            {item.ctaHref ? (
                              <Button asChild size="sm" variant="outline" className="mt-6 self-center rounded-full px-6">
                                <Link to={item.ctaHref} className="text-center">{item.ctaLabel}</Link>
                              </Button>
                            ) : null}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="hidden sm:block" />

                      <div className="absolute left-5 top-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_6px_hsl(var(--background)),0_0_0_8px_hsl(var(--border))] sm:left-1/2" />
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Historia;
