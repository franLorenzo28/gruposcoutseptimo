import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";
import {
  AlertTriangle,
  Calendar,
  Clock3,
  FileText,
  Image,
  Info,
  MapPin,
  Megaphone,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import { RamaAdminSection } from "@/components/miembros/RamaAdminSection";
import { DocumentsList } from "@/components/miembros/DocumentsList";
import { RamaBroadcastChannel } from "@/components/miembros/RamaBroadcastChannel";

type RamaPanelEvent = {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
};

const ramaConfig: Record<
  MiembroRama,
  {
    titulo: string;
    lema: string;
    reuniones: string[];
    info: string[];
  }
> = {
  rover: {
    titulo: "Rover",
    lema: "Servir",
    reuniones: [
      "Lunes 20:00 - 22:00",
      "Sabado salida de servicio (segun agenda)",
    ],
    info: [
      "Coordinacion de acciones solidarias",
      "Preparacion de campamentos de servicio",
    ],
  },
  pioneros: {
    titulo: "Pioneros",
    lema: "Explorar",
    reuniones: ["Martes 19:00 - 21:00", "Sabado actividad al aire libre"],
    info: ["Desafios de liderazgo", "Proyectos comunitarios de unidad"],
  },
  tropa: {
    titulo: "Tropa",
    lema: "Descubrir",
    reuniones: ["Miercoles 18:30 - 20:30", "Domingo encuentro mensual"],
    info: [
      "Trabajo en equipo",
      "Actividades de orientacion y naturaleza",
    ],
  },
  lobatos: {
    titulo: "Lobatos",
    lema: "Siempre mejor",
    reuniones: ["Sabado 15:00 - 17:00", "Fogon mensual con familias"],
    info: ["Juego educativo", "Desarrollo de habilidades y valores"],
  },
};

export default function PanelRama({ rama }: { rama: MiembroRama }) {
  const { session, logout } = useMemberAuth();
  const [searchParams] = useSearchParams();
  const denied = searchParams.get("acceso") === "denegado";
  const config = ramaConfig[rama];
  const allowedRamas = session?.allowedRamas?.length
    ? session.allowedRamas
    : session?.rama
      ? [session.rama]
      : [];
  const isRamaAdmin = !!session?.isRamaAdmin && allowedRamas.includes(rama);

  const defaultRamaContent = {
    lema: config.lema,
    reuniones: config.reuniones,
    info: config.info,
    avisos: [] as string[],
  };

  const parseStoredJson = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const [ramaContent, setRamaContent] = useState(() => {
    if (typeof window === "undefined") return defaultRamaContent;
    const stored = localStorage.getItem(`rama_${rama}_content`);
    return parseStoredJson(stored, defaultRamaContent);
  });

  const [eventos, setEventos] = useState<RamaPanelEvent[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`rama_${rama}_eventos`);
    return parseStoredJson(stored, [] as RamaPanelEvent[]);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = localStorage.getItem(`rama_${rama}_content`);
    const storedEventos = localStorage.getItem(`rama_${rama}_eventos`);
    setRamaContent(parseStoredJson(storedContent, defaultRamaContent));
    setEventos(parseStoredJson(storedEventos, [] as RamaPanelEvent[]));
  }, [rama]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`rama_${rama}_content`, JSON.stringify(ramaContent));
    }
  }, [ramaContent, rama]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`rama_${rama}_eventos`, JSON.stringify(eventos));
    }
  }, [eventos, rama]);

  const eventosOrdenados = useMemo(() => {
    const toTimestamp = (evento: RamaPanelEvent) => {
      const value = new Date(`${evento.fecha}T${evento.hora || "00:00"}:00`).getTime();
      return Number.isFinite(value) ? value : 0;
    };
    return [...eventos].sort((a, b) => toTimestamp(a) - toTimestamp(b));
  }, [eventos]);

  const eventosProximos = useMemo(() => {
    const now = Date.now();
    return eventosOrdenados.filter((evento) => {
      const value = new Date(`${evento.fecha}T${evento.hora || "00:00"}:00`).getTime();
      return Number.isFinite(value) && value >= now;
    });
  }, [eventosOrdenados]);

  const handleSaveContent = (newContent: typeof ramaContent) => {
    setRamaContent(newContent);
  };

  const handleAddEvent = (
    eventData: Omit<RamaPanelEvent, "id">,
  ) => {
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
    };
    setEventos((prev) => [...prev, newEvent]);
  };

  const handleUpdateEvent = (
    eventId: string,
    eventData: Omit<RamaPanelEvent, "id">,
  ) => {
    setEventos((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, ...eventData } : event,
      ),
    );
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventos((prev) => prev.filter((event) => event.id !== eventId));
  };

  const nextEvent = eventosProximos[0] ?? null;
  const quickStats = [
    {
      label: "Proximos eventos",
      value: String(eventosProximos.length),
      detail: nextEvent ? "Agenda activa" : "Sin agenda cargada",
    },
    {
      label: "Documentos",
      value: "Centro",
      detail: "Todo el material de la unidad",
    },
    {
      label: "Estado",
      value: isRamaAdmin ? "Admin" : "Miembro",
      detail: isRamaAdmin ? "Control operativo habilitado" : "Acceso de consulta",
    },
  ];

  return (
    <PageGridBackground>
      <section className="container mx-auto px-4 py-5 sm:py-7">
        <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
          <Reveal>
            <header className="relative overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--card))_48%,hsla(var(--primary)/0.08)_100%)] p-4 shadow-[0_18px_50px_-24px_hsla(0,0%,0%,0.45)] sm:p-6 lg:p-7">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(var(--accent)/0.16),transparent_35%),radial-gradient(circle_at_85%_20%,hsla(var(--primary)/0.16),transparent_28%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
              </div>
              <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary hover:bg-primary/10">
                      Unidad {config.titulo}
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                      Lema: {ramaContent.lema}
                    </Badge>
                  </div>
                  <div>
                    <h1 className="max-w-3xl text-3xl font-black leading-[0.95] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                      Centro operativo de {config.titulo}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">
                      Bienvenido, <strong>{session?.nombre}</strong>. Desde aca
                      ves el pulso de la unidad, accedes a materiales y ordenas
                      la agenda con una interfaz mas clara y ejecutiva.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {quickStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 shadow-sm backdrop-blur"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-black tracking-[-0.03em]">
                          {item.value}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full bg-background/70">
                      Proximos eventos: {eventosProximos.length}
                    </Badge>
                    {isRamaAdmin && (
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                        <ShieldCheck className="mr-1 h-4 w-4" />
                        Educador admin activo
                      </Badge>
                    )}
                  </div>
                  {denied && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Intentaste acceder a una unidad no permitida para tu
                      perfil.
                    </p>
                  )}
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur sm:p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Acciones rapidas
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Navegacion directa para mantener ritmo y foco dentro de la unidad.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="justify-start rounded-xl border-border/80 bg-background/80">
                      <Link to="/area-miembros">Area de miembros</Link>
                    </Button>
                    {isRamaAdmin && (
                      <Button asChild variant="secondary" className="justify-start rounded-xl">
                        <a href="#panel-admin-rama">
                          <Megaphone className="mr-1 h-4 w-4" />
                          Ir a gestion
                        </a>
                      </Button>
                    )}
                    <Button variant="destructive" onClick={logout} className="justify-start rounded-xl">
                      Cerrar sesion
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                        En foco
                      </p>
                    </div>
                    {nextEvent ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-base font-bold">{nextEvent.titulo}</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {nextEvent.fecha}
                          </p>
                          {nextEvent.hora && (
                            <p className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-primary" />
                              {nextEvent.hora}
                            </p>
                          )}
                          {nextEvent.lugar && (
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              {nextEvent.lugar}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Todavia no hay un proximo evento destacado para esta unidad.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </header>
          </Reveal>

          <div className="grid gap-4 xl:grid-cols-12">
            <section className="rounded-[26px] border border-border/70 bg-card/80 p-4 shadow-[0_14px_40px_-28px_hsla(0,0%,0%,0.4)] backdrop-blur sm:p-5 xl:col-span-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-black tracking-[-0.02em] sm:text-xl">
                    Centro documental
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Lectura clara, acceso rápido y gestión ordenada
                </p>
              </div>
              <div className="rounded-[20px] border border-border/60 bg-background/70 p-3 sm:p-4">
                <DocumentsList rama={rama} />
              </div>
            </section>

            <aside className="xl:col-span-4">
              <section className="space-y-4 rounded-[26px] border border-border/70 bg-card/80 p-4 shadow-[0_14px_40px_-28px_hsla(0,0%,0%,0.4)] backdrop-blur sm:p-5">
                <div className="rounded-[20px] border border-border/60 bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-black tracking-[-0.02em]">
                      Agenda de unidad
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {ramaContent.reuniones.map((item: string) => (
                      <div
                        key={item}
                        className="rounded-xl border border-border/60 bg-card/90 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-border/60 bg-background/70 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Proximos eventos
                  </p>
                  {eventosProximos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin eventos proximos publicados.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {eventosProximos.slice(0, 3).map((evento, index) => (
                        <div
                          key={evento.id}
                          className="rounded-2xl border border-border/70 bg-card/90 px-3.5 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold">{evento.titulo}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {evento.fecha} {evento.hora ? `- ${evento.hora}` : ""}
                              </p>
                              {evento.lugar && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {evento.lugar}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={index === 0 ? "default" : "outline"}
                              className="shrink-0 rounded-full"
                            >
                              {index === 0 ? "Siguiente" : `#${index + 1}`}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[20px] border border-border/60 bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-black tracking-[-0.02em]">
                      Informacion interna
                    </h2>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {ramaContent.info.map((item: string) => (
                      <li
                        key={item}
                        className="rounded-xl border border-border/60 bg-card/90 px-3 py-2"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  {ramaContent.avisos.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-3 dark:bg-amber-950/20">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                        Avisos rapidos
                      </p>
                      {ramaContent.avisos.slice(0, 2).map((aviso: string, idx: number) => (
                        <p key={`${idx}-${aviso}`} className="mb-1 text-xs text-amber-800 dark:text-amber-200">
                          [!] {aviso.substring(0, 90)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[20px] border border-border/60 bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-black tracking-[-0.02em]">Fotos</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Proximamente: galeria privada por unidad con salidas,
                    campamentos y actividades internas.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <RamaBroadcastChannel rama={rama} isRamaAdmin={isRamaAdmin} />

          {isRamaAdmin && (
            <div id="panel-admin-rama" className="space-y-4">
              <div className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.82))] p-4 shadow-sm dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(17,24,39,0.86))]">
                <h2 className="text-base font-black tracking-[-0.02em] text-emerald-900 dark:text-emerald-200">
                  Panel de administracion de unidad
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-emerald-700">
                  Como educador/a de {config.titulo}, tienes control operativo
                  de contenido, eventos y documentos de tu unidad.
                </p>
              </div>
              <RamaAdminSection
                ramaName={config.titulo}
                rama={rama}
                ramaContent={ramaContent}
                eventos={eventos}
                onSaveContent={handleSaveContent}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            </div>
          )}
        </div>
      </section>
    </PageGridBackground>
  );
}
