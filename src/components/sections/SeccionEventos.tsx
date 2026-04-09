import { useEffect, useState } from "react";
import { Calendar, MapPin, Flag, Users, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Mock Data: Reemplazar con datos de una API ---
const sampleEvents = [
  {
    id: 1,
    title: "Lobabi",
    date: "A confirmar, 2026",
    location: "Parque Rivera",
    participants: "Manada",
    type: "Evento de un día",
    status: "En incógnita",
    image: "https://images.unsplash.com/photo-1533599329424-34869443a571?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    title: "Bauen",
    date: "A confirmar, 2026",
    location: "Parque Baroffio",
    participants: "Grupos Scouts de todo el país",
    type: "Evento de 2 días",
    status: "En incógnita",
    image: "https://images.unsplash.com/photo-1599946343513-c4963d360293?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    title: "Eniesc",
    date: "A confirmar, 2026",
    location: "Rivera, Uruguay",
    participants: "Tropa, Pioneros y Rovers",
    type: "Evento internacional",
    status: "Confirmado",
    image: "", 
  },
];

const EventCard = ({ event, index }: { event: any; index: number }) => {
  const fechaValida = event.date && event.date !== "A confirmar";
  const [imageFailed, setImageFailed] = useState(!event.image);
  const isUnknown = event.status?.toLowerCase() === "en incógnita";

  return (
    <Reveal delay={index * 0.08}>
      <Card
        className="card-hover overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group h-full flex flex-col bg-background/70 backdrop-blur-sm shadow-sm hover:shadow-lg"
        role="article"
        aria-labelledby={`event-title-${event.id}`}
        tabIndex={0}
      >
        <div className="relative">
          <div className="h-2.5 bg-foreground/10 animate-gradient-x"></div>
          <div className="relative aspect-video overflow-hidden border-b border-border/60 bg-card">
            {imageFailed ? (
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-card to-muted/45">
                <div className="absolute inset-0 border border-border/60" aria-hidden="true" />
                <Flag className="h-9 w-9 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-muted-foreground">{event.type}</p>
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
                {event.status}
              </span>
            )}
          </div>
        </div>
        <CardHeader className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-bold text-primary bg-muted/30 px-3 py-1 rounded-full"
              aria-label="Tipo de evento"
            >
              {event.type}
            </span>
            {!isUnknown && (
              <span
                className="text-xs bg-muted/30 text-foreground px-3 py-1 rounded-full font-semibold border border-border"
                aria-label="Estado del evento"
              >
                {event.status}
              </span>
            )}
          </div>
          <CardTitle
            id={`event-title-${event.id}`}
            className="text-xl leading-tight group-hover:text-primary transition-colors"
          >
            {event.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 flex-grow">
          <TooltipProvider>
            <div className="space-y-3 text-sm text-muted-foreground">
              <Tooltip>
                <TooltipTrigger className="flex items-start text-left w-full group-hover:text-primary transition-colors">
                  <Calendar
                    className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span>{event.date}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fecha del evento</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-start text-left w-full group-hover:text-primary transition-colors">
                  <MapPin
                    className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span>{event.location}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ubicación</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-start text-left w-full group-hover:text-primary transition-colors">
                  <Users
                    className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span>{event.participants}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Participantes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </Reveal>
  );
};

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula la carga de datos desde una API
    const timer = setTimeout(() => {
      setEvents(sampleEvents);
      setIsLoading(false);
    }, 1500); // Simula un retraso de 1.5 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      aria-label="Eventos scouts"
      role="region"
      className="container mx-auto py-8 sm:py-12"
    >
      <div className="mb-8 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Próximos Eventos
          </h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
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




