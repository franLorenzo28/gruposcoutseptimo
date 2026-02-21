import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { BookOpen, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Scoutpedia = () => {
  return (
    <div className="min-h-screen">
      <section className="pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                Archivo · Scoutpedia
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Scoutpedia
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              Aquí organizamos definiciones, términos y contenido enciclopédico
              del historial scout.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Sir Baden-Powell of Gilwell
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    1857–1941. Fundador de los Boy Scouts.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Vivió servicio militar activo en India y África antes de la
                    Guerra de los Boers en Sur África. Por su perpetuo trabajo
                    en la organización de los movimientos Boy Scouts y Girl
                    Scouts, recibió el título de “Sir” en 1929.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Sus publicaciones incluyen: “Escultismo Para Muchachos”
                    (“Scouting for Boys”, 1908), “Rovering to Success” (1922) y
                    “Scouting and Youth Movements” (1929).
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    A partir de la observación del juego, Robert Baden-Powell
                    descubre dos dinamismos propios de los jóvenes: la
                    pertenencia a pequeños grupos y la vida comunitaria. Cada
                    uno necesita de los demás para realizarse como persona. De
                    estas observaciones, deriva el Método Scout.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Roland Erasmus Philipps
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    1890–1916. Fue un político, militar y escritor británico que
                    colaboró con Robert Baden-Powell en los primeros años del
                    Movimiento Scout, desde su función como Comisionado Scout
                    de 1912 a 1914.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    En ese lapso escribió el libro “El Sistema de Patrullas”, que
                    se convirtió en un complemento de “Escultismo para muchachos”.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Sus ideas expuestas en “El Sistema de Patrullas” son
                    elementos básicos del Método Scout.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Rudyard Kipling
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Bombay, 1865 – Londres, 1936. Escritor británico.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Su padre, un experto en arte y artesanía indios, lo envió de
                    niño a Inglaterra para que se educara allá. En 1882, a los
                    16 años, se reunió con sus padres en Lahore y durante siete
                    años trabajó como periodista en la India.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    A los 25 años era ya un autor cotizado y también tema de
                    controversia entre los críticos. Después de un viaje en
                    derredor del mundo instaló su hogar en EE.UU., donde escribió
                    obras para niños y adultos.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Entre sus obras destacan “Libros de la selva” (1894-95),
                    “Capitanes intrépidos” (1897), “Stalky and Co.” (1899) y
                    “Kim” (1901). Fue el primer escritor británico en recibir el
                    Premio Nobel de Literatura en 1907.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    El Método Scout
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    El Método Scout propone vivir una aventura en pequeños
                    grupos a través del llamado “Sistema de Patrulla”. El
                    Sistema de Patrullas fue adoptado según las ideas propuestas
                    por Roland Erasmus Philipps.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    En esa pequeña comunidad a su medida cada joven aprende a
                    trabajar, a compartir y a relacionarse con los demás; asume
                    una responsabilidad al servicio del grupo y se confrontan
                    las experiencias vividas.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    El sentido de educar personas en relación con los demás es
                    que sean personas abiertas a vivir junto a otros y que, al
                    descubrir las riquezas de los demás, descubran sus propias
                    riquezas y carencias, construyendo su autoestima.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Cada pequeño grupo opera como un equipo. Dentro de cada
                    equipo, los jóvenes organizan su vida grupal y eligen,
                    organizan y llevan a cabo sus actividades. El sistema de
                    equipos (o sistema de patrulla) es la estructura organizativa
                    básica de una sección en un Grupo Scout.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    El Sistema de Patrullas
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Publicado por la Editorial Scout Interamericana. Edición 1977,
                    impreso en Costa Rica. 72 páginas. Está en buen estado.
                    En custodia por Leopoldo Lecour (ABR-2022).
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    El sistema de patrullas es un elemento del método scout ideado
                    por Roland Philipps como una forma de organización grupal.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Fue probado por primera vez en el movimiento scout por Robert
                    Baden-Powell y se mantiene vigente hasta la actualidad (2014).
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    El principal objetivo del sistema de patrullas es conceder una
                    verdadera responsabilidad al mayor número posible de muchachos.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Conduce a todos los integrantes de la patrulla a considerar que
                    tienen una responsabilidad definida con respecto al bienestar
                    general de su patrulla y de la tropa.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Generalmente agrupa a jóvenes en pequeños equipos de seis u ocho
                    muchachos, con un guía que coordina las actividades. El fin último
                    es el trabajo en equipo para el bienestar de cada miembro.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Escultismo para Muchachos
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Manual de instrucción en buena ciudadanía haciendo vida de campaña.
                    “Scouting for Boys: A Handbook for Instruction in Good Citizenship”,
                    publicado por primera vez en Londres en 1908.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Es el libro fundamental del Movimiento Scout, uno de los más
                    vendidos del siglo XX y de los más traducidos.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Dirigido directamente a los muchachos como actores de sus propias
                    actividades, llama a la responsabilidad, el valor de la familia
                    y el respeto por la naturaleza.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    “Yo me imagino que todo muchacho desea ayudar a su país de una u otra
                    manera. Un medio fácil de conseguirlo es hacerse scout.”
                    Sir Baden-Powell.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Los Primeros Cuatro Meses de una Tropa Scout
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Publicado por la Editorial Scout Interamericana. Segunda edición,
                    1981. Impreso en Costa Rica. 49 páginas. Está en buen estado.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Firmado por Patricia Lodigiani (7-SET-1987).
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    En custodia por Leopoldo Lecour (ABR-2022). Editor.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Manual para el Jefe de Tropa y sus Ayudantes
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Publicado por la Editorial Scout Interamericana. Cuarta edición,
                    noviembre 1981. Impreso en Costa Rica. 278 páginas.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Manual forrado en plástico transparente. Está en buen estado.
                    Firmado por Patricia Lodigiani (7-SET-1987).
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    En custodia por Leopoldo Lecour (ABR-2022). Editor.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    Manual para Scouts · Ciudadanos del Mañana
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Una guía para la diversión, la aventura y el servicio a la comunidad.
                    Publicado por la Editorial Scout Interamericana. Octava edición,
                    1973. Impreso en Costa Rica. 562 páginas.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Manual forrado en plástico transparente. No está en muy buen estado.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Entregado como premio a Miguel Alonso (patrulla BUFFEL),
                    ganadora de COMORISCO 1975. Donado por VCS (ANBSU) y firmado
                    por Josefina Hernán de Bordaberry. Sin fecha.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    En custodia por Leopoldo Lecour (ABR-2022). Editor.
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                    El Libro de la Selva
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Publicado en 1894 por Rudyard Kipling. Colección de historias
                    ambientadas en la selva india, con lecciones morales a través
                    de personajes antropomórficos.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Las historias de Mowgli en la manada de Seonee proveen la mística
                    usada con los lobatos. En la mística, sin nombrarlo nunca, un lobato
                    sería Mowgli.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Los “Bandar-Log” representan lo opuesto a los valores que la manada
                    de lobos enseña a Mowgli.
                  </p>
                  <div className="text-sm sm:text-base text-muted-foreground">
                    <p className="font-semibold mb-2">Nombres usados en la manada:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Akela</li>
                      <li>Lobo Gris</li>
                      <li>Baloo</li>
                      <li>Chil</li>
                      <li>Hathi</li>
                      <li>Bagheera</li>
                      <li>Raksha</li>
                      <li>Kaa</li>
                      <li>Riki Tiki Tavi</li>
                    </ul>
                    <p className="mt-3">
                      Mowgli y Shere-Khan no se usan en la mística de la manada de lobatos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                        ¿Querés sumar más material?
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Enviá material y lo incorporamos a la Scoutpedia.
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <Badge variant="outline" className="bg-muted/30 text-primary border-primary/30">
                          Estado: sección en crecimiento
                        </Badge>
                        <Link to="/contacto">
                          <Button size="sm" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Enviar material
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Scoutpedia;


