import { useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    key: "Conocimiento",
    title: "Conocimiento scout",
    description: "Conceptos, material formativo y archivo histórico del grupo.",
  },
];

const secciones: ArchiveSection[] = [
  {
    title: "Scoutpedia",
    description:
      "Definiciones, términos, contenidos enciclopédicos y archivo histórico de Am Lagerfeuer del Grupo Scout.",
    to: "/archivo/scoutpedia",
    tag: "Historia y metodo",
    group: "Conocimiento",
    entries: "20+ entradas",
    Icon: BookOpen,
  },
];

const actividadReciente = [
  "Actualización de material histórico en Scoutpedia",
  "Archivo de ediciones de Am Lagerfeuer incorporado",
];

const FILTERS: Array<{ key: "all" | ArchiveSection["group"]; label: string }> = [
  { key: "all", label: "Explorar todo" },
  { key: "Conocimiento", label: "Conocimiento" },
];

const Archivo = () => {
  const communityImages = getOptimizedImageProps("community");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ArchiveSection["group"]>("all");
  const [activeSectionTo, setActiveSectionTo] = useState<string>(secciones[0]!.to);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [inViewHero, setInViewHero] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

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
      setActiveSectionTo(seccionesFiltradas[0]!.to);
    }
  }, [activeSectionTo, seccionesFiltradas]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInViewHero(true);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const activeSection =
    seccionesFiltradas.find((section) => section.to === activeSectionTo) ??
    seccionesFiltradas[0] ??
    secciones[0];

  if (!activeSection) return null;

  const activeGroupMeta =
    sectionGroupMeta.find((group) => group.key === activeSection.group) ?? sectionGroupMeta[0];

  const activeIndex = Math.max(
    0,
    seccionesFiltradas.findIndex((section) => section.to === activeSection.to),
  );

  const goPrev = () => {
    if (seccionesFiltradas.length < 2) return;
    const prev = (activeIndex - 1 + seccionesFiltradas.length) % seccionesFiltradas.length;
    setActiveSectionTo(seccionesFiltradas[prev]!.to);
  };

  const goNext = () => {
    if (seccionesFiltradas.length < 2) return;
    const next = (activeIndex + 1) % seccionesFiltradas.length;
    setActiveSectionTo(seccionesFiltradas[next]!.to);
  };

  const heroParallax = {
    x: (mousePos.x - 0.5) * 15,
    y: (mousePos.y - 0.5) * 15,
  };

  return (
    <>
      <style>
        {`
          @keyframes arch-float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          @keyframes arch-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes arch-fade-in-up {
            from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes arch-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .arch-hero-float { animation: arch-float-slow 6s ease-in-out infinite; }
          .arch-hero-float-2 { animation: arch-float-slow 8s ease-in-out 2s infinite; }
          @media (prefers-reduced-motion: reduce) {
            .arch-hero-float, .arch-hero-float-2 { animation: none; }
          }
        `}
      </style>

      <div className="min-h-screen">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 min-h-[80vh] flex items-center"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl arch-hero-float" />
            <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/40 top-[56%] left-[6%] [filter:blur(26px)_saturate(1.2)] arch-hero-float-2" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_45%)]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center"
              style={{
                transform: `translate(${heroParallax.x * 0.3}px, ${heroParallax.y * 0.3}px)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <div>
                <Reveal delay={0} animationClassName="animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-primary/10 backdrop-blur-sm rounded-full mb-4 sm:mb-6 border border-primary/20">
                    <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-primary [animation:arch-spin-slow_12s_linear_infinite]" />
                    <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                      Archivo del Grupo
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={0.1} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                    {"Memoria viva del Grupo Séptimo".split(" ").map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className="inline-block"
                        style={{
                          animation: inViewHero ? `arch-fade-in-up 0.5s ease ${wIdx * 0.06}s both` : undefined,
                        }}
                      >
                        {wIdx === 0 ? (
                          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[arch-shimmer_4s_linear_infinite] bg-clip-text text-transparent">
                            {word}
                          </span>
                        ) : (
                          <span className="text-white/90">{word}</span>
                        )}{" "}
                      </span>
                    ))}
                  </h1>
                </Reveal>

                <Reveal delay={0.2} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                  <p className="text-sm sm:text-base md:text-lg text-white/60 leading-relaxed mb-6 max-w-2xl">
                    Un archivo activo, navegable y en crecimiento: historia, documentos,
                    términos scout y registros históricos del grupo.
                  </p>
                </Reveal>

                <Reveal delay={0.3} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: BookOpen, label: "Scoutpedia", count: "20+ entradas" },
                    ].map((stat, idx) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                        style={{
                          animation: `arch-fade-in-up 0.5s ease ${0.4 + idx * 0.1}s both`,
                        }}
                      >
                        <stat.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm text-white/70 font-medium">{stat.label}</span>
                        <span className="text-xs text-white/40">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              <Reveal delay={0.15} animationClassName="animate-in fade-in slide-in-from-right-8">
                <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
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
          </div>
        </section>

        {/* Explorer */}
        <section id="secciones" className="py-8 sm:py-10 bg-gradient-to-b from-background via-background/95 to-muted/25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <Reveal className="mb-6 sm:mb-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-[length:200%_auto] animate-[arch-shimmer_4s_linear_infinite] bg-clip-text text-transparent">
                        Explorar secciones
                      </span>
                    </h2>
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
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          activeFilter === filter.key
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
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
                              className={cn(
                                "snap-start min-w-[220px] rounded-xl border p-3 text-left transition-all duration-300",
                                isActive
                                  ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                                  : "border-border/70 bg-card/70 hover:border-primary/40 hover:-translate-y-0.5"
                              )}
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
                              {activeGroupMeta?.title}
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

                  <div className="hidden lg:grid gap-6 xl:grid-cols-12 mb-4 sm:mb-6">
                    <div className="xl:col-span-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:pr-2">
                        {seccionesFiltradas.map((section) => {
                          const Icon = section.Icon;
                          const isActive = section.to === activeSection.to;

                          return (
                            <Reveal key={section.to}>
                              <button
                                onClick={() => setActiveSectionTo(section.to)}
                                className={cn(
                                  "h-full w-full text-left rounded-2xl border p-4 transition-all duration-300 group",
                                  isActive
                                    ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
                                    : "border-border/70 bg-card/75 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40 group-hover:bg-primary/10 transition-colors">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                                      {section.tag}
                                    </p>
                                    <h3 className="mt-1 text-lg font-bold leading-snug group-hover:text-primary transition-colors">{section.title}</h3>
                                    <p className="mt-1.5 text-sm text-muted-foreground hidden 2xl:block">{section.description}</p>
                                  </div>
                                </div>
                              </button>
                            </Reveal>
                          );
                        })}
                      </div>
                    </div>

                    <div className="xl:col-span-7">
                      <Reveal>
                        <section className="xl:sticky xl:top-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-6 sm:p-7 shadow-xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 arch-hero-float">
                              <activeSection.Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                {activeGroupMeta?.title}
                              </p>
                              <h3 className="text-3xl font-black leading-tight">{activeSection.title}</h3>
                            </div>
                          </div>

                          <p className="mt-4 text-base text-muted-foreground leading-relaxed border-l-2 border-primary/25 pl-4">
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
                          </div>

                          <div className="mt-6 border-t border-border/60 pt-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                              <Sparkles className="w-4 h-4" />
                              Actividad reciente
                            </div>
                            <ul className="space-y-2.5">
                              {actividadReciente.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                  <span className="mt-1.5 block h-2 w-2 rounded-full bg-primary animate-pulse" />
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
    </>
  );
};

export default Archivo;
