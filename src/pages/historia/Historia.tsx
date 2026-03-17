import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, BookOpen } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import communityImage from "@/assets/community-scouts.jpg";
import heroImage from "@/assets/hero-scouts.jpg";

const Historia = () => {
  const timeline = [
    {
      year: "1964",
      title: "Fundacion del grupo",
      description:
        "Comienza la historia del Grupo Scout Septimo en el Colegio Aleman, con una comunidad que aposto por educar en valores y aventura.",
      place: "Colegio Aleman",
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
      title: "Expansion de ramas",
      description:
        "Se consolida la propuesta de ramas del grupo, desde Manada hasta Rovers, para ofrecer una formacion integral.",
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
        "La comunidad celebra medio siglo de historia y proyecta un legado para futuras generaciones scout.",
      place: "Aniversario institucional",
    },
    {
      year: "2020",
      title: "Adaptacion y continuidad",
      description:
        "En un contexto desafiante, se sostienen actividades y vinculos en formatos nuevos para no perder el espiritu de grupo.",
      place: "Casas y plataformas digitales",
    },
    {
      year: "2025",
      title: "20 años del BAUEN",
      description:
        "La comunidad celebra dos decadas de una competencia emblematica para el escultismo uruguayo.",
      place: "Comunidad scout",
    },
    {
      year: "2026",
      title: "Nueva etapa digital",
      description:
        "La web del Grupo Septimo evoluciona para integrar historia, comunidad y participacion con una experiencia moderna.",
      place: "Sitio web oficial",
    },
  ] as const;

  const locales = [
    "Colegio Aleman",
    "Elias Regules",
    "Parroquia San Pedro",
    "Volteadores",
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
        <div className="absolute inset-0" aria-hidden="true">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-scout-black/90 via-scout-black/70 to-scout-black/35" />
        </div>

        <div className="relative container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm sm:text-sm">
              <BookOpen className="h-4 w-4" />
              Memoria viva del Grupo Scout Septimo
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-white sm:text-6xl md:text-7xl">
              Nuestra historia,
              <span className="block text-primary">contada como camino</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/85 sm:text-lg md:text-xl">
              Mas de seis decadas formando personas con proposito. Cada etapa dejo huellas en nuestros locales, en nuestras tradiciones y en la forma de vivir el servicio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/50 bg-transparent text-white hover:bg-white/10"
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

      <section className="section-padding bg-background/65">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-4xl font-black text-primary">1964</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Ano de fundacion
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-4xl font-black text-primary">60+</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Anos de historia activa
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-4xl font-black text-primary">8</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Locales y etapas clave
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="timeline" className="relative overflow-hidden py-16 sm:py-20 bg-muted/35">
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
                  Un recorrido vertical por los momentos que moldearon la identidad del Grupo Scout Septimo.
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
                          <CardContent className="p-5 sm:p-6">
                            <div className="mb-3 flex items-center gap-3">
                              <Badge className="rounded-full px-3 py-1 text-sm">{item.year}</Badge>
                            </div>
                            <h3 className="text-xl font-bold sm:text-2xl">{item.title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                              {item.description}
                            </p>
                            {item.place ? (
                              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                <MapPin className="h-4 w-4" />
                                {item.place}
                              </p>
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

      <section className="py-16 sm:py-20 bg-background/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
                <img
                  src={communityImage}
                  alt="Scouts reunidos en actividad comunitaria"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </Reveal>

            <Reveal>
              <Card className="h-full rounded-3xl border-border/70 bg-card/85 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold sm:text-3xl">Locales que marcaron epoca</h3>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    Los espacios cambian, pero la esencia sigue siendo la misma: comunidad, juego, aprendizaje y servicio.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {locales.map((local) => (
                      <div
                        key={local}
                        className="rounded-xl border border-border/70 bg-background/80 p-4 text-sm font-semibold transition-colors duration-300 hover:border-primary/45 hover:text-primary"
                      >
                        {local}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Historia;
