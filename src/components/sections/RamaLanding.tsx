import { Link } from "react-router-dom";
import { ArrowRight, Compass, Flame, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { OptimizedImage } from "@/components/OptimizedImage";

type RamaLandingProps = {
  title: string;
  lema: string;
  ageRange: string;
  intro: string;
  paragraphs: string[];
  bullets: string[];
  image: string | { src: string; webpSrc: string };
  imageAlt: string;
  accentClass: string;
};

export default function RamaLanding({
  title,
  lema,
  ageRange,
  intro,
  paragraphs,
  bullets,
  image,
  imageAlt,
  accentClass,
}: RamaLandingProps) {
  return (
    <div className="page-animate min-h-screen bg-background/65">
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#feb21a]/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Compass className="h-4 w-4 text-primary" />
                  Unidad Scout
                </p>
                <h1 className="text-4xl font-black leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-5xl md:text-6xl">
                  {title}
                </h1>
                <p className={`inline-flex rounded-full px-4 py-1 text-sm font-bold text-white ${accentClass}`}>
                  Lema: {lema}
                </p>
                <p className="text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">{intro}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <Link to="/contacto">
                      Sumarme a la unidad
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/area-miembros">Area de miembros</Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
                {typeof image === "string" ? (
                  <img
                    src={image}
                    alt={imageAlt}
                    className="h-[320px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-[420px]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <OptimizedImage
                    src={image.src}
                    webpSrc={image.webpSrc}
                    alt={imageAlt}
                    className="h-[320px] sm:h-[420px] w-full transition-transform duration-700 hover:scale-105"
                    objectFit="cover"
                    loading="lazy"
                  />
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/35">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg transition-all duration-300 hover:translate-y-[-4px]">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Franja de edad</p>
                  <p className="mt-2 text-3xl font-black text-primary">{ageRange}</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg transition-all duration-300 hover:translate-y-[-4px]">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metodo</p>
                  <p className="mt-2 text-2xl font-bold">Aprender haciendo</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg transition-all duration-300 hover:translate-y-[-4px]">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enfoque</p>
                  <p className="mt-2 text-2xl font-bold">Comunidad y servicio</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-background/75">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <Card className="h-full rounded-3xl border-border/70 bg-card/85 shadow-md transition-shadow duration-300 hover:shadow-lg">
                <CardContent className="space-y-4 p-6 md:p-8">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 tracking-[0.01em] text-muted-foreground sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                {bullets.map((item) => (
                  <article
                    key={item}
                    className="group rounded-2xl border border-border/70 bg-card/80 p-5 shadow-md transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <p className="flex items-start gap-3 text-sm font-semibold sm:text-base">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <span>{item}</span>
                    </p>
                  </article>
                ))}
                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/15 to-primary/5 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Flame className="h-4 w-4" />
                    Actividades durante todo el año
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
