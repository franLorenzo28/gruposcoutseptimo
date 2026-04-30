import { useCallback, useEffect, useState } from "react";
import { Calendar, MapPin, Flag, Users, EyeOff, Save, X, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STORAGE_KEY = "grupo_scout_eventos";
const MODE = (import.meta.env.VITE_BACKEND || "supabase").toLowerCase();

type EventItem = {
  id: number;
  title: string;
  date: string;
  location: string;
  participants: string;
  type: string;
  status: string;
  image?: string;
  href?: string;
  sort_order?: number;
};

const defaultEvents: EventItem[] = [
  {
    id: 1,
    title: "Servicio de Grupo",
    date: "30 de Mayo, 2026",
    location: "Sede del Grupo",
    participants: "Todos los secciones",
    type: "Servicio",
    status: "Confirmado",
  },
  {
    id: 2,
    title: "Bingo",
    date: "7 de Junio, 2026",
    location: "Sede del Grupo",
    participants: "Tropa",
    type: "Evento de un día",
    status:"Confirmado",
    image: "/assets/bingo-tropa-phonix-2025.png",
  },
  {
    id: 3,
    title: "Campamento Invierno",
    date: "27 y 28 de Junio, 2026",
    location: "A confirmar",
    participants: "Todas las secciones",
    type: "Campamento de 2 días",
    status: "Confirmado",
  },
  {
    id: 4,
    title: "Lobabi",
    date: "8 de Agosto, 2026",
    location: "Parque Rivera",
    participants: "Manada",
    type: "Evento de un día",
    status: "Confirmado",
  },
  {
    id: 5,
    title: "BAUEN",
    date: "26 y 27 de Septiembre, 2026",
    location: "Parque Baroffio",
    participants: "Grupos Scouts de todo el país",
    type: "Evento Construcción de 2 días",
    status: "Confirmado",
    href: "/bauen",
  },
  {
    id: 6,
    title: "Eniesc",
    date: "10, 11 y 12 de Octubre, 2026",
    location: "Rivera, Uruguay",
    participants: "Tropa, Pioneros y Rovers",
    type: "Evento internacional",
    status: "Confirmado",
  },
  {
    id: 7,
    title: "Última Reunión",
    date: "5 de Diciembre, 2026",
    location: "Sede del Grupo",
    participants: "Todas las secciones",
    type: "Evento de un día",
    status: "Confirmado",
  },
  {
    id: 8,
    title: "Fogón de Fin de Año",
    date: "12 de Diciembre, 2026",
    location: "Sede del Grupo",
    participants: "Todas las secciones",
    type: "Evento de un día",
    status: "Confirmado",
  },
  {
    id: 9,
    title: "Campamento de Verano",
    date: "20 al 24 de Enero, 2027",
    location: "A confirmar",
    participants: "Toutes las secciones",
    type: "Campamento de 5 días",
    status: "Confirmado",
  },
];

function loadEventsLocal(): EventItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading events:", e);
  }
  return defaultEvents;
}

function saveEventsLocal(events: EventItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Error saving events:", e);
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

const EventCard = ({ event, index, isAdmin, onUpdate }: { 
  event: EventItem; 
  index: number;
  isAdmin: boolean;
  onUpdate: (id: number, updates: Partial<EventItem>) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(event);
  const [imageFailed, setImageFailed] = useState(!event.image);
  const isUnknown = event.status?.toLowerCase() === "en incógnita";

  useEffect(() => {
    setEditData(event);
  }, [event]);

  const handleSave = () => {
    onUpdate(event.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(event);
    setIsEditing(false);
  };

  return (
    <Reveal delay={index * 0.08}>
      <Card
        className="card-hover overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group h-full flex flex-col bg-background/70 backdrop-blur-sm shadow-sm hover:shadow-lg"
        role="article"
        aria-labelledby={`event-title-${event.id}`}
      >
        <div className="relative">
          <div className="h-2.5 bg-foreground/10 animate-gradient-x"></div>
          <div className="relative aspect-video overflow-hidden border-b border-border/60 bg-card">
            {imageFailed ? (
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-card to-muted/45">
                <div className="absolute inset-0 border border-border/60" aria-hidden="true" />
                <Flag className="h-9 w-9 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-muted-foreground">{isEditing ? editData.type : event.type}</p>
              </div>
            ) : (
              <img
                src={event.image}
                alt={`Imagen del evento ${event.title}`}
                loading="lazy"
                decoding="async"
                width={640}
                height={360}
                className={`h-full w-full object-cover transition-all duration-500 ${isUnknown ? "blur-[2px] scale-105" : ""}`}
                onError={() => setImageFailed(true)}
              />
            )}
            {isUnknown && (
              <span
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm border border-border/50"
                aria-label="Estado del evento"
              >
                <EyeOff className="h-3 w-3" />
                {isEditing ? editData.status : event.status}
              </span>
            )}
          </div>
        </div>
        <CardHeader className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            {isEditing ? (
              <Input
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                className="text-xs font-bold px-2 py-1 h-auto"
                placeholder="Tipo"
              />
            ) : (
              <span className="text-xs font-bold text-primary bg-muted/30 px-3 py-1 rounded-full">
                {event.type}
              </span>
            )}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Input
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="text-xs px-2 py-1 h-auto"
                  placeholder="Estado"
                />
              ) : (
                !isUnknown && (
                  <span className="text-xs bg-muted/30 text-foreground px-3 py-1 rounded-full font-semibold border border-border">
                    {event.status}
                  </span>
                )
              )}
              {isAdmin && !isEditing && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {isEditing ? (
            <Input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="text-xl font-bold"
              placeholder="Título"
            />
          ) : (
            <CardTitle
              id={`event-title-${event.id}`}
              className="text-xl leading-tight text-foreground"
            >
              {event.title}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 flex-grow">
            <div className="space-y-2 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                {isEditing ? (
                  <Input
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="flex-1 h-7 text-sm"
                    placeholder="Fecha"
                  />
                ) : (
                  <span>{event.date}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                {isEditing ? (
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="flex-1 h-7 text-sm"
                    placeholder="Ubicación"
                  />
                ) : (
                  <span>{event.location}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                {isEditing ? (
                  <Input
                    value={editData.participants}
                    onChange={(e) => setEditData({ ...editData, participants: e.target.value })}
                    className="flex-1 h-7 text-sm"
                    placeholder="Participantes"
                  />
                ) : (
                  <span>{event.participants}</span>
                )}
              </div>
            </div>

          <div className="pt-2 flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" className="flex-1" onClick={handleSave}>
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                {(event as any).href ? (
                  <Link to={(event as any).href} className="flex-1">
                    <Button className="w-full" size="sm">
                      Entrar al evento
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" size="sm" variant="outline" disabled>
                    En preparación
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Reveal>
  );
};

const MobileEventAccordion = ({ events }: { 
  events: EventItem[];
}) => {
  return (
    <div className="md:hidden space-y-3 mb-12">
      <Accordion type="single" collapsible className="space-y-3">
        {events.map((event) => {
          const isUnknown = event.status?.toLowerCase() === "en incógnita";
          return (
            <AccordionItem
              key={event.id}
              value={`event-${event.id}`}
              className="overflow-hidden rounded-xl border border-border/70 bg-background/70 backdrop-blur-sm"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="min-w-0 text-left">
                  <p className="text-base font-semibold leading-tight">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.date}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted/30 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {event.type}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {event.status}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 text-sm text-foreground">
                  <p className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{event.date}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{event.location}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{event.participants}</span>
                  </p>
                  {isUnknown && (
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Los detalles finales de este evento aún no están publicados.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  {event.href ? (
                    <Link to={event.href}>
                      <Button className="w-full" size="sm">
                        Entrar al evento
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" size="sm" variant="outline" disabled>
                      En preparación
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

const Events = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const isAdmin = checkIsAdmin(user);

  const isSupabaseMode = MODE === "supabase";

  useEffect(() => {
    async function loadEventsData() {
      if (isSupabaseMode) {
        try {
          const { data, error } = await (supabase as any)
            .from("eventos")
            .select("*")
            .order("sort_order", { ascending: true });
          
          if (error) {
            console.error("Error loading eventos from supabase:", error);
            setEvents(defaultEvents);
          } else if (data && data.length > 0) {
            setEvents(data as EventItem[]);
          } else {
            setEvents(defaultEvents);
          }
        } catch (e) {
          console.error("Error:", e);
          setEvents(defaultEvents);
        }
      } else {
        setEvents(loadEventsLocal());
      }
      setIsLoading(false);
    }

    loadEventsData();
  }, [isSupabaseMode]);

  const handleUpdate = useCallback(async (id: number, updates: Partial<EventItem>) => {
    if (isSupabaseMode) {
      try {
        const { error } = await (supabase as any)
          .from("eventos")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);
        
        if (error) {
          console.error("Error updating evento:", error);
          return;
        }
        
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      } catch (e) {
        console.error("Error:", e);
      }
    } else {
      setEvents((prev) => {
        const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        saveEventsLocal(updated);
        return updated;
      });
    }
  }, [isSupabaseMode]);

  const handleReset = useCallback(async () => {
    if (isSupabaseMode) {
      try {
        await (supabase as any).from("eventos").delete().neq("id", "0");
        
        const { error } = await (supabase as any).from("eventos").insert(
          defaultEvents.map((e) => ({ ...e, updated_at: new Date().toISOString() }))
        );
        
        if (error) {
          console.error("Error resetting eventos:", error);
        }
        setEvents(defaultEvents);
      } catch (e) {
        console.error("Error:", e);
      }
    } else {
      saveEventsLocal(defaultEvents);
      setEvents(defaultEvents);
    }
  }, [isSupabaseMode]);

  return (
    <section
      aria-label="Eventos scouts"
      role="region"
      className="container mx-auto py-8 sm:py-12"
    >
      <div className="mb-8 text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Próximos Eventos
            </h2>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                Restablecer
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Mantente al día con nuestras actividades y campamentos.
          </p>
        </Reveal>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-muted/50 border-dashed animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-5/6 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <>
          <MobileEventAccordion events={events} />
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {events.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                index={index} 
                isAdmin={isAdmin}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </>
      ) : (
        <Reveal>
          <div className="text-center py-16 px-6 bg-muted/30 rounded-lg border-2 border-dashed border-border">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">
              No hay eventos próximos
            </h3>
            <p className="mt-2 text-muted-foreground">
              Por favor, vuelve a consultar más tarde para ver nuevas actividades.
            </p>
          </div>
        </Reveal>
      )}

      {/* BAUEN Special Section */}
      <Reveal>
        <Card className="bg-background/70 backdrop-blur-sm border-2 border-primary/30 shadow-xl group overflow-hidden mt-16">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-5">
                <div className="flex items-center">
                  <Flag
                    className="w-10 h-10 md:w-12 md:h-12 text-primary mr-4 transition-transform duration-500 group-hover:rotate-[-5deg] group-hover:scale-110 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    BAUEN — Evento Scout
                  </h3>
                </div>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  El evento más importante del escultismo uruguayo, creado por el Grupo Séptimo en 2004. Un desafío que reúne a grupos scouts de todo el país para compartir experiencias, desarrollar habilidades y fortalecer la hermandad scout.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-base bg-muted/30 text-primary border-primary/30 transition-transform hover:scale-105"
                  >
                    Creado en 2004
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 text-base bg-muted/40 text-accent-foreground border-accent/30 transition-transform hover:scale-105"
                  >
                    +300 Participantes
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-base bg-muted text-muted-foreground border-muted-foreground/20 transition-transform hover:scale-105"
                  >
                    Tradición Nacional
                  </Badge>
                </div>
              </div>
              <Link to="/bauen" className="group/button w-full md:w-auto">
                <Button
                  size="lg"
                  variant="hero"
                  className="w-full whitespace-nowrap text-base md:text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Conoce más sobre BAUEN"
                >
                  Conoce más sobre BAUEN
                  <Flag
                    className="ml-2.5 w-5 h-5 transition-transform duration-300 group-hover/button:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </section>
  );
};

export default Events;