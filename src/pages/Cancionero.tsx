import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Footprints, BookOpen, Upload, Download, Trash2 } from "lucide-react";
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

type EntryItem = {
  id: string;
  titulo: string;
  descripcion: string;
};

type ArchiveMusicSection = {
  id: "canciones" | "danzas";
  titulo: string;
  subtitulo: string;
  descripcion: string;
  Icon: typeof Music;
  registrosHistoricos?: Array<{
    id: string;
    titulo: string;
    letra?: string;
    notas: string[];
    credito: string;
  }>;
  testimonio?: {
    titulo: string;
    cita: string;
    contexto: string;
    autor: string;
    fecha: string;
  };
  items: EntryItem[];
};

const MUSIC_SECTIONS: ArchiveMusicSection[] = [
  {
    id: "canciones",
    titulo: "Canciones",
    subtitulo: "Archivo de cantos scout",
    descripcion:
      "Repertorio para fogon, marcha y momentos comunitarios. Esta seccion queda lista para crecer con nuevas letras y contexto historico.",
    Icon: BookOpen,
    registrosHistoricos: [
      {
        id: "animas-i",
        titulo: "Animas I",
        letra:
          "Oh ven a acampar\ndeja tras ti el dolor\ny las penas deja tras de ti\npues junto al fogon\nhallaras el amor\nde la naturaleza sin par.\n\nOh! ven a acampar\ndeja tras ti la enorme ciudad\ny ven a admirar la salvaje beldad\nde la naturaleza sin fin.\n\nCon el crepitar\ndel ardiente fogon\ny la noche que cae sobre ti\nel fresco verdor de la vegetacion\nte dara deseos de vivir.\n\nOh! ven a acampar\ndeja tras ti la enorme ciudad\ny ven a admirar la salvaje beldad\nde la naturaleza sin fin.",
        notas: [
          "Musica/Tonada: Home on the Range.",
          "Home on the Range es el himno del estado estadounidense de Kansas.",
          "El Dr. Brewster M. Higley (1823-1911) originalmente escribio la letra en un poema titulado 'My Western Home' a principios de la decada de 1870.",
          "La musica fue compuesta por un amigo de Higley llamado Daniel E. Kelley.",
          "La cancion fue adoptada por colonos, vaqueros y otros, y difundida a traves de los Estados Unidos de diversas maneras.",
          "Canción tradicional Grupo 7º.",
          "Letra/Adaptacion: Diego (Büffel) Pose (1966)",
          "Ánimas I fue en el campamento del águila en lo de los Clement. Ricardo Hein. 30-JUL-2022",
          "En agosto de 2013 Leopoldo preguntó por las canciones, yo no me acordaba de las últimas estrofas del A.II, le pedimos ayuda al autor y aquí copio de su mail original. Ricardo Hein. 30-JUL-2022",
        ],
        credito: "Registro y memoria oral: Ricardo Hein (30-JUL-2022).",
      },
      {
        id: "animas-ii",
        titulo: "Animas II",
        letra:
          "Bajo el cielo estrellado el follaje\ny los arboles susurran ya\nun mensaje de paz infinita\noh, que bueno es el ir a acampar!\n\nUn buen fuego una olla colgada\nla comida muy pronto estara\nvengan todos vamos disfrutemos\noh, que bueno es el ir a acampar!\n\nAunque lluevan diez dias seguidos\neso no nos desanimara\nvengan todos, vamos disfrutemos\noh que bueno es el ir a acampar\n\nCulminando el fin de semana\nun pie tierno su promesa hara\njuntos todos en la ceremonia\nviviremos nuestro ideal!",
        notas: [
          "Musica/Tonada: Red River Valley.",
        ],
        credito: "Cancion tradicional del Grupo 7o.",
      },
    ],
    items: [],
  },
  {
    id: "danzas",
    titulo: "Danzas",
    subtitulo: "Archivo de dinamicas y rondas",
    descripcion:
      "Espacio para danzas, rondas y movimientos tradicionales. Ideal para actividades de unidad y encuentros especiales.",
    Icon: Footprints,
    testimonio: {
      titulo: "Cheki, Cheki",
      cita: "Yo fui a California, a ver a un amigo, y lo encontre bailando, bailando el Cheki-Cheki.",
      contexto:
        "Cuando regreso de Panama en 1970, Stefan trajo canciones y danzas aprendidas con el grupo Scout de Panama, que habia reflotado tras un periodo de abandono.",
      autor: "Stefan Pallozzi",
      fecha: "13-DIC-2022",
    },
    items: [],
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

  const cancionesRepositorio =
    MUSIC_SECTIONS.find((section) => section.id === "canciones")?.registrosHistoricos ?? [];

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
              <span className="block text-primary">del Grupo Septimo</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Seccion renovada del archivo musical: ahora organizada en dos bloques claros para facilitar carga y navegacion de contenido.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {MUSIC_SECTIONS.map((section, sectionIndex) => {
              const Icon = section.Icon;
              return (
                <Reveal key={section.id} delay={sectionIndex * 0.08}>
                  <Card className="h-full border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6 md:p-8">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <h2 className="text-3xl font-bold">{section.titulo}</h2>
                          <p className="mt-2 text-sm font-medium text-primary/70">{section.subtitulo}</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs">
                          {section.items.length > 0 ? `${section.items.length} temas` : "En crecimiento"}
                        </Badge>
                      </div>

                      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                        {section.descripcion}
                      </p>

                      {section.testimonio ? (
                        <div className="mb-6 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/8 to-accent/5 p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
                            ✨ {section.testimonio.titulo}</p>
                          <p className="mt-3 text-sm italic leading-relaxed text-foreground/90">
                            "{section.testimonio.cita}"
                          </p>
                          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {section.testimonio.contexto}
                          </p>
                          <p className="mt-3 text-xs font-semibold text-muted-foreground">
                            — {section.testimonio.autor} · {section.testimonio.fecha}
                          </p>
                        </div>
                      ) : null}

                      {section.registrosHistoricos?.length ? (
                        <div className="mb-6 space-y-4">
                          {section.registrosHistoricos.map((registro) => (
                            <div key={registro.id} className="rounded-lg border border-border/50 bg-gradient-to-br from-background/80 to-background/60 p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Music className="h-4 w-4 text-primary" />
                                <p className="text-lg font-bold text-foreground">{registro.titulo}</p>
                              </div>
                              {registro.letra ? (
                                <pre className="mt-4 bg-background/50 rounded p-4 text-xs leading-relaxed text-foreground/80 overflow-x-auto border border-border/30">
                                  {registro.letra}
                                </pre>
                              ) : null}
                              <div className="mt-4 space-y-1.5 pb-3 border-b border-border/30">
                                {registro.notas.map((nota, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
                                    • {nota}
                                  </p>
                                ))}
                              </div>
                              <p className="mt-3 text-xs font-medium text-primary/70">{registro.credito}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border/40 bg-gradient-to-r from-background/60 to-background/40 p-4 hover:bg-background/80 hover:border-primary/20 transition-all duration-200">
                            <p className="font-semibold text-foreground">{item.titulo}</p>
                            <p className="mt-1.5 text-sm text-muted-foreground">{item.descripcion}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12">
            <Reveal>
              <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/80 shadow-xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Music className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">Repositorio de canciones</h2>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                        Registro centralizado de canciones, audios y materiales del Grupo Septimo. Los administradores pueden compartir archivos de audio.
                      </p>
                    </div>
                    {isAdmin ? (
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
                    ) : null}
                  </div>

                  {cancionesRepositorio.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-border/40 bg-background/40 p-6 text-center">
                      <Music className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Aún no hay canciones cargadas.</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {cancionesRepositorio.map((cancion) => (
                        <div key={cancion.id} className="rounded-lg border border-border/40 bg-gradient-to-r from-background/50 to-background/30 p-4 hover:bg-background/60 transition-colors">
                          <p className="font-semibold text-foreground">{cancion.titulo}</p>
                          <p className="mt-1.5 text-xs text-muted-foreground">{cancion.credito}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-10 pt-8 border-t border-border/30">
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      🎵 Audios subidos
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">Archivos de audio compartidos para el grupo</p>
                    {loadingAudios ? (
                      <p className="mt-4 text-sm text-muted-foreground">Cargando audios...</p>
                    ) : audios.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-border/40 bg-background/40 p-6 text-center">
                        <Music className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No hay audios compartidos aún.</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
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
                              {isAdmin ? (
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
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
