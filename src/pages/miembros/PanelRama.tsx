import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";
import { Calendar, FileText, Image, Info, AlertTriangle, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import { RamaAdminSection } from "@/components/miembros/RamaAdminSection";
import { DocumentsList } from "@/components/miembros/DocumentsList";
import { RamaBroadcastChannel } from "@/components/miembros/RamaBroadcastChannel";

const ramaConfig: Record<
  MiembroRama,
  {
    titulo: string;
    lema: string;
    reuniones: string[];
    documentos: string[];
    info: string[];
  }
> = {
  rover: {
    titulo: "Rover",
    lema: "Servir",
    reuniones: ["Lunes 20:00 - 22:00", "Sábado salida de servicio (según agenda)"],
    documentos: ["Plan anual de servicio", "Bitácora de proyectos", "Lista de materiales"],
    info: ["Coordinación de acciones solidarias", "Preparación de campamentos de servicio"],
  },
  pioneros: {
    titulo: "Pioneros",
    lema: "Explorar",
    reuniones: ["Martes 19:00 - 21:00", "Sábado actividad al aire libre"],
    documentos: ["Cronograma de patrullas", "Guía de actividades", "Autorizaciones"],
    info: ["Desafíos de liderazgo", "Proyectos comunitarios de unidad"],
  },
  tropa: {
    titulo: "Tropa",
    lema: "Descubrir",
    reuniones: ["Miércoles 18:30 - 20:30", "Domingo encuentro mensual"],
    documentos: ["Plan de progresión", "Cuaderno de ruta", "Normas de seguridad"],
    info: ["Trabajo en equipo", "Actividades de orientación y naturaleza"],
  },
  lobatos: {
    titulo: "Lobatos",
    lema: "Siempre mejor",
    reuniones: ["Sábado 15:00 - 17:00", "Fogón mensual con familias"],
    documentos: ["Calendario de manada", "Ficha médica", "Reglamento de convivencia"],
    info: ["Juego educativo", "Desarrollo de habilidades y valores"],
  },
};

export default function PanelRama({ rama }: { rama: MiembroRama }) {
  const { session, logout } = useMemberAuth();
  const [searchParams] = useSearchParams();
  const denied = searchParams.get("acceso") === "denegado";
  const config = ramaConfig[rama];
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : session?.rama ? [session.rama] : [];
  const isRamaAdmin = !!session?.isRamaAdmin && allowedRamas.includes(rama);

  // State for admin data
  const [ramaContent, setRamaContent] = useState(() => {
    if (typeof window === "undefined") return { lema: config.lema, reuniones: config.reuniones, info: config.info, avisos: [] };
    const stored = localStorage.getItem(`rama_${rama}_content`);
    return stored ? JSON.parse(stored) : { lema: config.lema, reuniones: config.reuniones, info: config.info, avisos: [] };
  });

  const [eventos, setEventos] = useState(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`rama_${rama}_eventos`);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = localStorage.getItem(`rama_${rama}_content`);
    const storedEventos = localStorage.getItem(`rama_${rama}_eventos`);
    setRamaContent(
      storedContent
        ? JSON.parse(storedContent)
        : { lema: config.lema, reuniones: config.reuniones, info: config.info, avisos: [] },
    );
    setEventos(storedEventos ? JSON.parse(storedEventos) : []);
  }, [rama]);

  // Save content to localStorage
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

  const handleSaveContent = (newContent: typeof ramaContent) => {
    setRamaContent(newContent);
  };

  const handleAddEvent = (eventData: Pick<any, 'titulo' | 'fecha' | 'hora' | 'lugar' | 'descripcion'>) => {
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
    };
    setEventos([...eventos, newEvent]);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventos(eventos.filter((e) => e.id !== eventId));
  };

  return (
    <PageGridBackground>
      <section className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
          <Reveal>
            <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-5 shadow-xl sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
              <div className="relative grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
                <div>
                  <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                    Panel de unidad {config.titulo}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Bienvenido, <strong>{session?.nombre}</strong>. Este es tu espacio interno para la organización de unidad.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      Lema: {ramaContent.lema}
                    </p>
                    {isRamaAdmin && (
                      <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        Admin de unidad habilitado
                      </p>
                    )}
                  </div>
                  {denied && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Intentaste acceder a una unidad no permitida para tu perfil.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:p-5">
                  <p className="text-sm text-muted-foreground">Acciones</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="flex-1 sm:flex-none">
                      <Link to="/area-miembros">Área de miembros</Link>
                    </Button>
                    <Button variant="destructive" onClick={logout} className="flex-1 sm:flex-none">
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              </div>
            </header>
          </Reveal>

          <div className="grid gap-4 xl:grid-cols-12">
            <section className="xl:col-span-8 rounded-3xl border border-border/70 bg-card/70 p-4 shadow-md sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold sm:text-2xl">Documentos</h2>
                </div>
                <p className="text-xs text-muted-foreground sm:text-sm">Vista ampliada para gestión y lectura</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-3 sm:p-4">
                <DocumentsList rama={rama} />
              </div>
            </section>

            <aside className="xl:col-span-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Calendario</h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ramaContent.reuniones.map((item: string) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Información interna</h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ramaContent.info.map((item: string) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                {ramaContent.avisos.length > 0 && (
                  <div className="mt-4 border-t border-border/50 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">Avisos rápidos</p>
                    {ramaContent.avisos.slice(0, 2).map((aviso: string, idx: number) => (
                      <p key={idx} className="mb-1 text-xs text-amber-700">
                        ⚠️ {aviso.substring(0, 70)}
                      </p>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:col-span-2 xl:col-span-1">
                <div className="mb-3 flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Fotos</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Próximamente: galería privada por unidad con salidas, campamentos y actividades internas.
                </p>
              </section>
            </aside>
          </div>

          <Reveal>
            <RamaBroadcastChannel rama={rama} isRamaAdmin={isRamaAdmin} />
          </Reveal>

          {isRamaAdmin && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <h2 className="text-lg font-bold text-emerald-800">🛡️ Panel de Administración de Unidad</h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Gestiona el contenido, documentos y eventos de {config.titulo}. Los cambios se guardan automáticamente.
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


