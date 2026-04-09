import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, MapPin, CalendarDays, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";

const Jamboree2023 = () => {
  const navigate = useNavigate();

  const roversContingente = [
    "Lucía Chaves",
    "Florencia Lorenzo",
    "Rocío Correa",
    "Thais Da Silva (ALQUIMIA-MSU)",
    "Natalia Santana",
    "Belén García",
    "Ernesto Sosa",
    "Pablo Silva",
    "Joaquín Peña",
  ];

  return (
    <div className="min-h-screen page-animate relative bg-gradient-to-br from-background via-background to-muted/40">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_150%_150%_at_50%_0%,var(--color-primary)_0%,transparent_50%)] opacity-5 pointer-events-none" />
      <div className="relative z-10">
      <section className="relative overflow-hidden pb-8 pt-24 sm:pt-28 md:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/eventos/jamborees")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Jamborees
          </Button>

          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              Narrativa Histórica
            </div>

            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-5xl md:text-6xl">
              Jamboree Sudamericano
              <span className="block text-primary">Paso de los Libres, Argentina 2023</span>
            </h1>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Paso de los Libres, Corrientes</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>17-21 de Febrero 2023</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Rovers y Pioneros</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Reveal className="mb-16">
              <p className="text-xs text-primary font-semibold mb-2">Narrativa de</p>
              <h2 className="text-3xl font-bold mb-2">Múltiples Perspectivas</h2>
              <p className="text-sm text-muted-foreground">Documentado por Pablo Silva, Hebert Hernández, Agustín Bolioli y otros participantes • Febrero-Junio 2023</p>
            </Reveal>

            <div className="space-y-16 sm:space-y-20 text-muted-foreground">
            <Reveal delay={0.1}>
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Primer Contingente - Rovers</h3>
                <p className="leading-relaxed text-xl mb-6">
                  En la noche del 10 de febrero partieron los Rovers para Corrientes Argentina a participar del Jamboree Sudamericano 2023.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {roversContingente.map((nombre) => (
                    <Badge key={nombre} variant="outline" className="bg-primary/5 text-primary border-primary/20 justify-center py-2">
                      {nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Días Previos al Evento</h3>
                <p className="leading-relaxed text-xl">
                  En estos días previos al comienzo del evento los Rovers acampamos junto al Grupo Scout 217 Fuerte Mafeking de Sayago, el Clan de Pioneros de Scouts Marinos Nº27 y Juan Bonmesadri Nº996. En el predio también se encontraban algunos Grupos scouts de Argentina ya acampando junto a nosotros. Particularmente fraternizamos mucho con un grupo de Mendoza Argentina quienes desde un primer momento compartimos casi todas nuestras intactas previas al jamboree, intercambiando experiencias, comidas, metodologías, juegos y charlas eternas.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="border-t border-red-500/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Condiciones Climáticas Extremas</h3>
                <p className="leading-relaxed text-xl">
                  Los primeros 5 días fueron difíciles dado las altas temperaturas llegando a los 48 grados de sensación térmica. Esto nos permitía dormir únicamente 3 o 4 horas por día debido al agobiante calor. Luego y gracias a un par de tormentas el clima fue bajando su temperatura haciendo el evento mucho más agradable y disfrutable.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="border-t border-border/30 pt-10 max-w-2xl ml-auto pr-4 sm:pr-16">
                <h3 className="text-lg font-semibold text-foreground mb-4">Segundo Contingente - Pioneros</h3>
                <p className="leading-relaxed text-xl">
                  El 17 de febrero y fecha de comienzo del Jamboree arribaron al predio nuestro segundo contingente de Grupo con 16 Pioneros, 3 dirigentes y 2 de equipo de servicio (Dirigente y Comité de Padres). Nos encontramos con mucha alegría de encontrarnos juntos en un evento internacional.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="border-t border-orange-500/30 pt-10 max-w-3xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Desafíos Organizacionales Sin Precedentes</h3>
                <p className="leading-relaxed text-xl mb-4">
                  El jamboree, desde el punto de vista organizacional, infraestructura y de programa fue un desastre y para el olvido. Días sin agua, sin duchas, sin baños. Sin materiales para las actividades, problemas graves de seguridad, etc, etc, y muchos etcéteras.
                </p>
                <p className="leading-relaxed text-xl italic text-primary">
                  Pero como el Scout ríe y canta en sus dificultades nada de eso nos detuvo para pasarla bien durante el evento.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Experiencias y Aprendizajes</h3>
                <p className="leading-relaxed text-xl">
                  Gracias a la gran voluntad y entrega de los participantes, así como de los educadores responsables de cada Grupo, pudimos hacer de esta oportunidad un momento inolvidable para todos. Conocimos muchas formas de hacer escultismo, muchas maneras de llegar a un mismo objetivo, diferentes maneras de aprender jugando, actividades, danzas, canciones, personas inolvidables, comidas típicas, diversidad de uniformes y formas de metodología scout, fogones, espectáculos, competencias y muchísimas cosas más.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="border-t border-blue-500/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Actividades Destacadas</h3>
                <p className="leading-relaxed text-xl">
                  Beatriz Leiro ofreció un taller sobre "Legado y Patrimonio Scout" durante el jamboree, compartiendo conocimiento sobre la importancia de preservar la historia scout. Se realizaron actividades variadas, competencias entre grupos, fogones con múltiples nacionalidades, y encuentros culturales que enriquecieron la experiencia de todos los participantes.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="border-t border-primary/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-16">
                <h3 className="text-lg font-semibold text-foreground mb-4">Reflexión Personal - Pablo Silva (Marzo 2023)</h3>
                <p className="leading-relaxed text-xl mb-4">
                  Como puntos personales a destacar, me permitió volver a un evento de este tipo como Educador Responsable luego del Jamboree Mundial del 99' en Chile como responsable de contingente. Por otra parte fue una excelente oportunidad para recolectar muchísimas pañoletas para recuperar la colección de las mismas que el grupo tenía en su momento.
                </p>
                <p className="leading-relaxed text-xl italic font-semibold text-foreground">
                  Y por último me permitió compartir con mi hija (Belén Silva - Pionera) un jamboree.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="border-t border-border/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">El Regreso</h3>
                <p className="leading-relaxed text-xl mb-4">
                  Aparentemente el regreso no tuvo sobresaltos porque aparecieron en el local de Grupo. Se recibieron con mucho cariño y se compartieron historias de todo lo vivido.
                </p>
                <p className="text-xl italic text-muted-foreground">
                  "El saldo fue altamente positivo y nos deja gusto a poco y las ganas de volver a tener una oportunidad así en el futuro." - Documento oficial
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.55}>
              <div className="border-t border-primary/30 pt-10 max-w-2xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Galería Fotográfica Completa</h3>
                <p className="leading-relaxed text-xl mb-6">
                  Más de 30 fotografías oficiales documentan la experiencia, desde la llegada hasta los momentos finales.
                </p>
                <a
                  href="https://historial-scouts7montevideo.org/DokuWiki/doku.php?id=wikihistorial7o:narrativas:jamboree_sudamericano_2023"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  Ver galería <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Jamboree2023;
