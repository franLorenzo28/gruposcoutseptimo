import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import {
  BookOpen,
  FileText,
  Flame,
  Library,
  Sparkles,
  Trophy,
  Flag,
  User,
  Users,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

type TopicCategory =
  | "referentes"
  | "metodo"
  | "obras"
  | "biblioteca"
  | "mistica";

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
    id: "baden-powell",
    title: "Sir Baden-Powell of Gilwell",
    category: "referentes",
    icon: User,
    eyebrow: "Fundador",
    summary: "1857-1941. Impulsor del Movimiento Scout y su marco educativo.",
    featured: true,
    paragraphs: [
      "Vivio servicio militar activo en India y Africa antes de la Guerra de los Boers en Sur Africa.",
      "Por su trabajo en la organizacion de los movimientos Boy Scouts y Girl Scouts recibio el titulo de Sir en 1929.",
      "Entre sus publicaciones destacan Escultismo para Muchachos (1908), Rovering to Success (1922) y Scouting and Youth Movements (1929).",
      "A partir de la observacion del juego identifica la pertenencia a pequenos grupos y la vida comunitaria como dinamismos centrales para educar.",
    ],
  },
  {
    id: "roland-philipps",
    title: "Roland Erasmus Philipps",
    category: "referentes",
    icon: Trophy,
    eyebrow: "Colaborador clave",
    summary: "1890-1916. Referente temprano del Sistema de Patrullas.",
    paragraphs: [
      "Fue politico, militar y escritor britanico. Colaboro con Baden-Powell en los primeros anos del Movimiento Scout.",
      "Se desempeno como Comisionado Scout entre 1912 y 1914.",
      "Escribio El Sistema de Patrullas, obra complementaria a Escultismo para Muchachos.",
    ],
  },
  {
    id: "kipling",
    title: "Rudyard Kipling",
    category: "referentes",
    icon: Sparkles,
    eyebrow: "Inspiracion literaria",
    summary: "Autor de El Libro de la Selva, base simbolica de la mistica de manada.",
    paragraphs: [
      "Nacio en Bombay en 1865 y fallecio en Londres en 1936.",
      "Trabajo como periodista en India y luego escribio obras para ninos y adultos.",
      "Recibio el Premio Nobel de Literatura en 1907.",
      "Sus textos aportaron relatos y simbolos adoptados pedagogicamente por el escultismo.",
    ],
  },
  {
    id: "metodo-scout",
    title: "El Metodo Scout",
    category: "metodo",
    icon: Users,
    eyebrow: "Aprender en equipo",
    summary: "Propuesta de aventura en pequenos grupos mediante el Sistema de Patrullas.",
    paragraphs: [
      "El metodo propone aprender haciendo, en comunidad y con responsabilidades reales.",
      "Cada joven aprende a trabajar, compartir y relacionarse con otros en una pequena comunidad a su medida.",
      "El sistema de equipos organiza la vida grupal y sostiene la estructura de cada seccion del Grupo Scout.",
    ],
  },
  {
    id: "sistema-patrullas",
    title: "El Sistema de Patrullas",
    category: "metodo",
    icon: Flag,
    eyebrow: "Organizacion educativa",
    summary: "Elemento central del metodo para desarrollar autonomia y responsabilidad.",
    paragraphs: [
      "El objetivo principal es conceder responsabilidad real al mayor numero posible de muchachos.",
      "Cada integrante asume un rol definido para el bienestar de su patrulla y de la tropa.",
      "Generalmente organiza pequenos equipos de seis u ocho jovenes con un guia que coordina actividades.",
    ],
    note: "Publicado por Editorial Scout Interamericana, edicion 1977 (72 paginas).",
  },
  {
    id: "escultismo-para-muchachos",
    title: "Escultismo para Muchachos",
    category: "obras",
    icon: BookOpen,
    eyebrow: "Texto fundacional",
    summary: "Manual publicado en 1908: base doctrinal y practica del movimiento.",
    paragraphs: [
      "Scouting for Boys fue publicado por primera vez en Londres en 1908.",
      "Es uno de los libros mas vendidos y traducidos del siglo XX.",
      "Invita a los jovenes a ser protagonistas de sus actividades, con foco en responsabilidad, familia y naturaleza.",
    ],
    note: '"Yo me imagino que todo muchacho desea ayudar a su pais... Un medio facil de conseguirlo es hacerse scout." - Sir Baden-Powell.',
  },
  {
    id: "primeros-cuatro-meses",
    title: "Los Primeros Cuatro Meses de una Tropa Scout",
    category: "biblioteca",
    icon: Library,
    eyebrow: "Archivo bibliografico",
    summary: "Segunda edicion (1981), impreso en Costa Rica, 49 paginas.",
    paragraphs: [
      "Publicado por Editorial Scout Interamericana.",
      "Firmado por Patricia Lodigiani (7-SET-1987).",
      "En custodia por Leopoldo Lecour (ABR-2022).",
    ],
  },
  {
    id: "manual-jefe-tropa",
    title: "Manual para el Jefe de Tropa y sus Ayudantes",
    category: "biblioteca",
    icon: FileText,
    eyebrow: "Archivo bibliografico",
    summary: "Cuarta edicion, noviembre 1981, 278 paginas.",
    paragraphs: [
      "Publicado por Editorial Scout Interamericana e impreso en Costa Rica.",
      "Manual forrado en plastico transparente, en buen estado.",
      "Firmado por Patricia Lodigiani (7-SET-1987).",
      "En custodia por Leopoldo Lecour (ABR-2022).",
    ],
  },
  {
    id: "ciudadanos-del-manana",
    title: "Manual para Scouts - Ciudadanos del Manana",
    category: "biblioteca",
    icon: BookOpen,
    eyebrow: "Archivo bibliografico",
    summary: "Octava edicion, 1973, 562 paginas.",
    paragraphs: [
      "Guia para la diversion, la aventura y el servicio comunitario.",
      "Fue entregado como premio a Miguel Alonso (patrulla BUFFEL), ganadora de COMORISCO 1975.",
      "Donado por VCS (ANBSU), firmado por Josefina Hernan de Bordaberry.",
      "En custodia por Leopoldo Lecour (ABR-2022).",
    ],
  },
  {
    id: "libro-selva",
    title: "El Libro de la Selva",
    category: "mistica",
    icon: Flame,
    eyebrow: "Mistica de manada",
    summary: "Publicado en 1894. Referencia simbolica para lobatos.",
    paragraphs: [
      "La obra aporta historias con lecciones morales a traves de personajes de la selva india.",
      "Las historias de Mowgli en la manada de Seonee inspiran la mistica usada en lobatos.",
      "Bandar-Log representa conductas opuestas a los valores que la manada transmite.",
    ],
    bullets: [
      "Nombres frecuentes en mistica: Akela, Lobo Gris, Baloo, Chil, Hathi",
      "Tambien: Bagheera, Raksha, Kaa, Riki Tiki Tavi",
      "Mowgli y Shere-Khan no se usan en la mistica de manada",
    ],
  },
];

const FILTERS: Array<{ key: "all" | TopicCategory; label: string }> = [
  { key: "all", label: "Explorar todo" },
  { key: "referentes", label: "Referentes" },
  { key: "metodo", label: "Metodo" },
  { key: "obras", label: "Obras" },
  { key: "biblioteca", label: "Biblioteca" },
  { key: "mistica", label: "Mistica" },
];

const Scoutpedia = () => {
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

  const activeIndex = Math.max(
    0,
    filteredTopics.findIndex((topic) => topic.id === activeTopic.id),
  );

  const goPrev = () => {
    if (filteredTopics.length < 2) return;
    const prev = (activeIndex - 1 + filteredTopics.length) % filteredTopics.length;
    setActiveTopicId(filteredTopics[prev].id);
  };

  const goNext = () => {
    if (filteredTopics.length < 2) return;
    const next = (activeIndex + 1) % filteredTopics.length;
    setActiveTopicId(filteredTopics[next].id);
  };

  return (
    <div className="min-h-screen">
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
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                Archivo - Scoutpedia
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Scoutpedia
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed">
              Diccionario vivo de personas, obras y conceptos que formaron el historial scout del Grupo Septimo.
            </p>
          </Reveal>
        </div>
      </section>

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

            <div className="lg:hidden space-y-4">
              <Reveal>
                <div className="rounded-2xl border border-border/70 bg-card/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-primary uppercase tracking-wide">Tema activo</p>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-background/70">
                      {filteredTopics.length === 0 ? "0/0" : `${activeIndex + 1}/${filteredTopics.length}`}
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
                  {filteredTopics.map((topic) => {
                    const Icon = topic.icon;
                    const isActive = topic.id === activeTopic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => setActiveTopicId(topic.id)}
                        className={`snap-start min-w-[220px] rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-primary/60 bg-primary/10"
                            : "border-border/70 bg-card/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                            {topic.eyebrow}
                          </p>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-snug">{topic.title}</p>
                      </button>
                    );
                  })}
                </div>
              </Reveal>

              <Reveal>
                <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40">
                      <activeTopic.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Profundizando
                      </p>
                      <h3 className="text-2xl font-black leading-tight">{activeTopic.title}</h3>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 text-muted-foreground border-l-2 border-primary/25 pl-4">
                    {activeTopic.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-relaxed">
                        {paragraph}
                      </p>
                    ))}

                    {activeTopic.bullets && (
                      <ul className="space-y-2 rounded-xl bg-muted/25 p-4 text-sm">
                        {activeTopic.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeTopic.note && (
                      <p className="text-sm italic text-muted-foreground/90">{activeTopic.note}</p>
                    )}
                  </div>
                </section>
              </Reveal>
            </div>

            <div className="hidden lg:grid gap-6 xl:grid-cols-12">
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

            <Reveal>
              <section className="rounded-2xl border border-primary/25 bg-card/80 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2">Queres sumar mas material?</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Envia material y lo incorporamos a la Scoutpedia del Grupo Septimo.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <Badge variant="outline" className="bg-muted/30 text-primary border-primary/30">
                        Estado: seccion en crecimiento
                      </Badge>
                      <Link to="/contacto">
                        <Button size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Enviar material
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </Reveal>
          </div>
        </div>
      </section>

      <NovedadesRecientes />
    </div>
  );
};

export default Scoutpedia;
