import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemberAuth } from "@/context/MemberAuthContext";
import type { MiembroRama } from "@/lib/member-auth";
import { Calendar, FileText, Image, Info, AlertTriangle, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { RamaAdminSection } from "@/components/miembros/RamaAdminSection";

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
    titulo: "Panel Rover",
    lema: "Servir",
    reuniones: ["Lunes 20:00 - 22:00", "Sábado salida de servicio (según agenda)"],
    documentos: ["Plan anual de servicio", "Bitácora de proyectos", "Lista de materiales"],
    info: ["Coordinación de acciones solidarias", "Preparación de campamentos de servicio"],
  },
  pioneros: {
    titulo: "Panel Pioneros",
    lema: "Explorar",
    reuniones: ["Martes 19:00 - 21:00", "Sábado actividad al aire libre"],
    documentos: ["Cronograma de patrullas", "Guía de actividades", "Autorizaciones"],
    info: ["Desafíos de liderazgo", "Proyectos comunitarios de rama"],
  },
  caminantes: {
    titulo: "Panel Caminantes",
    lema: "Descubrir",
    reuniones: ["Miércoles 18:30 - 20:30", "Domingo encuentro mensual"],
    documentos: ["Plan de progresión", "Cuaderno de ruta", "Normas de seguridad"],
    info: ["Trabajo en equipo", "Actividades de orientación y naturaleza"],
  },
  lobatos: {
    titulo: "Panel Lobatos",
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
  const isRamaAdmin = !!session?.isRamaAdmin && session?.rama === rama;

  // State for admin data
  const [ramaContent, setRamaContent] = useState(() => {
    if (typeof window === "undefined") return { lema: config.lema, reuniones: config.reuniones, info: config.info, avisos: [] };
    const stored = localStorage.getItem(`rama_${rama}_content`);
    return stored ? JSON.parse(stored) : { lema: config.lema, reuniones: config.reuniones, info: config.info, avisos: [] };
  });

  const [documentos, setDocumentos] = useState(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`rama_${rama}_documentos`);
    return stored ? JSON.parse(stored) : [];
  });

  const [eventos, setEventos] = useState(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`rama_${rama}_eventos`);
    return stored ? JSON.parse(stored) : [];
  });

  // Save content to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`rama_${rama}_content`, JSON.stringify(ramaContent));
    }
  }, [ramaContent, rama]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`rama_${rama}_documentos`, JSON.stringify(documentos));
    }
  }, [documentos, rama]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`rama_${rama}_eventos`, JSON.stringify(eventos));
    }
  }, [eventos, rama]);

  const handleSaveContent = (newContent: typeof ramaContent) => {
    setRamaContent(newContent);
  };

  const handleUploadDocument = (file: File) => {
    const newDoc = {
      id: Date.now().toString(),
      nombre: file.name,
      tipo: file.type || "Archivo",
      fechaSubida: new Date().toLocaleDateString("es-AR"),
    };
    setDocumentos([...documentos, newDoc]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocumentos(documentos.filter((d) => d.id !== docId));
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <section className="container mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Reveal>
            <div className="grid gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h1 className="text-3xl font-black sm:text-4xl">{config.titulo}</h1>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  Bienvenido, <strong>{session?.nombre}</strong>. Este es tu espacio interno para la organizacion de rama.
                </p>
                <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Lema: {config.lema}
                </p>
                {isRamaAdmin && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    Admin de rama habilitado
                  </p>
                )}
                {denied && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Intentaste acceder a una rama no permitida para tu perfil.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Acciones</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link to="/area-miembros">Área de miembros</Link>
                  </Button>
                  <Button variant="destructive" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 bg-card/80">
              <CardContent>
                <div className="mb-3 flex items-center gap-2 pt-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Calendario</h2>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {ramaContent.reuniones.map((item: string) => (
                    <li key={item}>⬢ {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardContent>
                <div className="mb-3 flex items-center gap-2 pt-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Documentos</h2>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {config.documentos.map((item) => (
                    <li key={item}>⬢ {item}</li>
                  ))}
                </ul>
                {documentos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-semibold text-primary mb-2">Archivos subidos:</p>
                    {documentos.slice(0, 3).map((doc: any) => (
                      <p key={doc.id} className="text-xs text-muted-foreground truncate">
                        📎 {doc.nombre}
                      </p>
                    ))}
                    {documentos.length > 3 && (
                      <p className="text-xs text-primary mt-1">+{documentos.length - 3} más</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardContent>
                <div className="mb-3 flex items-center gap-2 pt-4">
                  <Image className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Fotos</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Próximamente: galería privada por rama con salidas, campamentos y actividades internas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardContent>
                <div className="mb-3 flex items-center gap-2 pt-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Información interna</h2>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {ramaContent.info.map((item: string) => (
                    <li key={item}>⬢ {item}</li>
                  ))}
                </ul>
                {ramaContent.avisos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-semibold text-amber-600 mb-2">Avisos:</p>
                    {ramaContent.avisos.slice(0, 2).map((aviso: string, idx: number) => (
                      <p key={idx} className="text-xs text-amber-700 mb-1">
                        ⚠️ {aviso.substring(0, 40)}...
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isRamaAdmin && (
            <div className="space-y-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                <h2 className="text-lg font-bold text-emerald-800">🛡️ Panel de Administración de Rama</h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Gestiona el contenido, documentos y eventos de {config.titulo}. Los cambios se guardan automáticamente.
                </p>
              </div>

              <Reveal>
                <RamaAdminSection
                  ramaName={config.titulo}
                  ramaContent={ramaContent}
                  documentos={documentos}
                  eventos={eventos}
                  onSaveContent={handleSaveContent}
                  onUploadDocument={handleUploadDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onAddEvent={handleAddEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

