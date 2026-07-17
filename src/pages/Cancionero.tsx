import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, Upload, Download, Trash2, ChevronDown, FileText, Volume2, Disc3 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import { useToast } from "@/hooks/use-toast";
import {
  listCancioneroAudios,
  uploadCancioneroAudio,
  deleteCancioneroAudio,
  type CancioneroAudio,
} from "@/lib/cancionero-audios";
import { isCurrentUserAdmin } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

type Registro = {
  id: string;
  titulo: string;
  letra?: string;
  notas: string[];
  credito: string;
  audioFile?: string;
};

type Cancion = {
  id: string;
  titulo: string;
  registros: Registro[];
};

type Danza = {
  id: string;
  titulo: string;
  descripcion: string;
  origen?: string;
  pasos?: string[];
};

const CANCIONES_DATA: Cancion[] = [
  {
    id: "animas",
    titulo: "Ánimas",
    registros: [
      {
        id: "animas-i",
        titulo: "Ánimas I",
        letra:
          "Oh ven a acampar\ndeja tras ti el dolor\ny las penas deja tras de ti\npues junto al fogón\nhallarás el amor\nde la naturaleza sin par.\n\nOh! ven a acampar\ndeja tras ti la enorme ciudad\ny ven a admirar la salvaje beldad\nde la naturaleza sin fin.\n\nCon el crepitar\ndel ardiente fogón\ny la noche que cae sobre ti\nel fresco verdor de la vegetación\nte dará deseos de vivir.\n\nOh! ven a acampar\ndeja tras ti la enorme ciudad\ny ven a admirar la salvaje beldad\nde la naturaleza sin fin.",
        notas: [
          "Música/Tonada: Home on the Range",
          "Home on the Range es el himno del estado estadounidense de Kansas",
          "El Dr. Brewster M. Higley (1823-1911) originalmente escribió la letra en un poema titulado 'My Western Home'",
          "La música fue compuesta por un amigo de Higley llamado Daniel E. Kelley",
          "Canción tradicional Grupo 7º",
          "Letra/Adaptación: Diego (Büffel) Pose (1966)",
        ],
        credito: "Registro y memoria oral: Ricardo Hein (30-JUL-2022)",
      },
      {
        id: "animas-ii",
        titulo: "Ánimas II",
        letra:
          "Bajo el cielo estrellado el follaje\ny los árboles susurran ya\nun mensaje de paz infinita\noh, que bueno es el ir a acampar!\n\nUn buen fuego una olla colgada\nla comida muy pronto estará\nvengan todos vamos disfrutemos\noh, que bueno es el ir a acampar!\n\nAunque lluevan diez días seguidos\neso no nos desanimará\nvengan todos, vamos disfrutemos\noh que bueno es el ir a acampar\n\nCulminando el fin de semana\nun pie tierno su promesa hará\njuntos todos en la ceremonia\nviviremos nuestro ideal!",
        notas: ["Música/Tonada: Red River Valley", "Canción tradicional del Grupo 7º"],
        credito: "Cancion tradicional del Grupo 7o",
      },
    ],
  },
];

const DANZAS_DATA: Danza[] = [
  {
    id: "shipishipi",
    titulo: "Baila el Shipishipi",
    descripcion: "Ritmo tradicionales trae­do de Panamá en 1970.",
    origen: "Panamá (1970)",
    pasos: [
      "Pie derecho adelante",
      "Pie izquierdo al lado",
      "Pie derecho al lado",
      "Saltar y caer con los dos pies",
      "Repetir hacia el otro lado",
    ],
  },
  {
    id: "cheki",
    titulo: "Cheki Cheki",
    descripcion: "_can­ción y danza aprende­da en California, EUA.",
    origen: "EUA - California",
  },
];

const Cancionero = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audios, setAudios] = useState<CancioneroAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(true);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [deletingAudioPath, setDeletingAudioPath] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openCanciones, setOpenCanciones] = useState<string[]>(["animas"]);
  const [openDanzas, setOpenDanzas] = useState<string[]>([]);
  const [expandedRegistro, setExpandedRegistro] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLDivElement | null>(null);

  const toggleCancion = (id: string) => {
    setOpenCanciones((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDanza = (id: string) => {
    setOpenDanzas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const checkAdmin = async () => {
    try {
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadAudios = async () => {
    try {
      setLoadingAudios(true);
      const files = await listCancioneroAudios();
      setAudios(files);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar los audios";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingAudios(false);
    }
  };

  useEffect(() => {
    loadAudios();
    checkAdmin();
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingAudio(true);
      for (const file of Array.from(files)) {
        await uploadCancioneroAudio(file);
      }
      toast({
        title: "Audios subidos",
        description: `Se subieron ${files.length} archivo(s) de audio`,
      });
      await loadAudios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudieron subir los audios";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingAudio(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAudioDelete = async (audio: CancioneroAudio) => {
    const confirmed = window.confirm(`¿Eliminar el audio "${audio.name}"?`);
    if (!confirmed) return;

    try {
      setDeletingAudioPath(audio.path);
      await deleteCancioneroAudio(audio.path);
      toast({
        title: "Audio eliminado",
        description: `Se elimino ${audio.name}`,
      });
      await loadAudios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el audio";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingAudioPath(null);
    }
  };

  const heroParallax = {
    x: (mousePos.x - 0.5) * 15,
    y: (mousePos.y - 0.5) * 15,
  };

  return (
    <>
      <style>
        {`
          @keyframes canc-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(2deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
          }
          @keyframes canc-float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          @keyframes canc-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes canc-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes canc-fade-in-up {
            from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes canc-note-drift {
            0% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
            50% { transform: translateY(-30px) rotate(15deg); opacity: 0.25; }
            100% { transform: translateY(-60px) rotate(-10deg); opacity: 0; }
          }
          .canc-hero-float { animation: canc-float-slow 6s ease-in-out infinite; }
          .canc-hero-float-2 { animation: canc-float-slow 8s ease-in-out 2s infinite; }
          .canc-note { animation: canc-note-drift 4s ease-in-out infinite; }
          .canc-note-2 { animation: canc-note-drift 5s ease-in-out 1s infinite; }
          .canc-note-3 { animation: canc-note-drift 6s ease-in-out 2s infinite; }
          @media (prefers-reduced-motion: reduce) {
            .canc-hero-float, .canc-hero-float-2, .canc-note, .canc-note-2, .canc-note-3 { animation: none; }
          }
        `}
      </style>

      <PageGridBackground>
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 sm:pt-32"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl canc-hero-float" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.06),transparent_60%)]" />

            {/* Floating music notes */}
            <div className="absolute top-[20%] left-[10%] text-primary/15 text-4xl canc-note pointer-events-none select-none" aria-hidden="true">♪</div>
            <div className="absolute top-[30%] right-[15%] text-accent/15 text-3xl canc-note-2 pointer-events-none select-none" aria-hidden="true">♫</div>
            <div className="absolute bottom-[25%] left-[20%] text-primary/10 text-5xl canc-note-3 pointer-events-none select-none" aria-hidden="true">♩</div>
            <div className="absolute top-[60%] right-[25%] text-accent/10 text-2xl canc-note pointer-events-none select-none" aria-hidden="true">♬</div>
          </div>

          <div
            className="w-full px-4 sm:px-6 lg:px-8 relative z-10"
            style={{
              transform: `translate(${heroParallax.x * 0.5}px, ${heroParallax.y * 0.5}px)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <div className="max-w-5xl mx-auto text-center">
              <Reveal delay={0} animationClassName="animate-in fade-in slide-in-from-bottom-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20 backdrop-blur-sm">
                  <Music className="w-4 h-4 text-primary [animation:canc-spin-slow_8s_linear_infinite]" />
                  <span className="text-primary font-semibold text-sm tracking-wide">
                    Archivo musical scout
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.85] tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[canc-shimmer_4s_linear_infinite] bg-clip-text text-transparent">
                    Cancionero
                  </span>
                  <br />
                  <span className="text-white/90 [text-shadow:0_0_40px_hsl(var(--primary)/0.3)]">
                    del Grupo Séptimo
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.2} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12">
                  Canciones y danzas tradicionales que narran nuestra historia.
                  Explora cada sección para descubrir letras, notas y ritmos.
                </p>
              </Reveal>

              <Reveal delay={0.3} animationClassName="animate-in fade-in slide-in-from-bottom-6">
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { icon: Music, label: "Canciones", count: CANCIONES_DATA.length },
                    { icon: Disc3, label: "Danzas", count: DANZAS_DATA.length },
                    { icon: Volume2, label: "Audios", count: "Archivo" },
                  ].map((stat, idx) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                      style={{
                        animation: `canc-fade-in-up 0.5s ease ${0.4 + idx * 0.1}s both`,
                      }}
                    >
                      <stat.icon className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm font-bold text-white/80">{stat.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-14 sm:py-20 bg-background/70">
          <div className="container mx-auto px-4">
            <div className="grid gap-8">
              {/* Canciones */}
              <Reveal>
                <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 canc-hero-float">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Canciones</h2>
                        <p className="text-sm text-muted-foreground">Cantos tradicionales del grupo</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {CANCIONES_DATA.map((cancion) => (
                        <Collapsible
                          key={cancion.id}
                          open={openCanciones.includes(cancion.id)}
                          onOpenChange={() => toggleCancion(cancion.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/50 bg-gradient-to-r from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 hover:border-primary/30 transition-all duration-200 text-left group">
                              <span className="font-semibold text-lg group-hover:text-primary transition-colors">{cancion.titulo}</span>
                              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", openCanciones.includes(cancion.id) && "rotate-180")} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 mt-3">
                            {cancion.registros.map((registro) => (
                              <Collapsible
                                key={registro.id}
                                open={expandedRegistro === registro.id}
                                onOpenChange={() => setExpandedRegistro(expandedRegistro === registro.id ? null : registro.id)}
                              >
                                <CollapsibleTrigger asChild>
                                  <button className="w-full flex items-center justify-between p-3 rounded-md border border-border/40 bg-background/50 hover:bg-background/80 hover:border-primary/20 transition-all duration-200 text-left ml-2 group">
                                    <span className="font-medium group-hover:text-primary transition-colors">{registro.titulo}</span>
                                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expandedRegistro === registro.id && "rotate-180")} />
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 ml-4 space-y-4">
                                  {registro.letra && (
                                    <div className="rounded-xl bg-gradient-to-br from-primary/5 via-background/80 to-accent/5 border border-primary/10 p-5">
                                      <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-3.5 w-3.5 text-primary/60" />
                                        <span className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Letra</span>
                                      </div>
                                      <pre className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans">
                                        {registro.letra}
                                      </pre>
                                    </div>
                                  )}

                                  <div className="rounded-lg bg-background/40 border border-border/30 p-4">
                                    <div className="space-y-1.5">
                                      {registro.notas.map((nota, idx) => (
                                        <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                          {nota}
                                        </p>
                                      ))}
                                    </div>
                                    <p className="text-xs font-medium text-primary/70 mt-3 pt-3 border-t border-border/30">{registro.credito}</p>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              {/* Danzas */}
              <Reveal>
                <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-primary/10 canc-hero-float-2">
                        <Disc3 className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Danzas</h2>
                        <p className="text-sm text-muted-foreground">Ritmos y movimientos tradicionales</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {DANZAS_DATA.map((danza) => (
                        <Collapsible
                          key={danza.id}
                          open={openDanzas.includes(danza.id)}
                          onOpenChange={() => toggleDanza(danza.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/50 bg-gradient-to-r from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 hover:border-accent/30 transition-all duration-200 text-left group">
                              <span className="font-semibold text-lg group-hover:text-accent transition-colors">{danza.titulo}</span>
                              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", openDanzas.includes(danza.id) && "rotate-180")} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-3 ml-2">
                            <p className="text-sm text-muted-foreground">{danza.descripcion}</p>
                            {danza.origen && (
                              <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                                Origen: {danza.origen}
                              </Badge>
                            )}
                            {danza.pasos && (
                              <div className="mt-2 rounded-lg bg-background/40 border border-border/30 p-4">
                                <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-accent/70">Pasos</p>
                                <ol className="space-y-2">
                                  {danza.pasos.map((paso, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                                        {idx + 1}
                                      </span>
                                      {paso}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>

            {/* Audio Repository */}
            <div className="mt-12">
              <Reveal>
                <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Volume2 className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Repositorio de audios</h2>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                          Archivos de audio compartidos para el grupo. Los administradores pueden subir nuevos archivos.
                        </p>
                      </div>
                      {isAdmin && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            multiple
                            onChange={handleAudioUpload}
                            className="hidden"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAudio}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingAudio ? "Subiendo..." : "Subir audios"}
                          </Button>
                        </div>
                      )}
                    </div>

                    {loadingAudios ? (
                      <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm">Cargando audios...</p>
                      </div>
                    ) : audios.length === 0 ? (
                      <div className="mt-6 rounded-xl border border-dashed border-border/40 bg-background/40 p-8 text-center">
                        <Music className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No hay audios compartidos aún.</p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {audios.map((audio) => (
                          <div key={audio.path} className="rounded-xl border border-border/40 bg-gradient-to-r from-background/60 to-background/40 p-5 hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Music className="h-5 w-5 text-primary" />
                              </div>
                              <p className="font-semibold text-foreground truncate">{audio.name}</p>
                            </div>
                            <audio className="w-full h-10 rounded-lg" controls preload="none">
                              <source src={audio.url} />
                              Tu navegador no soporta el reproductor de audio.
                            </audio>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a href={audio.url} target="_blank" rel="noopener noreferrer" download={audio.name}>
                                <Button variant="outline" size="sm" className="gap-2 text-xs">
                                  <Download className="h-3 w-3" />
                                  Descargar
                                </Button>
                              </a>
                              {isAdmin && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-2 text-xs"
                                  onClick={() => handleAudioDelete(audio)}
                                  disabled={deletingAudioPath === audio.path}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {deletingAudioPath === audio.path ? "Eliminando..." : "Eliminar"}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>
      </PageGridBackground>
    </>
  );
};

export default Cancionero;
