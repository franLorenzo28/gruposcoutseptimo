import { useEffect, useMemo, useState } from "react";
import { Compass, Users, Heart, Trophy, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type TopicCategory = "fundamentos" | "historia" | "metodo" | "sistema";

type Topic = {
  id: string;
  title: string;
  category: TopicCategory;
  icon: React.ElementType;
  eyebrow: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
  featured?: boolean;
};

const TOPICS: Topic[] = [
  {
    id: "brownsea",
    title: "El Primer Campamento - Isla de Brownsea (1907)",
    category: "historia",
    icon: Sparkles,
    eyebrow: "Hito fundacional",
    summary: "Experimento práctico que confirmó que el método scout funcionaba en terreno.",
    featured: true,
    paragraphs: [
      "En 1907 se realizó el primer campamento experimental en la isla de Brownsea, Bahía de Poole, Dorset, en la costa sur de Inglaterra.",
      "Participaron 20 muchachos en cuatro patrullas: Lobos, Toros, Chorlitos y Cuervos; provenientes tanto de familias vinculadas al ejército como de obreros de Londres.",
      "El éxito del sistema impulsó a Baden-Powell a sistematizar aprendizajes y anécdotas en Escultismo para muchachos.",
    ],
    note: "Posteriormente, el escultismo fue perfeccionado por Vera Barclay y Roland Phillips, entre otros.",
  },
  {
    id: "metodo",
    title: "El Método Scout",
    category: "metodo",
    icon: Heart,
    eyebrow: "Aprender haciendo",
    summary: "Una pedagogía vivencial con juego, naturaleza y servicio como ejes.",
    paragraphs: [
      "El Movimiento Scout enfatiza actividades lúdicas con objetivos educativos, actividades al aire libre y servicio comunitario.",
      "La formación busca desarrollar carácter y valores humanos de forma práctica, complementando la educación académica.",
      "Por eso el ejemplo del scouter o monitor es central para sostener el método en la vida cotidiana.",
    ],
    bullets: [
      "Actividades lúdicas con propósito educativo",
      "Vida al aire libre como aula real",
      "Servicio comunitario como práctica de valores",
    ],
  },
  {
    id: "escultismo",
    title: "¿Qué es el Escultismo?",
    category: "fundamentos",
    icon: Compass,
    eyebrow: "Visión global",
    summary: "Movimiento educativo no formal presente en 165 países y territorios.",
    paragraphs: [
      "El escultismo (del inglés scouting, explorar) es un movimiento infantil y juvenil que educa a niños y jóvenes con valores y actividades al aire libre.",
      "Actualmente está presente en 165 países y territorios, con aproximadamente 55 millones de miembros en todo el mundo.",
    ],
  },
  {
    id: "sistema",
    title: "Sistema Educativo",
    category: "sistema",
    icon: Users,
    eyebrow: "Progresión por etapas",
    summary: "Ramas y pequeños grupos para acompañar cada edad y momento del crecimiento.",
    paragraphs: [
      "El escultismo estructura su sistema educativo por edades, contextos y objetivos de desarrollo.",
      "Según cada asociación y país, existen unidades mayores como Caminantes o Rovers, y etapas menores previas a Manada.",
    ],
    bullets: [
      "Lobatismo (8-11 años): ambiente de familia feliz",
      "Sistema de Patrullas: pequeños grupos de amigos",
    ],
  },
  {
    id: "origenes",
    title: "Orígenes del Movimiento",
    category: "historia",
    icon: Trophy,
    eyebrow: "Contexto histórico",
    summary: "Respuesta educativa a desafíos sociales de inicios del siglo XX.",
    paragraphs: [
      "El Movimiento Scout surgió en Inglaterra para promover el desarrollo físico, espiritual y mental de los jóvenes y formar buenos ciudadanos.",
      "Sus directrices fueron establecidas en Escultismo para muchachos (1908), escrito por Robert Baden-Powell.",
      "En 1909 fue nombrado caballero y en 1929 recibió el título de Lord Baden-Powell, I barón de Gilwell.",
    ],
  },
];

const FILTERS: Array<{ key: "all" | TopicCategory; label: string }> = [
  { key: "all", label: "Explorar todo" },
  { key: "historia", label: "Historia" },
  { key: "metodo", label: "Método" },
  { key: "sistema", label: "Sistema" },
  { key: "fundamentos", label: "Fundamentos" },
];

const MovimientoScout = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | TopicCategory>("all");
  const [activeTopicId, setActiveTopicId] = useState<string>(TOPICS[0].id);

  const filteredTopics = useMemo(
    () =>
      activeFilter === "all"
        ? TOPICS
        : TOPICS.filter((topic) => topic.category === activeFilter),
    [activeFilter],
  );

  useEffect(() => {
    if (filteredTopics.length === 0) return;
    const activeVisible = filteredTopics.some((topic) => topic.id === activeTopicId);
    if (!activeVisible) {
      setActiveTopicId(filteredTopics[0].id);
    }
  }, [activeTopicId, filteredTopics]);

  const activeTopic =
    TOPICS.find((topic) => topic.id === activeTopicId) ?? filteredTopics[0] ?? TOPICS[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-12 drift-slow" />
          <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/40 top-[56%] left-[7%] [filter:blur(26px)_saturate(1.2)] float-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_45%)]" />
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
          <Reveal className="max-w-none text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/30 rounded-full mb-3 sm:mb-4">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                55 Millones de Scouts en el Mundo
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Movimiento Scout
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed">
              Un movimiento mundial de educación no formal que forma jóvenes a través de valores, juegos y actividades al aire libre
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="space-y-8">
            <Reveal>
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
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

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {filteredTopics.map((topic) => {
                    const Icon = topic.icon;
                    const isActive = topic.id === activeTopic.id;

                    return (
                      <Reveal key={topic.id}>
                        <button
                          onClick={() => setActiveTopicId(topic.id)}
                          className={`h-full w-full text-left rounded-2xl border p-5 transition-all ${
                            isActive
                              ? "border-primary/60 bg-primary/5 shadow-lg"
                              : "border-border/70 bg-card/75 hover:-translate-y-0.5 hover:border-primary/40"
                          } ${topic.featured ? "md:col-span-2 xl:col-span-1 2xl:col-span-2" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                                {topic.eyebrow}
                              </p>
                              <h2 className="mt-1 text-xl font-bold sm:text-2xl">{topic.title}</h2>
                              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{topic.summary}</p>
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
                  <section className="xl:sticky xl:top-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-7 sm:p-10 lg:p-12 shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
                        <activeTopic.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Profundizando
                        </p>
                        <h3 className="text-3xl font-black sm:text-4xl leading-tight">{activeTopic.title}</h3>
                      </div>
                    </div>

                    <div className="mt-7 space-y-5 text-muted-foreground border-l-2 border-primary/25 pl-5 sm:pl-7">
                      {activeTopic.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-lg leading-relaxed sm:text-xl">
                          {paragraph}
                        </p>
                      ))}

                      {activeTopic.bullets && (
                        <ul className="space-y-3 rounded-2xl bg-muted/25 p-5 text-base sm:text-lg">
                          {activeTopic.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-3">
                              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeTopic.note && (
                        <p className="text-base italic text-muted-foreground/90 sm:text-lg">
                          {activeTopic.note}
                        </p>
                      )}
                    </div>
                  </section>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer global en App.tsx */}
    </div>
  );
};

export default MovimientoScout;




