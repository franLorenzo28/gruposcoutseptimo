import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/Reveal";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageProps } from "@/lib/optimized-images";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Flag,
  Home,
  Image,
  Layers,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

type ArchiveSection = {
  title: string;
  description: string;
  to: string;
  tag: string;
  entries: string;
  Icon: typeof BookOpen;
};

const secciones: ArchiveSection[] = [
  {
    title: "Cápsula del Tiempo",
    description:
      "Proyecto del 50 aniversario: cápsula enterrada en el Colegio Alemán para abrir en 2064.",
    to: "/archivo/capsula-del-tiempo",
    tag: "Memoria histórica",
    entries: "Evento 2014",
    Icon: Calendar,
  },
  {
    title: "Scoutpedia",
    description:
      "Definiciones, términos y contenidos enciclopédicos del historial scout.",
    to: "/archivo/scoutpedia",
    tag: "Historia y método",
    entries: "20+ entradas",
    Icon: BookOpen,
  },
  {
    title: "Compañía",
    description:
      "Historia, actividades y documentación específica de la Compañía.",
    to: "/archivo/compania",
    tag: "Unidad",
    entries: "En crecimiento",
    Icon: Layers,
  },
  {
    title: "Galería",
    description:
      "Fotos del grupo, campamentos y actividades para revivir cada etapa.",
    to: "/galeria",
    tag: "Multimedia",
    entries: "Colección visual",
    Icon: Image,
  },
  {
    title: "Cancionero",
    description:
      "Canciones scouts organizadas por tipo: fogón, marcha y campamento.",
    to: "/cancionero",
    tag: "Cultura",
    entries: "En crecimiento",
    Icon: BookOpen,
  },
  {
    title: "Veteranos",
    description:
      "Registro de ex-integrantes con nombre, años activo y rama.",
    to: "/veteranos",
    tag: "Comunidad",
    entries: "En crecimiento",
    Icon: Users,
  },
  {
    title: "Dirigentes",
    description:
      "Equipo actual de dirigentes con cargo y rama de servicio.",
    to: "/dirigentes",
    tag: "Equipo",
    entries: "En crecimiento",
    Icon: Flag,
  },
  {
    title: "Locales",
    description:
      "Sedes del grupo con dirección y descripción histórica.",
    to: "/archivo/locales",
    tag: "Infraestructura",
    entries: "En crecimiento",
    Icon: Home,
  },
  {
    title: "Jamborees",
    description:
      "Jamborees mundiales y panamericanos con año, lugar y contexto.",
    to: "/eventos/jamborees",
    tag: "Eventos internacionales",
    entries: "En crecimiento",
    Icon: Calendar,
  },
];

const actividadReciente = [
  "Se creó la sección Cápsula del Tiempo",
  "Actualización de material histórico en Scoutpedia",
  "Revisión y curaduría de documentos de Compañía",
  "Nuevas fotos incorporadas en Galería",
];

const Archivo = () => {
  const communityImages = getOptimizedImageProps("community");
  const [query, setQuery] = useState("");

  const seccionesFiltradas = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return secciones;
    return secciones.filter((section) => {
      const text = `${section.title} ${section.description} ${section.tag}`.toLowerCase();
      return text.includes(term);
    });
  }, [query]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-10 drift-slow" />
          <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/40 top-[56%] left-[6%] [filter:blur(26px)_saturate(1.2)] float-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_45%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                  Archivo del Grupo
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                Memoria viva del Grupo Séptimo
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground/90 leading-relaxed mb-6 max-w-2xl">
                Un archivo activo, navegable y en crecimiento: historia, documentos,
                términos scout y registros históricos del grupo.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-lg">
                <Card className="bg-card/80 border-border/60 shadow-sm">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-primary">{secciones.length}</p>
                    <p className="text-xs text-muted-foreground">Secciones</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-border/60 shadow-sm">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-primary">20+</p>
                    <p className="text-xs text-muted-foreground">Entradas</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-border/60 shadow-sm">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-primary">Vivo</p>
                    <p className="text-xs text-muted-foreground">Estado</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/60 shadow-xl">
              <OptimizedImage
                src={communityImages.src}
                webpSrc={communityImages.webpSrc}
                alt="Archivo histórico del Grupo Scout Séptimo"
                className="h-[260px] sm:h-[320px] w-full"
                objectFit="cover"
                priority
                width={1280}
                height={720}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="secciones" className="py-14 sm:py-20 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal className="mb-8 sm:mb-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold">Explorar secciones</h2>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                    Buscá por tema para encontrar contenido más rápido.
                  </p>
                </div>

                <div className="w-full sm:w-80 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar en archivo..."
                    className="pl-9 bg-card/70"
                  />
                </div>
              </div>
            </Reveal>

            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {seccionesFiltradas.map((section, index) => (
                <Reveal key={section.to} delay={index * 0.08}>
                  <Card className="group card-hover border border-border/70 shadow-lg bg-card/85 backdrop-blur-sm h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-6 min-h-[245px] flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <section.Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                          {section.tag}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                      <p className="text-sm text-muted-foreground/90 mb-4 flex-1">
                        {section.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {section.entries}
                        </p>
                        <Link to={section.to}>
                          <Button size="sm" className="gap-1.5">
                            Abrir
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>

            {seccionesFiltradas.length === 0 && (
              <Reveal>
                <Card className="mt-6 border-dashed border-border/70 bg-card/70">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No encontramos resultados para <strong>{query}</strong>. Probá con otro término.
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-muted/35">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <Card className="h-full border-border/70 bg-card/85 shadow-lg">
                <CardContent className="p-6 sm:p-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                    <Sparkles className="w-4 h-4" />
                    Actividad reciente
                  </div>
                  <ul className="space-y-4">
                    {actividadReciente.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1.5 block h-2 w-2 rounded-full bg-primary" />
                        <p className="text-sm text-muted-foreground">{item}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="cta-material" className="h-full border-2 border-primary/20 shadow-xl bg-card/85 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 md:p-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/60 text-muted-foreground rounded-full mb-3">
                      <Layers className="w-4 h-4" />
                      <span className="font-medium text-[11px] sm:text-xs">Material</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">¿Tenés material para sumar?</h3>
                    <p className="text-sm sm:text-base text-muted-foreground/90 mb-5">
                      Si querés aportar documentos, fotos o registros, escribinos y lo incorporamos al archivo del grupo.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link to="/contacto">
                      <Button size="lg" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Enviar material
                      </Button>
                    </Link>
                    <Link to="/archivo/scoutpedia">
                      <Button size="lg" variant="outline" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        Ver Scoutpedia
                      </Button>
                    </Link>
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

export default Archivo;

