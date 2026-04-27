import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";
import {
  AlertTriangle,
  Calendar,
  FileText,
  Image,
  Info,
  Megaphone,
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

  return (
    <PageGridBackground>
      <section className="container mx-auto px-4 py-5 sm:py-7">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
          <Reveal>
            <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-md sm:p-5 lg:p-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
              <div className="relative grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
                <div>
                  <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                    Panel de unidad {config.titulo}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Bienvenido, <strong>{session?.nombre}</strong>. Este es tu
                    espacio interno para organizar la unidad.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Lema: {ramaContent.lema}</Badge>
                    <Badge variant="outline">
                      Proximos eventos: {eventosProximos.length}
                    </Badge>
                    {isRamaAdmin && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
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

                <div className="rounded-xl border border-border/70 bg-background/80 p-3.5 sm:p-4">
                  <p className="text-xs text-muted-foreground">Acciones</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="flex-1 sm:flex-none">
                      <Link to="/area-miembros">Area de miembros</Link>
                    </Button>
                    {isRamaAdmin && (
                      <Button asChild variant="secondary" className="flex-1 sm:flex-none">
                        <a href="#panel-admin-rama">
                          <Megaphone className="mr-1 h-4 w-4" />
                          Ir a gestion
                        </a>
                      </Button>
                    )}
                    <Button variant="destructive" onClick={logout} className="flex-1 sm:flex-none">
                      Cerrar sesion
                    </Button>
                  </div>
                </div>
              </div>
            </header>
          </Reveal>

          <div className="grid gap-3 xl:grid-cols-12">
            <section className="rounded-2xl border border-border/70 bg-card/70 p-3.5 shadow-sm sm:p-4 xl:col-span-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold sm:text-xl">Documentos</h2>
                </div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Vista ampliada para lectura y gestion
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-2.5 sm:p-3">
                <DocumentsList rama={rama} />
              </div>
            </section>

            <aside className="xl:col-span-4">
              <section className="rounded-2xl border border-border/70 bg-card/70 p-3.5 shadow-sm sm:p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">Agenda de unidad</h2>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {ramaContent.reuniones.map((item: string) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Proximos eventos
                  </p>
                  {eventosProximos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sin eventos proximos publicados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {eventosProximos.slice(0, 3).map((evento) => (
                        <div
                          key={evento.id}
                          className="rounded-md border border-border/70 bg-background/80 px-2.5 py-2"
                        >
                          <p className="text-xs font-semibold">{evento.titulo}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {evento.fecha} {evento.hora ? `- ${evento.hora}` : ""}
                          </p>
                          {evento.lugar && (
                            <p className="text-[11px] text-muted-foreground">{evento.lugar}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold">Informacion interna</h2>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {ramaContent.info.map((item: string) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                  {ramaContent.avisos.length > 0 && (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Avisos rapidos
                      </p>
                      {ramaContent.avisos.slice(0, 2).map((aviso: string, idx: number) => (
                        <p key={`${idx}-${aviso}`} className="mb-1 text-xs text-amber-700">
                          [!] {aviso.substring(0, 70)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-border/50 pt-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold">Fotos</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Proximamente: galeria privada por unidad con salidas,
                    campamentos y actividades internas.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <Reveal>
            <RamaBroadcastChannel rama={rama} isRamaAdmin={isRamaAdmin} />
          </Reveal>

          {isRamaAdmin && (
            <div id="panel-admin-rama" className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <h2 className="text-base font-bold text-emerald-800">
                  Panel de administracion de unidad
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-emerald-700">
                  Como educador/a de {config.titulo}, tienes control operativo
                  de contenido, eventos y documentos de tu unidad.
                </p>
              </div>
              <Reveal>
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
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </PageGridBackground>
  );
}
