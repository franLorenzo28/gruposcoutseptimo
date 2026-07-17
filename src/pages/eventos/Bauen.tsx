import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Flag,
  Phone,
  Users,
  ArrowRight,
  Camera,
  ArrowDown,
  Hammer,
  Anchor,
  Flame,
  Crown,
  Swords,
  Tent,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import { cn } from "@/lib/utils";

const actividades = [
  { nombre: "Pionerismo", Icon: Hammer, accent: "from-amber-400/30 to-amber-600/10", textAccent: "text-amber-400" },
  { nombre: "Cabullería", Icon: Anchor, accent: "from-sky-400/30 to-sky-600/10", textAccent: "text-sky-400" },
  { nombre: "Cocina", Icon: Flame, accent: "from-rose-400/30 to-rose-600/10", textAccent: "text-rose-400" },
];

const ramas = [
  {
    nombre: "La Manada",
    color: "#FEB21A",
    duracion: "1 día",
    Icon: Tent,
    descripcion: "En la Manada se realizan construcciones de cubiles. Esta se desarrolla en una sola jornada donde deben presentar sus construcciones dentro de un recinto delimitado. Cada cubil representa a un personaje del Libro de la Selva, elegido por cada seisena, y la elección no puede repetirse dentro del mismo Grupo Scout. Con esta propuesta se busca que exploren y se sumerjan en el mundo de las Tierras Vírgenes durante la actividad. Es una actividad familiar que los Lobatos disfrutan mucho, así como sus familias y amigos.",
  },
  {
    nombre: "Unidad Scout / Tropa",
    color: "#344F1F",
    duracion: "2 días",
    Icon: Users,
    descripcion: "Es uno de los platos fuertes del evento, ya que nuclea la mayor cantidad de participantes. Actualmente participan más de 25 patrullas en competencias de construcción de rincones de patrulla y cocina con fuego. En esta unidad se ve en tiempo real todo lo aprendido en su vida scout y su aplicación práctica: cabullería, amarres, pionerismo, campismo, cocina, armado de toldos, mesas y bancos, además del cuidado y la limpieza del rincón.",
  },
  {
    nombre: "Pioneros",
    color: "#134686",
    duracion: "2 días",
    Icon: Swords,
    descripcion: "Se ha transformado en una de las actividades más atractivas del segundo día. La construcción de trebuchet aplica cabullería de forma más compleja, con precisión, técnica y roles claros dentro del equipo. Además, se realiza una cena medieval en la noche y, al día siguiente, una instancia lúdica con pruebas temáticas antes de la competencia principal.",
  },
  {
    nombre: "Rovers",
    color: "#DD0303",
    duracion: "2 días",
    Icon: Crown,
    descripcion: "Rovers realiza generalmente competencias de torres, aunque en los últimos años también hubo construcciones de barcos, campamentos elevados y juegos mecánicos. La competencia crece cada año con más comunidades participantes. También existe una actividad de integración la primera noche para conocerse y fortalecer la fraternidad. Se destaca la madurez, la experiencia y el trabajo en equipo.",
  },
];

const Bauen = () => {
  const [activeSection, setActiveSection] = useState(-1);
  const [inViewSections, setInViewSections] = useState<Set<number>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const handleIntersect = (index: number) => (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(index);
          setInViewSections((prev) => new Set(prev).add(index));
        }
      });
    };

    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(handleIntersect(i), {
        threshold: 0.2,
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

  const heroParallax = {
    x: (mousePos.x - 0.5) * 20,
    y: (mousePos.y - 0.5) * 20,
  };

  return (
    <>
      <style>
        {`
          @keyframes bauen-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-12px) rotate(1deg); }
            66% { transform: translateY(6px) rotate(-1deg); }
          }
          @keyframes bauen-float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-18px); }
          }
          @keyframes bauen-pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes bauen-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes bauen-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes bauen-fade-in-up {
            from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          .bauen-hero-float { animation: bauen-float-slow 6s ease-in-out infinite; }
          .bauen-hero-float-2 { animation: bauen-float-slow 8s ease-in-out 2s infinite; }
          .bauen-section-float { animation: bauen-float 4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .bauen-hero-float, .bauen-hero-float-2, .bauen-section-float { animation: none; }
          }
        `}
      </style>

      <PageGridBackground className="max-h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {/* Dot Navigation */}
        <nav
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3"
          aria-label="Navegación de secciones"
        >
          <button
            onClick={() => {
              heroRef.current?.scrollIntoView({ behavior: "smooth" });
              setActiveSection(-1);
            }}
            className="group flex items-center gap-3"
            aria-label="Ir al inicio"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-500",
                activeSection === -1 ? "bg-primary scale-125 shadow-[0_0_8px] shadow-primary" : "bg-white/20 hover:bg-white/40"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100",
                activeSection === -1 ? "text-primary" : "text-white/60"
              )}
            >
              Inicio
            </span>
          </button>
          {ramas.map((rama, i) => (
            <button
              key={rama.nombre}
              onClick={() => scrollToSection(i)}
              className="group flex items-center gap-3"
              aria-label={`Ir a ${rama.nombre}`}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-500",
                  activeSection === i
                    ? "bg-primary scale-125 shadow-[0_0_8px] shadow-primary"
                    : "bg-white/20 hover:bg-white/40"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap",
                  activeSection === i ? "text-primary" : "text-white/60"
                )}
              >
                {rama.nombre}
              </span>
            </button>
          ))}
        </nav>

        {/* Hero Section */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; heroRef.current = el as HTMLDivElement | null; }}
          className="relative min-h-screen snap-start flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl bauen-hero-float" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.06),transparent_60%)]" />
          </div>

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
                  <Flag className="w-4 h-4 text-primary [animation:bauen-spin-slow_8s_linear_infinite]" />
                  <span className="text-primary font-semibold text-sm tracking-wide">
                    Desde 2004 — Competencia entre Grupos Scouts
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-[0.85] tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-[length:200%_auto] animate-[bauen-shimmer_4s_linear_infinite] bg-clip-text text-transparent">
                    BAUEN
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.2} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <p className="text-xl sm:text-2xl md:text-3xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-6">
                  Construyendo juntos los ideales del Escultismo
                </p>
              </Reveal>

              <Reveal delay={0.25} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <p className="text-base sm:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed mb-12">
                  Bauen significa <em className="text-primary/80 not-italic font-medium">"construir"</em>. Una excusa para conocer otros grupos, practicar la empatía y sentir el verdadero espíritu scout.
                </p>
              </Reveal>

              <Reveal delay={0.3} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <button
                    onClick={() => scrollToSection(1)}
                    className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="absolute inset-0 bg-primary rounded-full" />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      Explorar
                      <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                    </span>
                  </button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2.5"
                    onClick={() => window.open('https://www.instagram.com/bauen.septimo/', '_blank')}
                  >
                    <Camera className="w-5 h-5" />
                    @bauen.septimo
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.35} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <div className="flex flex-wrap justify-center gap-3">
                  {actividades.map((act, idx) => (
                    <div
                      key={act.nombre}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                      style={{
                        animation: `bauen-fade-in-up 0.5s ease ${0.5 + idx * 0.1}s both`,
                      }}
                    >
                      <act.Icon className={cn("w-4 h-4", act.textAccent)} />
                      <span className="text-sm text-white/70 font-medium">{act.nombre}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
            <span className="text-xs font-medium tracking-widest uppercase">Descubre</span>
            <div className="relative w-px h-16 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-full w-px bg-gradient-to-b from-white/30 to-transparent" />
              <div className="absolute left-0 top-0 w-px h-8 bg-primary/60 animate-[bauen-float-slow_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </section>

        {/* Acerca del Evento */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="relative min-h-screen snap-start flex items-center py-24 md:py-32 overflow-hidden border-t border-white/5"
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" aria-hidden="true" />
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -left-32 w-[40rem] h-[40rem] rounded-full blur-3xl transition-all duration-1000",
              "from-amber-400/30 to-amber-600/10",
              inViewSections.has(1) ? "opacity-40 scale-100" : "opacity-10 scale-75"
            )}
            aria-hidden="true"
          />

          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
            <div className="max-w-5xl mx-auto">
              <Reveal className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-2">Sobre el evento</p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
                  {"Acerca del Bauen".split(" ").map((word, wIdx) => (
                    <span
                      key={wIdx}
                      className="inline-block"
                      style={{
                        animation: inViewSections.has(1) ? `bauen-fade-in-up 0.5s ease ${wIdx * 0.08}s both` : undefined,
                      }}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </h2>
              </Reveal>

              <div className="grid gap-6 md:grid-cols-3 mb-12">
                {[
                  { title: "Trabajo en equipo", desc: "Desarrollar técnicas de pionerismo, cabullería y construcción colaborativa.", Icon: Hammer },
                  { title: "Diversión scout", desc: "Disfrutar del espíritu scout en un ambiente de competencia sana y hermandad.", Icon: Flame },
                  { title: "Nuevos amigos", desc: "Conocer otros grupos del país y otras formas de hacer escultismo.", Icon: Users },
                ].map((item, idx) => (
                  <Reveal key={idx} delay={0.1 + idx * 0.1}>
                    <div
                      className="relative rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:border-white/20 group"
                      style={{
                        animation: inViewSections.has(1) ? `bauen-fade-in-up 0.6s ease ${0.3 + idx * 0.12}s both` : undefined,
                      }}
                    >
                      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative">
                        <item.Icon className="w-8 h-8 text-amber-400 mb-4 bauen-section-float" />
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ramas */}
        {ramas.map((rama, index) => {
          const isEven = index % 2 === 0;
          const sectionIndex = index + 2;

          return (
            <section
              key={rama.nombre}
              ref={(el) => { sectionRefs.current[sectionIndex] = el; }}
              className={cn(
                "relative min-h-screen snap-start flex items-center py-24 md:py-32 overflow-hidden",
                "border-t border-white/5 transition-colors duration-700",
                inViewSections.has(sectionIndex) && "border-white/10"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none bg-gradient-to-br transition-opacity duration-1000",
                  isEven ? "from-transparent via-transparent to-white/5" : "from-white/5 via-transparent to-transparent",
                  inViewSections.has(sectionIndex) ? "opacity-100" : "opacity-50"
                )}
                aria-hidden="true"
              />

              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl transition-all duration-1000",
                  isEven ? "-right-32" : "-left-32",
                  inViewSections.has(sectionIndex) ? "opacity-20 scale-100" : "opacity-5 scale-75"
                )}
                style={{ backgroundColor: rama.color + "30" }}
                aria-hidden="true"
              />

              {inViewSections.has(sectionIndex) && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                  <div
                    className="absolute top-[20%] w-3 h-3 rounded-full opacity-30"
                    style={{
                      backgroundColor: rama.color,
                      right: isEven ? "15%" : undefined,
                      left: isEven ? undefined : "15%",
                      animation: `bauen-float 5s ease-in-out ${isEven ? "0s" : "1s"} infinite`,
                    }}
                  />
                  <div
                    className="absolute bottom-[30%] w-2 h-2 rounded-full opacity-20 bg-white"
                    style={{
                      animation: `bauen-float 6s ease-in-out 2s infinite`,
                      left: isEven ? "10%" : undefined,
                      right: isEven ? undefined : "10%",
                    }}
                  />
                </div>
              )}

              <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
                <div className={cn(
                  "max-w-6xl mx-auto grid gap-12 md:gap-16 items-center",
                  isEven ? "md:grid-cols-[1fr_1.2fr]" : "md:grid-cols-[1.2fr_1fr]"
                )}>
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
                        <div className={cn(
                          "absolute -inset-8 rounded-[4rem] opacity-0 transition-opacity duration-700",
                          inViewSections.has(sectionIndex) && "opacity-100",
                          "before:absolute before:inset-0 before:rounded-[4rem] before:animate-[bauen-pulse-ring_3s_ease-out_infinite] before:border-2",
                        )}
                          style={{ "--tw-border-opacity": 1, borderColor: rama.color + "40" } as React.CSSProperties}
                        />

                        <div
                          className={cn(
                            "w-32 h-32 md:w-44 md:h-44 rounded-3xl flex items-center justify-center",
                            "bg-gradient-to-br from-white/10 to-white/5 border border-white/10",
                            "shadow-2xl backdrop-blur-sm bauen-section-float",
                            "transition-all duration-700",
                            inViewSections.has(sectionIndex) ? "scale-100 opacity-100" : "scale-90 opacity-60"
                          )}
                        >
                          <rama.Icon
                            className="w-16 h-16 md:w-24 md:h-24 transition-all duration-700"
                            style={{ color: rama.color }}
                          />
                        </div>

                        <div
                          className="absolute -inset-4 -z-10 rounded-[2.5rem] blur-2xl transition-all duration-1000"
                          style={{
                            backgroundColor: rama.color + "30",
                            opacity: inViewSections.has(sectionIndex) ? 0.7 : 0,
                            transform: inViewSections.has(sectionIndex) ? "scale(1.1)" : "scale(0.9)",
                          }}
                        />
                      </div>
                    </div>
                  </Reveal>

                  <Reveal
                    delay={0.2}
                    animationClassName="animate-in fade-in slide-in-from-right-8"
                  >
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2 text-white/40">
                          {rama.duracion}
                        </p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                          {rama.nombre.split(" ").map((word, wIdx) => (
                            <span
                              key={wIdx}
                              className="inline-block"
                              style={{
                                animation: inViewSections.has(sectionIndex) ? `bauen-fade-in-up 0.5s ease ${wIdx * 0.08}s both` : undefined,
                              }}
                            >
                              {word}{" "}
                            </span>
                          ))}
                        </h2>
                      </div>

                      <p
                        className="text-base sm:text-lg text-white/70 leading-relaxed"
                        style={{
                          animation: inViewSections.has(sectionIndex) ? "bauen-fade-in-up 0.6s ease 0.3s both" : undefined,
                        }}
                      >
                        {rama.descripcion}
                      </p>

                      <div
                        className="flex items-center gap-3"
                        style={{
                          animation: inViewSections.has(sectionIndex) ? "bauen-fade-in-up 0.6s ease 0.5s both" : undefined,
                        }}
                      >
                        <Button
                          variant="outline"
                          className="gap-2 border-white/20 text-white hover:bg-white/10"
                          onClick={() => window.open('https://www.instagram.com/bauen.septimo/', '_blank')}
                        >
                          <Camera className="w-4 h-4" />
                          @bauen.septimo
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>
          );
        })}

        {/* CTA Final */}
        <section className="relative min-h-[60vh] snap-start flex items-center py-24 overflow-hidden border-t border-white/5">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent_60%)]" aria-hidden="true" />

          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Reveal>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
                  {"¿Querés participar?".split(" ").map((word, wIdx) => (
                    <span
                      key={wIdx}
                      className="inline-block bg-gradient-to-r from-primary via-amber-400 to-primary bg-[length:200%_auto] animate-[bauen-shimmer_4s_linear_infinite] bg-clip-text text-transparent"
                    >
                      {word}{" "}
                    </span>
                  ))}
                </h2>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="text-lg text-white/60 mb-10 leading-relaxed">
                  Sumá tu grupo a esta experiencia de construcción, camaradería y espíritu scout.
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="absolute inset-0 bg-primary rounded-full" />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contáctanos
                    </span>
                  </button>
                  <Button
                    variant="outline"
                    className="gap-2 border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open('https://www.instagram.com/bauen.septimo/', '_blank')}
                  >
                    <Camera className="w-4 h-4" />
                    Seguinos en Instagram
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </PageGridBackground>
    </>
  );
};

export default Bauen;
