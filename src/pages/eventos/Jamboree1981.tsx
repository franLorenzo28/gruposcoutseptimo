import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, MapPin, CalendarDays, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";

const Jamboree1981 = () => {
  const navigate = useNavigate();

  const participantes = [
    "Hebert Hernández",
    "Luis Lorenzo",
    "Ernesto Lorenzo",
    "Gualberto Rodríguez Toma",
    "Carlo Lorenzo",
    "Javier Lorenzo",
    "Pablo Ojeda",
    "Leonardo Correia",
    "Raúl Sola",
    "José Ibarra",
    "Jaime Fidalgo",
    "Alejandro Correia",
    "Marcel Barceló",
  ];

  return (
    <PageGridBackground>
      <section className="relative overflow-hidden pb-12 pt-24 sm:pt-28 md:pt-32">
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

            <h1 className="text-4xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              4º Jamboree Panamericano
              <span className="block text-primary">Porto Alegre, Brasil 1981</span>
            </h1>

            <div className="mt-8 flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Parque Saint Hilaire, Porto Alegre</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>17-21 de Enero 1981</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>13 participantes</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mb-20 max-w-2xl">
            <p className="text-xs text-primary font-semibold mb-2">Narrativa de</p>
            <h2 className="text-3xl font-bold mb-2">Hebert Hernández</h2>
            <p className="text-sm text-muted-foreground">Registrada el 16-21 de febrero de 2023</p>
          </Reveal>

          <div className="space-y-16 sm:space-y-20">
            <Reveal delay={0.1}>
              <div className="max-w-2xl">
                <p className="leading-relaxed text-xl">
                  Por mediados del mes de noviembre de 1980 se comenzó de lleno a trabajar en los preparativos para el Jamboree. Esto llevó a que los grupos y los distritos trabajaran en algunos proyectos que hicieran del adelanto parte de los preparativos.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Competencia de Pionerismo - Grupo 40</h3>
                <p className="leading-relaxed text-xl">
                  Uno de ellos, por el cual se obtenía puntuación era la 'Competencia de Pionerismo' del Grupo 40, de la cual, a falta de modestia, sería tema aparte para charlar y del cual el Grupo ganó con sus dos patrullas y con los máximos puntajes.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="border-t border-border/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Encuentro en Parque Roosevelt</h3>
                <p className="leading-relaxed text-xl">
                  Uno de los últimos desafíos fue un encuentro en el Parque Roosevelt en el cual también nos volvimos a destacar.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="border-t border-border/30 pt-10 max-w-2xl ml-auto pr-4 sm:pr-16">
                <h3 className="text-lg font-semibold text-foreground mb-4">Debates sobre Adelanto y Religión</h3>
                <p className="leading-relaxed text-xl">
                  Con respecto al adelanto y a la religión, puntos neurálgicos de nuestra generación en el Grupo, siempre tuvimos nuestros roces. Es allí que surgió por parte de Raúl Sola el tema de los 'Agnósticos'. Temas que me llevaron muchas veces a tener que vérmelas con Roberto Linn (de la ANBSU – Asociación Boy Scouts del Uruguay) y sus Scouters Colaboradores.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="border-t border-border/30 pt-10 max-w-xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Participación Ampliada</h3>
                <p className="leading-relaxed text-xl">
                  También asistieron grupos del Instituto Uruguayo de Escultismo (IUDE) y su Jefe Juan José Álvarez.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <div className="border-t border-border/30 pt-10 max-w-3xl ml-auto pr-4 sm:pr-8">
                <h3 className="text-lg font-semibold text-foreground mb-6">Delegación Participante</h3>
                <p className="leading-relaxed text-xl mb-6 text-muted-foreground">13 miembros participaron en esta histórica delegación</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {participantes.map((nombre) => (
                    <Badge key={nombre} variant="outline" className="bg-primary/5 text-primary border-primary/20 justify-center py-2">
                      {nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="border-t border-border/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">El Viaje</h3>
                <p className="leading-relaxed text-xl">
                  Con ellos, y el resto de la delegación (algunos padres tales como los Lorenzos), partió el ómnibus hacia Río Negro y después a la frontera para entrar luego en territorio brasileño y, desde allí, hasta Porto Alegre, al Parque Saint Hilaire.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="border-t border-primary/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Una Anécdota</h3>
                <p className="leading-relaxed text-xl text-muted-foreground italic">
                  El único problema que tuvimos fue que el guía de la Falken, Luis Lorenzo, se indispuso y lo tuvieron un día en observación.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageGridBackground>
  );
};

export default Jamboree1981;
