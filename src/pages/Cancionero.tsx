import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, Upload, Download, Trash2, ChevronDown, Play, Info, FileText, Volume2, Disc3 } from "lucide-react";
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

  useEffect(() => {
    loadAudios();
    checkAdmin();
  }, []);

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

  return (
<PageGridBackground>
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <Music className="h-4 w-4 text-primary" />
              Archivo musical scout
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              Cancionero
              <span className="block text-primary">del Grupo Séptimo</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Canciones y danzas tradicionales del Grupo Scout Séptimo. Explora cada sección para ver letras, notas y más.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-8">
            {/* Canciones */}
            <Reveal>
              <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
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
                          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/50 bg-gradient-to-r from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 hover:border-primary/30 transition-all duration-200 text-left">
                            <span className="font-semibold text-lg">{cancion.titulo}</span>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openCanciones.includes(cancion.id) ? "rotate-180" : ""}`} />
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
                                <button className="w-full flex items-center justify-between p-3 rounded-md border border-border/40 bg-background/50 hover:bg-background/80 hover:border-primary/20 transition-all duration-200 text-left ml-2">
                                  <span className="font-medium">{registro.titulo}</span>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedRegistro === registro.id ? "rotate-180" : ""}`} />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2 ml-4 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <FileText className="h-3 w-3" />
                                    Letra
                                  </Button>
                                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <Info className="h-3 w-3" />
                                    Info
                                  </Button>
                                  {registro.audioFile && (
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                      <Play className="h-3 w-3" />
                                      Audio
                                    </Button>
                                  )}
                                </div>
                                {registro.letra && (
                                  <pre className="bg-background/50 rounded p-4 text-xs leading-relaxed text-foreground/80 overflow-x-auto border border-border/30 whitespace-pre-wrap font-mono">
{registro.letra}
                                  </pre>
                                )}
                                <div className="space-y-1 pb-2 border-b border-border/30">
                                  {registro.notas.map((nota, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">
                                      • {nota}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs font-medium text-primary/70">{registro.credito}</p>
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
              <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-primary/10">
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
                          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/50 bg-gradient-to-r from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 hover:border-accent/30 transition-all duration-200 text-left">
                            <span className="font-semibold text-lg">{danza.titulo}</span>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openDanzas.includes(danza.id) ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          <p className="text-sm text-muted-foreground">{danza.descripcion}</p>
                          {danza.origen && (
                            <p className="text-xs text-primary/70">Origen: {danza.origen}</p>
                          )}
                          {danza.pasos && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-2">Pasos:</p>
                              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                                {danza.pasos.map((paso, idx) => (
                                  <li key={idx}>{paso}</li>
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

          <div className="mt-12">
            <Reveal>
              <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl">
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
                    <p className="mt-4 text-sm text-muted-foreground">Cargando audios...</p>
                  ) : audios.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-border/40 bg-background/40 p-6 text-center">
                      <Music className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No hay audios compartidos aún.</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {audios.map((audio) => (
                        <div key={audio.path} className="rounded-lg border border-border/40 bg-gradient-to-r from-background/60 to-background/40 p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <Music className="h-5 w-5 text-primary flex-shrink-0" />
                            <p className="font-semibold text-foreground truncate">{audio.name}</p>
                          </div>
                          <audio className="mt-4 w-full h-8" controls preload="none">
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
  );
};

export default Cancionero;
