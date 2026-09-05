import { useRef, useState, useEffect, useCallback } from "react";
import { Compass, Sparkles, Heart, Users, Trophy, ArrowDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import { cn } from "@/lib/utils";

type Topic = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
  gradient: string;
  textAccent: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

const TOPICS: Topic[] = [
  {
    id: "que-es",
    title: "¿Qué es el Escultismo?",
    subtitle: "Visión global",
    icon: Compass,
    accent: "from-emerald-400/30 to-emerald-600/10",
    gradient: "from-emerald-500/20 via-transparent to-transparent",
    textAccent: "text-emerald-400",
    paragraphs: [
      "El escultismo es un movimiento educativo no formal que forma a niños y jóvenes a través de valores, juego y contacto con la naturaleza.",
      "Presente en 165 países y territorios, con aproximadamente 55 millones de miembros en todo el mundo, es una de las fuerzas juveniles más grandes del planeta.",
    ],
  },
  {
    id: "origenes",
    title: "Orígenes del Movimiento",
    subtitle: "Contexto histórico",
    icon: Trophy,
    accent: "from-amber-400/30 to-amber-600/10",
    gradient: "from-amber-500/20 via-transparent to-transparent",
    textAccent: "text-amber-400",
    paragraphs: [
      "El Movimiento Scout surgió en Inglaterra para promover el desarrollo físico, espiritual y mental de los jóvenes y formar buenos ciudadanos.",
      "Sus directrices fueron establecidas en \"Escultismo para muchachos\" (1908), escrito por Robert Baden-Powell, quien en 1929 recibió el título de Lord Baden-Powell, I barón de Gilwell.",
    ],
  },
  {
    id: "brownsea",
    title: "El Primer Campamento — Brownsea",
    subtitle: "Isla de Brownsea, 1907",
    icon: Sparkles,
    accent: "from-sky-400/30 to-sky-600/10",
    gradient: "from-sky-500/20 via-transparent to-transparent",
    textAccent: "text-sky-400",
    paragraphs: [
      "En 1907 se realizó el primer campamento experimental en la isla de Brownsea, Bahía de Poole, Dorset, en la costa sur de Inglaterra.",
      "Participaron 20 muchachos en cuatro patrullas: Lobos, Toros, Chorlitos y Cuervos. El éxito del sistema impulsó a Baden-Powell a sistematizar aprendizajes en \"Escultismo para muchachos\".",
    ],
    note: "Posteriormente, el escultismo fue perfeccionado por Vera Barclay y Roland Phillips, entre otros.",
  },
  {
    id: "metodo",
    title: "El Método Scout",
    subtitle: "Aprender haciendo",
    icon: Heart,
    accent: "from-rose-400/30 to-rose-600/10",
    gradient: "from-rose-500/20 via-transparent to-transparent",
    textAccent: "text-rose-400",
    paragraphs: [
      "Una pedagogía vivencial con juego, naturaleza y servicio como ejes. La formación busca desarrollar carácter y valores humanos de forma práctica, complementando la educación académica.",
    ],
    bullets: [
      "Actividades lúdicas con propósito educativo",
      "Vida al aire libre como aula real",
      "Servicio comunitario como práctica de valores",
    ],
  },
  {
    id: "sistema",
    title: "Sistema Educativo",
    subtitle: "Progresión por etapas",
    icon: Users,
    accent: "from-violet-400/30 to-violet-600/10",
    gradient: "from-violet-500/20 via-transparent to-transparent",
    textAccent: "text-violet-400",
    paragraphs: [
      "El escultismo estructura su sistema educativo por edades, contextos y objetivos de desarrollo, con unidades que acompañan cada momento del crecimiento.",
    ],
    bullets: [
      "Lobatismo (8-11 años): ambiente de familia feliz",
      "Sistema de Patrullas: pequeños grupos de amigos",
    ],
  },
];

const SECTION_IDS = TOPICS.map((t) => t.id);

const MovimientoScout = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [inViewSections, setInViewSections] = useState<Set<number>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const handleIntersect = (index: number) => (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveIndex(index);
          setInViewSections((prev) => new Set(prev).add(index));
        }
      });
    };

    SECTION_IDS.forEach((_, i) => {
      const el = sectionRefs.current[i];
      if (!el) return;
      const observer = new IntersectionObserver(handleIntersect(i), {
        threshold: 0.25,
        rootMargin: "-5% 0px -5% 0px",
      });
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const scrollToSection = useCallback((index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToFirstSection = useCallback(() => scrollToSection(0), [scrollToSection]);

  const heroParallax = {
    x: (mousePos.x - 0.5) * 20,
    y: (mousePos.y - 0.5) * 20,
  };

  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-12px) rotate(1deg); }
            66% { transform: translateY(6px) rotate(-1deg); }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-18px); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          .scroll-section-icon { animation: float 4s ease-in-out infinite; }
          .scroll-section-icon-delayed { animation: float 5s ease-in-out 1s infinite; }
          .hero-float-icon { animation: float-slow 6s ease-in-out infinite; }
          .hero-float-icon-2 { animation: float-slow 8s ease-in-out 2s infinite; }
          .hero-float-icon-3 { animation: float-slow 7s ease-in-out 4s infinite; }
          .grain-overlay::before {
            content: "";
            position: fixed;
            inset: -50%;
            width: 200%;
            height: 200%;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 9999;
            animation: grain 0.5s steps(4) infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-float-icon, .hero-float-icon-2, .hero-float-icon-3,
            .scroll-section-icon, .scroll-section-icon-delayed { animation: none; }
          }
        `}
      </style>

      <PageGridBackground className="theme-readable-page max-h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {/* Dot Navigation */}
        <nav
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3"
          aria-label="Navegación de secciones"
        >
          <button
            onClick={() => {
              heroRef.current?.scrollIntoView({ behavior: "smooth" });
              setActiveIndex(-1);
            }}
            className="group flex items-center gap-3"
            aria-label="Ir al inicio"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-500",
                activeIndex === -1 ? "bg-primary scale-125 shadow-[0_0_8px] shadow-primary" : "bg-white/20 hover:bg-white/40"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100",
                activeIndex === -1 ? "text-primary" : "text-white/60"
              )}
            >
              Inicio
            </span>
          </button>
          {TOPICS.map((topic, i) => (
            <button
              key={topic.id}
              onClick={() => scrollToSection(i)}
              className="group flex items-center gap-3"
              aria-label={`Ir a ${topic.title}`}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-500",
                  activeIndex === i
                    ? "bg-primary scale-125 shadow-[0_0_8px] shadow-primary"
                    : "bg-white/20 hover:bg-white/40"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap",
                  activeIndex === i ? "text-primary" : "text-white/60"
                )}
              >
                {topic.title}
              </span>
            </button>
          ))}
        </nav>

        {/* Hero Section */}
        <section
          ref={heroRef}
        className="relative min-h-screen snap-start flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl hero-float-icon" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.06),transparent_60%)]" />
          </div>

          {/* Hero content with mouse parallax */}
          <div
            className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10"
            style={{
              transform: `translate(${heroParallax.x * 0.5}px, ${heroParallax.y * 0.5}px)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <div className="max-w-5xl mx-auto text-center">
              <Reveal delay={0} animationClassName="animate-in fade-in slide-in-from-bottom-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20 backdrop-blur-sm">
                  <Compass className="w-4 h-4 text-primary [animation:spin-slow_8s_linear_infinite]" />
                  <span className="text-primary font-semibold text-sm tracking-wide">
                    55 Millones de Scouts en el Mundo
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[shimmer_4s_linear_infinite] bg-clip-text text-transparent">
                    Movimiento
                  </span>
                  <br />
                  <span className="text-white/90 [text-shadow:0_0_40px_hsl(var(--primary)/0.3)]">Scout</span>
                </h1>
              </Reveal>

              <Reveal delay={0.2} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12">
                  Un movimiento mundial de educación no formal que forma jóvenes a través de valores,
                  juego y actividades al aire libre
                </p>
              </Reveal>

              <Reveal delay={0.3} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <button
                  onClick={scrollToFirstSection}
                  className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="absolute inset-0 bg-primary rounded-full" />
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center gap-2">
                    Explorar
                    <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                  </span>
                </button>
              </Reveal>
            </div>
          </div>

          {/* Animated scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
            <span className="text-xs font-medium tracking-widest uppercase">Descubre</span>
            <div className="relative w-px h-16 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-full w-px bg-gradient-to-b from-white/30 to-transparent" />
              <div className="absolute left-0 top-0 w-px h-8 bg-primary/60 animate-[float-slow_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </section>

        {/* Content Sections */}
        {TOPICS.map((topic, index) => {
          const Icon = topic.icon;
          const isEven = index % 2 === 0;
          const isInView = inViewSections.has(index);

          return (
            <section
              key={topic.id}
              ref={(el: HTMLElement | null) => { sectionRefs.current[index] = el; }}
              className={cn(
              "relative min-h-screen snap-start flex items-center py-24 md:py-32 overflow-hidden",
              "border-t border-white/5 transition-colors duration-700",
                isInView && "border-white/10"
              )}
            >
              {/* Background layers */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none bg-gradient-to-br transition-opacity duration-1000",
                  topic.gradient,
                  isInView ? "opacity-100" : "opacity-50"
                )}
                aria-hidden="true"
              />

              {/* Animated glow blob */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl transition-all duration-1000",
                  topic.accent,
                  isInView ? "opacity-40 scale-100" : "opacity-10 scale-75",
                  isEven ? "-left-32" : "-right-32"
                )}
                aria-hidden="true"
              />

              {/* Orbiting decorative elements */}
              {isInView && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                  <div
                    className={cn(
                      "absolute top-[20%] w-3 h-3 rounded-full opacity-30",
                      topic.textAccent,
                      isEven ? "right-[15%] animate-[float_5s_ease-in-out_infinite]" : "left-[15%] animate-[float_5s_ease-in-out_1s_infinite]"
                    )}
                  />
                  <div
                    className={cn(
                      "absolute bottom-[30%] w-2 h-2 rounded-full opacity-20 bg-white",
                      isEven ? "left-[10%] animate-[float_6s_ease-in-out_2s_infinite]" : "right-[10%] animate-[float_6s_ease-in-out_0.5s_infinite]"
                    )}
                  />
                </div>
              )}

              <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
                <div className={cn(
                  "max-w-6xl mx-auto grid gap-12 md:gap-16 items-center",
                  isEven ? "md:grid-cols-[1fr_1.2fr]" : "md:grid-cols-[1.2fr_1fr]"
                )}>
                  {/* Icon / Visual Column */}
                  <Reveal
                    delay={0.1}
                    animationClassName="animate-in fade-in slide-in-from-left-8"
                    className={cn(isEven ? "md:order-first" : "md:order-last")}
                  >
                    <div className={cn(
                      "relative flex items-center justify-center",
                      isEven ? "md:justify-start" : "md:justify-end"
                    )}>
                      <div className="relative group">
                        {/* Pulse ring */}
                        <div className={cn(
                          "absolute -inset-8 rounded-[4rem] opacity-0 transition-opacity duration-700",
                          isInView && "opacity-100",
                          "before:absolute before:inset-0 before:rounded-[4rem] before:animate-[pulse-ring_3s_ease-out_infinite] before:border-2 before:border-primary/30"
                        )} />

                        {/* Icon container */}
                        <div
                          className={cn(
                            "w-32 h-32 md:w-44 md:h-44 rounded-3xl flex items-center justify-center",
                            "bg-gradient-to-br from-white/10 to-white/5 border border-white/10",
                            "shadow-2xl backdrop-blur-sm scroll-section-icon",
                            "transition-all duration-700",
                            isInView ? "scale-100 opacity-100" : "scale-90 opacity-60"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-16 h-16 md:w-24 md:h-24 transition-all duration-700",
                              isInView ? "scale-100" : "scale-75",
                              topic.textAccent
                            )}
                          />
                        </div>

                        {/* Glow behind */}
                        <div
                          className={cn(
                            "absolute -inset-4 -z-10 rounded-[2.5rem] blur-2xl transition-all duration-1000",
                            topic.accent,
                            isInView ? "opacity-70 scale-110" : "opacity-0 scale-90"
                          )}
                        />
                      </div>
                    </div>
                  </Reveal>

                  {/* Text Column */}
                  <Reveal
                    delay={0.2}
                    animationClassName="animate-in fade-in slide-in-from-right-8"
                  >
                    <div className="space-y-6">
                      <div>
                        <p className={cn(
                          "text-xs font-semibold uppercase tracking-[0.2em] mb-2 transition-colors duration-500",
                          isInView ? topic.textAccent : "text-white/40"
                        )}>
                          {topic.subtitle}
                        </p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                          {topic.title.split(" ").map((word, wIdx) => (
                            <span
                              key={wIdx}
                              className="inline-block"
                              style={{
                                animation: isInView ? `fade-in-up 0.5s ease ${wIdx * 0.08}s both` : undefined,
                              }}
                            >
                              {word}
                              {wIdx < topic.title.split(" ").length - 1 ? "\u00A0" : ""}
                            </span>
                          ))}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {topic.paragraphs.map((p, pIdx) => (
                          <p
                            key={p}
                            className="text-base sm:text-lg text-white/70 leading-relaxed"
                            style={{
                              animation: isInView ? `fade-in-up 0.6s ease ${0.3 + pIdx * 0.15}s both` : undefined,
                            }}
                          >
                            {p}
                          </p>
                        ))}
                      </div>

                      {topic.bullets && (
                        <ul
                          className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 backdrop-blur-sm"
                          style={{
                            animation: isInView ? "fade-in-up 0.6s ease 0.5s both" : undefined,
                          }}
                        >
                          {topic.bullets.map((b, bIdx) => (
                            <li
                              key={b}
                              className="flex items-start gap-3 text-white/80"
                              style={{
                                animation: isInView ? `fade-in-up 0.4s ease ${0.6 + bIdx * 0.1}s both` : undefined,
                              }}
                            >
                              <span className={cn(
                                "mt-2 h-2 w-2 shrink-0 rounded-full transition-colors duration-500",
                                isInView ? "bg-primary" : "bg-white/30"
                              )} />
                              <span className="text-sm sm:text-base">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {topic.note && (
                        <p
                          className="text-sm italic text-white/50 border-l-2 border-white/10 pl-4"
                          style={{
                            animation: isInView ? "fade-in-up 0.6s ease 0.7s both" : undefined,
                          }}
                        >
                          {topic.note}
                        </p>
                      )}
                    </div>
                  </Reveal>
                </div>
              </div>


            </section>
          );
        })}

        <NovedadesRecientes />
      </PageGridBackground>
    </>
  );
};

export default MovimientoScout;
