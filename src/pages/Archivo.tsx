import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/Reveal";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageProps } from "@/lib/optimized-images";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Image,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

type ArchiveSection = {
  title: string;
  description: string;
  to: string;
  tag: string;
  group: "Memoria" | "Conocimiento" | "Comunidad" | "Visual";
  entries: string;
  Icon: typeof BookOpen;
};

const sectionGroupMeta: Array<{
  key: ArchiveSection["group"];
  title: string;
  description: string;
}> = [
  {
    key: "Memoria",
    title: "Memoria histórica",
    description: "Hechos, lugares y registros de etapas del grupo.",
  },
  {
    key: "Conocimiento",
    title: "Conocimiento scout",
    description: "Conceptos, canciones y material formativo.",
  },
  {
    key: "Comunidad",
    title: "Personas y comunidad",
    description: "Educadores, exintegrantes y red humana del grupo.",
  },
  {
    key: "Visual",
    title: "Archivo visual",
    description: "Fotos y contenido multimedia de actividades.",
  },
];

const secciones: ArchiveSection[] = [
  {
    title: "Cápsula del Tiempo",
    description:
      "Proyecto del 50 aniversario: cápsula enterrada en el Colegio Alemán para abrir en 2064.",
    to: "/archivo/capsula-del-tiempo",
    tag: "Memoria histórica",
    group: "Memoria",
    entries: "Evento 2014",
    Icon: Calendar,
  },
  {
    title: "Scoutpedia",
    description:
      "Definiciones, términos y contenidos enciclopédicos del historial scout.",
    to: "/archivo/scoutpedia",
    tag: "Historia y metodo",
    group: "Conocimiento",
    entries: "20+ entradas",
    Icon: BookOpen,
  },
  {
    title: "Compañía",
    description:
      "Historia, actividades y documentación específica de la Compañía.",
    to: "/archivo/compania",
    tag: "Unidad",
    group: "Memoria",
    entries: "En crecimiento",
    Icon: FileText,
  },
  {
    title: "Galería",
    description:
      "Fotos del grupo, campamentos y actividades para revivir cada etapa.",
    to: "/galeria",
    tag: "Multimedia",
    group: "Visual",
    entries: "Coleccion visual",
    Icon: Image,
  },
  {
    title: "Cancionero",
    description:
      "Canciones scouts organizadas por tipo: fogon, marcha y campamento.",
    to: "/cancionero",
    tag: "Cultura",
    group: "Conocimiento",
    entries: "En crecimiento",
    Icon: BookOpen,
  },
  {
    title: "Am Lagerfeuer",
    description:
      "Repositorio de PDFs de Am Lagerfeuer: registros, cantos e historia de cada edicion.",
    to: "/archivo/am-lagerfeuer",
    tag: "Repositorio PDF",
    group: "Conocimiento",
    entries: "Archivo histórico",
    Icon: FileText,
  },
];

const actividadReciente = [
  "Se creó la sección Cápsula del Tiempo",
  "Actualización de material histórico en Scoutpedia",
  "Revisión y curaduría de documentos de Compañía",
  "Nuevas fotos incorporadas en Galería",
];

const FILTERS: Array<{ key: "all" | ArchiveSection["group"]; label: string }> = [
  { key: "all", label: "Explorar todo" },
  { key: "Memoria", label: "Memoria" },
  { key: "Conocimiento", label: "Conocimiento" },
  { key: "Comunidad", label: "Comunidad" },
  { key: "Visual", label: "Visual" },
];

const Archivo = () => {
  const communityImages = getOptimizedImageProps("community");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ArchiveSection["group"]>("all");
  const [activeSectionTo, setActiveSectionTo] = useState<string>(secciones[0].to);

  const seccionesFiltradas = useMemo(() => {
    const term = query.trim().toLowerCase();
    return secciones.filter((section) => {
      if (activeFilter !== "all" && section.group !== activeFilter) return false;
      if (!term) return true;
      const text = `${section.title} ${section.description} ${section.tag}`.toLowerCase();
      return text.includes(term);
    });
  }, [activeFilter, query]);

  useEffect(() => {
    if (seccionesFiltradas.length === 0) return;
    const activeVisible = seccionesFiltradas.some((section) => section.to === activeSectionTo);
    if (!activeVisible) {
      setActiveSectionTo(seccionesFiltradas[0].to);
    }
  }, [activeSectionTo, seccionesFiltradas]);

  const activeSection =
    seccionesFiltradas.find((section) => section.to === activeSectionTo) ??
    seccionesFiltradas[0] ??
    secciones[0];

  const activeGroupMeta =
    sectionGroupMeta.find((group) => group.key === activeSection.group) ?? sectionGroupMeta[0];

  const activeIndex = Math.max(
    0,
    seccionesFiltradas.findIndex((section) => section.to === activeSection.to),
  );

  const goPrev = () => {
    if (seccionesFiltradas.length < 2) return;
    const prev = (activeIndex - 1 + seccionesFiltradas.length) % seccionesFiltradas.length;
    setActiveSectionTo(seccionesFiltradas[prev].to);
  };

  const goNext = () => {
    if (seccionesFiltradas.length < 2) return;
    const next = (activeIndex + 1) % seccionesFiltradas.length;
    setActiveSectionTo(seccionesFiltradas[next].to);
  };

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

      <section id="secciones" className="py-10 sm:py-12 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal className="mb-6 sm:mb-7">
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

            <Reveal>
              <div className="mb-6 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeFilter === filter.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            {seccionesFiltradas.length === 0 ? (
              <Reveal>
                <Card className="mt-6 border-dashed border-border/70 bg-card/70">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No encontramos resultados para <strong>{query}</strong>. Probá con otro término.
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ) : (
              <>
                <div className="lg:hidden space-y-4 mb-6">
                  <Reveal>
                    <div className="rounded-2xl border border-border/70 bg-card/75 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                          Sección activa
                        </p>
                        <Badge variant="outline" className="border-primary/30 text-primary bg-background/70">
                          {`${activeIndex + 1}/${seccionesFiltradas.length}`}
                        </Badge>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={goPrev}>
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={goNext}>
                          Siguiente
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal>
                    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                      {seccionesFiltradas.map((section) => {
                        const Icon = section.Icon;
                        const isActive = section.to === activeSection.to;
                        return (
                          <button
                            key={section.to}
                            onClick={() => setActiveSectionTo(section.to)}
                            className={`snap-start min-w-[220px] rounded-xl border p-3 text-left transition-all ${
                              isActive
                                ? "border-primary/60 bg-primary/10"
                                : "border-border/70 bg-card/70"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                                {section.tag}
                              </p>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-snug">{section.title}</p>
                          </button>
                        );
                      })}
                    </div>
                  </Reveal>

                  <Reveal>
                    <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40">
                          <activeSection.Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                            {activeGroupMeta.title}
                          </p>
                          <h3 className="text-2xl font-black leading-tight">{activeSection.title}</h3>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-muted-foreground/90 leading-relaxed">
                        {activeSection.description}
                      </p>

                      <div className="mt-5 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                          {activeSection.tag}
                        </Badge>
                        <Badge variant="secondary">{activeSection.entries}</Badge>
                      </div>

                      <div className="mt-5">
                        <Link to={activeSection.to}>
                          <Button className="gap-2" size="sm">
                            Abrir sección
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </section>
                  </Reveal>
                </div>

                <div className="hidden lg:grid gap-5 lg:grid-cols-12 mb-6 sm:mb-8">
                  <div className="lg:col-span-4">
                    <div className="space-y-2 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
                      {seccionesFiltradas.map((section) => {
                        const Icon = section.Icon;
                        const isActive = section.to === activeSection.to;

                        return (
                          <Reveal key={section.to}>
                            <button
                              onClick={() => setActiveSectionTo(section.to)}
                              className={`h-full w-full text-left rounded-2xl border p-4 transition-all ${
                                isActive
                                  ? "border-primary/60 bg-primary/5 shadow-lg"
                                  : "border-border/70 bg-card/75 hover:-translate-y-0.5 hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                                    {section.tag}
                                  </p>
                                  <h3 className="mt-1 text-base xl:text-lg font-bold leading-snug">{section.title}</h3>
                                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wide">{section.entries}</p>
                                </div>
                              </div>
                            </button>
                          </Reveal>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <Reveal>
                      <section className="lg:sticky lg:top-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-7 sm:p-8 shadow-xl">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
                            <activeSection.Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                              {activeGroupMeta.title}
                            </p>
                            <h3 className="text-3xl font-black leading-tight">{activeSection.title}</h3>
                          </div>
                        </div>

                        <p className="mt-5 text-base text-muted-foreground leading-relaxed border-l-2 border-primary/25 pl-4">
                          {activeSection.description}
                        </p>

                        <div className="mt-6 flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                            {activeSection.tag}
                          </Badge>
                          <Badge variant="secondary">{activeSection.entries}</Badge>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Link to={activeSection.to}>
                            <Button className="gap-2">
                              Abrir sección
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to="/contacto">
                            <Button variant="outline" className="gap-2">
                              <FileText className="w-4 h-4" />
                              Enviar material
                            </Button>
                          </Link>
                        </div>

                        <div className="mt-7 border-t border-border/60 pt-5">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                            <Sparkles className="w-4 h-4" />
                            Actividad reciente
                          </div>
                          <ul className="space-y-3">
                            {actividadReciente.map((item) => (
                              <li key={item} className="flex items-start gap-3">
                                <span className="mt-1.5 block h-2 w-2 rounded-full bg-primary" />
                                <p className="text-sm text-muted-foreground">{item}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </section>
                    </Reveal>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <NovedadesRecientes />
    </div>
  );
};

export default Archivo;
