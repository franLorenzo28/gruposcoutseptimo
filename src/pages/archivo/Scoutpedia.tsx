import { useCallback, useEffect, useMemo, useState } from "react";
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
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { PageGridBackground } from "@/components/PageGridBackground";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "grupo_scout_scoutpedia";
const MODE = (import.meta.env.VITE_BACKEND || "supabase").toLowerCase();

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
  icon: string;
  eyebrow: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
  featured?: boolean;
};

const iconMap: Record<string, React.ElementType> = {
  User,
  Trophy,
  Sparkles,
  Users,
  Flag,
  BookOpen,
  Library,
  FileText,
  Flame,
};

const defaultTopics: Topic[] = [
  {
    id: "baden-powell",
    title: "Sir Baden-Powell of Gilwell",
    category: "referentes",
    icon: "User",
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
    icon: "Trophy",
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
    icon: "Sparkles",
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
    icon: "Users",
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
    icon: "Flag",
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
    icon: "BookOpen",
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
    icon: "Library",
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
    icon: "FileText",
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
    icon: "BookOpen",
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
    icon: "Flame",
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

function loadTopicsLocal(): Topic[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading topics:", e);
  }
  return defaultTopics;
}

function saveTopicsLocal(topics: Topic[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error("Error saving topics:", e);
  }
}

const adminEmails = (import.meta.env.VITE_GALLERY_ADMIN_EMAILS || "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

function checkIsAdmin(user: any): boolean {
  if (!user) return false;
  const email = user?.email?.toLowerCase();
  const appRole = user && "role" in user ? (user.role as string)?.toLowerCase() : "";
  const rolAdulto = user && "rol_adulto" in user ? (user.rol_adulto as string)?.toLowerCase() : undefined;
  return (
    appRole === "admin" ||
    appRole === "mod" ||
    rolAdulto === "admin" ||
    rolAdulto === "mod" ||
    (!!email && adminEmails.includes(email))
  );
}

const CATEGORIES: Array<{ key: "all" | TopicCategory; label: string }> = [
  { key: "all", label: "Explorar todo" },
  { key: "referentes", label: "Referentes" },
  { key: "metodo", label: "Método" },
  { key: "obras", label: "Obras" },
  { key: "biblioteca", label: "Biblioteca" },
  { key: "mistica", label: "Mística" },
];

const Scoutpedia = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | TopicCategory>("all");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const { user } = useUser();
  const isAdmin = checkIsAdmin(user);
  const isSupabaseMode = MODE === "supabase";

  useEffect(() => {
    async function loadTopicsData() {
      if (isSupabaseMode) {
        try {
          const { data, error } = await (supabase as any)
            .from("scoutpedia_topics")
            .select("*");
          
          if (error) {
            console.error("Error loading scoutpedia_topics:", error);
            setTopics(defaultTopics);
          } else if (data && data.length > 0) {
            const mapped = (data as any[]).map((row) => ({
              ...row,
              paragraphs: Array.isArray(row.paragraphs) ? row.paragraphs : [],
              bullets: Array.isArray(row.bullets) ? row.bullets : [],
            }));
            setTopics(mapped as Topic[]);
          } else {
            setTopics(defaultTopics);
          }
        } catch (e) {
          console.error("Error:", e);
          setTopics(defaultTopics);
        }
      } else {
        const loaded = loadTopicsLocal();
        setTopics(loaded);
      }
    }

    loadTopicsData();
  }, [isSupabaseMode]);

  const filteredTopics = useMemo(() => {
    return activeCategory === "all" 
      ? topics 
      : topics.filter((t) => t.category === activeCategory);
  }, [topics, activeCategory]);

  const activeTopic = expandedTopicId 
    ? topics.find((t) => t.id === expandedTopicId) 
    : filteredTopics[0];

  const minGridCards = 6;
  const placeholderCount = Math.max(0, minGridCards - filteredTopics.length);

  const handleAdd = useCallback(async () => {
    const newId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: newId,
      title: "Nuevo tema",
      category: "referentes",
      icon: "BookOpen",
      eyebrow: "Nuevo",
      summary: "Descripcion del nuevo tema",
      paragraphs: ["Parrafo de ejemplo"],
    };

    if (isSupabaseMode) {
      try {
        const { error } = await (supabase as any)
          .from("scoutpedia_topics")
          .insert({ ...newTopic, updated_at: new Date().toISOString() });
        
        if (error) {
          console.error("Error adding topic:", error);
          return;
        }
        
        setTopics((prev) => [...prev, newTopic]);
      } catch (e) {
        console.error("Error:", e);
      }
    } else {
      setTopics((prev) => {
        const updated = [...prev, newTopic];
        saveTopicsLocal(updated);
        return updated;
      });
    }
    
    setExpandedTopicId(newId);
  }, [isSupabaseMode]);

  const handleDelete = useCallback(async (id: string) => {
    if (isSupabaseMode) {
      try {
        const { error } = await (supabase as any)
          .from("scoutpedia_topics")
          .delete()
          .eq("id", id);
        
        if (error) {
          console.error("Error deleting topic:", error);
          return;
        }
        
        setTopics((prev) => prev.filter((t) => t.id !== id));
      } catch (e) {
        console.error("Error:", e);
      }
    } else {
      setTopics((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        saveTopicsLocal(updated);
        return updated;
      });
    }
    
    if (expandedTopicId === id) {
      setExpandedTopicId(null);
    }
  }, [isSupabaseMode, expandedTopicId]);

  const handleReset = useCallback(async () => {
    if (isSupabaseMode) {
      try {
        await (supabase as any).from("scoutpedia_topics").delete().neq("id", "");
        const { error } = await (supabase as any).from("scoutpedia_topics").insert(
          defaultTopics.map((t) => ({ ...t, updated_at: new Date().toISOString() }))
        );
        if (error) console.error("Error resetting:", error);
        setTopics(defaultTopics);
      } catch (e) {
        console.error("Error:", e);
      }
    } else {
      saveTopicsLocal(defaultTopics);
      setTopics(defaultTopics);
    }
  }, [isSupabaseMode]);

  return (
    <PageGridBackground>
      {/* Hero Section */}
      <section className="pt-20 pb-14 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-40 h-40 bg-muted/30 -top-8 -right-8 float-slow" />
          <div className="bg-blob w-32 h-32 bg-muted/30 -bottom-10 -left-8 drift-slow" />
        </div>
        <div className="max-w-5xl px-4 sm:px-6 mx-auto">
          <Reveal className="max-w-none text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted/30 rounded-full mb-4">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-sm">Archivo - Scoutpedia</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Scoutpedia
            </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-2">
              Diccionario vivo de personas, obras y conceptos del Grupo Séptimo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8 sm:py-10">
        <div className="max-w-6xl px-4 sm:px-6 mx-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 rounded-full border border-border/70 bg-card/60 px-2 py-2">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      activeCategory === cat.key
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={handleAdd} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            )}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column - Topic List */}
            <div className="lg:col-span-7 grid grid-cols-2 auto-rows-min gap-3">
              {filteredTopics.map((topic) => {
                const Icon = iconMap[topic.icon] || BookOpen;
                const isExpanded = expandedTopicId === topic.id;
                
                return (
                  <div
                    key={topic.id}
                    className={`rounded-xl border bg-card/60 transition-all min-h-[140px] ${
                      isExpanded
                        ? "border-primary/50 bg-primary/10 shadow-lg"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                      className="w-full h-full flex items-start gap-3 p-4 text-left"
                    >
                      <div className={`transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                        <ChevronDown className="h-4 w-4 text-primary" />
                      </div>
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 line-clamp-1">
                          {topic.eyebrow}
                        </span>
                        <h3 className="text-sm font-bold leading-tight mt-0.5">{topic.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{topic.summary}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(topic.id); }}
                          className="h-7 w-7 text-muted-foreground/50 hover:text-destructive flex items-center justify-center rounded transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: placeholderCount }).map((_, idx) => (
                <div
                  key={`placeholder-${idx}`}
                  aria-hidden="true"
                  className="rounded-xl border border-border/40 bg-card/40 min-h-[100px]"
                />
              ))}
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-5">
              {activeTopic ? (
                <Reveal>
                  <div className="sticky top-6 w-full rounded-2xl border border-primary/30 bg-card/60 p-8 sm:p-10 md:p-12 shadow-2xl">
                    <div className="flex items-start gap-5 mb-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 shrink-0">
                        {(() => {
                          const Icon = iconMap[activeTopic.icon] || BookOpen;
                          return <Icon className="h-8 w-8 text-primary" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/70 mb-2">
                          Profundizando
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                          {activeTopic.title}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-5 text-muted-foreground border-l border-primary/30 pl-6">
                      {activeTopic.paragraphs.map((paragraph, idx) => (
                        <p key={idx} className="text-base sm:text-lg leading-relaxed">
                          {paragraph}
                        </p>
                      ))}

                      {activeTopic.bullets && activeTopic.bullets.length > 0 && (
                        <ul className="space-y-3.5 rounded-xl bg-muted/25 p-6">
                          {activeTopic.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-4">
                              <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                              <span className="text-base">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeTopic.note && (
                        <div className="rounded-xl bg-muted/20 border border-border/30 p-6">
                          <p className="text-base italic text-muted-foreground/90">
                            {activeTopic.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Seleccioná un tema para ver el contenido</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <NovedadesRecientes />
    </PageGridBackground>
  );
};

export default Scoutpedia;
