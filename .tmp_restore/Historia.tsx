// Navigation y Footer son globales en App.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Flame, Award, BookOpen } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Link } from "react-router-dom";

const Historia = () => {
  const locales = [
    {
      nombre: "Colegio Alemán",
      direccion: "Colegio Alemán",
      resumen:
        "Lugar de reunión fundacional: aquí se reunió el grupo hasta que se buscó nueva ubicación. En el Colegio Alemán, el grupo se reunió desde que se fundó hasta que nos pidieron que buscásemos nueva ubicación. Fue allí donde los padres de ese momento consiguieron la Elías Regules.",
      detalle: ` `,
    },
    {
      nombre: "Elías Regules",
      direccion: "Entrada por calle Bolivia, cerca de Parque Rivera",
      resumen:
        "Predio de la Sociedad Criolla donde construimos locales de patrullas y realizamos múltiples actividades.",
      detalle: `La Elías Regules era un lugar grandioso para nuestra actividad. Creo que fue la mejor época del Grupo Séptimo tal vez por eso éramos imbatibles e indomables. No sé qué tamaño tiene el terreno, pero calculo que estaría próximo a los 4000 m2 o más. Tiene un camino principal de tosca que llega hasta las construcciones en el centro del terreno. A mano izquierda había una plantación de árboles que llegaba hasta el final del terreno. En ese bosque trabajaban Helga Rauhut y Patricia Lodigiani con las Girl Scouts. A la derecha había un prolijísimo enjardinado y el edificio principal blanco con techo de quincho; detrás estaba el edificio accesorio asignado a nosotros para guardar el equipo. Cada patrulla tenía su espacio delimitado y estantes para guardar todo. Junto a este edificio hay un quincho grande y una lagunita afluente del lago del Parque Rivera. Ese entorno permitió prácticas de campo y construcciones como puentes colgantes y muchas otras actividades.`,
    },
    {
      nombre: "Gral. Paz y Rivera",
      direccion: "General Paz (cerca de Av. Bolivia)",
      resumen:
        "Terreno ubicado sobre General Paz que hoy ya no existe en su forma original.",
      detalle: ` `,
    },
    {
      nombre: "San Pedro",
      direccion:
        "Parroquia San Pedro Apóstol del Buceo  Leguizamón 3684, Montevideo",
      resumen:
        "Parroquia San Pedro Apóstol del Buceo, conocida como la 'iglesia' o 'capilla'.",
      detalle: `Parroquia San Pedro Apóstol del Buceo. Dirección: Leguizamón 3684, 11400 Montevideo. Comúnmente llamada 'iglesia', 'parroquia' o 'capilla'.`,
    },
    {
      nombre: "Tomás Gómez",
      direccion: "Tomás Gómez 3689",
      resumen:
        "Casa de Atilio Oliveri y punto de encuentro con caminatas hacia Fermín Ferreira.",
      detalle: `Tomás Gómez 3689. Casa de Atilio Oliveri y con largas caminatas hasta el ex Fermín Ferreira para encontrar un poco de verde.`,
    },
    {
      nombre: "Parque Rivera",
      direccion: "Parque Rivera",
      resumen:
        "Más que un 'local', fue el lugar principal de actividad y depósito en distintos periodos.",
      detalle: `Hubo una conversación editorial (28-ABR-2023) sobre si considerar Parque Rivera como 'local'. Roberto Lodigiani y Mario Clara coincidieron en que no era un local en el sentido tradicional, sino el espacio donde se realizaban actividades y se guardaba material en un depósito o 'tapera'. Fechas aproximadas de uso: 1972-73, con referencias puntuales en 16-ABR-1973.`,
    },
    {
      nombre: "El Cilindro",
      direccion: "Bajo el tanque de agua del complejo habitacional 4 del BHU",
      resumen: "Lugar donde se realizó un Am Lagerfeuer el 7/JUL/1978.",
      detalle: `Bajo el tanque de agua del complejo habitacional 4 del BHU. Am Lagerfeuer 7/JUL/1978. Referencia: Miguel Testoni.`,
    },
    {
      nombre: "Complejo Habitacional Centenario 4",
      direccion: "Centenario (Dámaso Larrañaga)",
      resumen:
        "Conocido como Centenario o Dámaso Larrañaga según la generación.",
      detalle: `Centenario para los más viejos, Dámaso Larrañaga para los jóvenes. Un local en el periodo del Complejo Habitacional.`,
    },
    {
      nombre: "El Tajamar",
      direccion: "Lieja 6416  Parque Julio César Grauert, Carrasco",
      resumen:
        "Uno de los locales más importantes: construido en 1942, reunió al grupo bajo techo por muchos años.",
      detalle: `El Tajamar (Lieja 6416) en el Parque Julio César Grauert, Carrasco. Diseñado por el Arq. Juan A. Scasso e inaugurado en 1942; reciclado en 1991 por la Intendencia. Durante ese periodo tuvimos tres 'locales' (parque al lado de CONAPROLE, El Tajamar, y parque atrás del Lawn Tennis). El Tajamar fue el más importante porque permitió reunir al grupo bajo su techo por muchos años. Tras dejar el Tajamar nos reuníamos detrás del Lawn Tennis y luego en otros lugares.`,
    },
    {
      nombre: "Locales Avenida Bolivia",
      direccion: "Avenida Bolivia (varios lugares)",
      resumen:
        "Periodo con uso de contenedor y actividades en terrenos y clubes cercanos.",
      detalle: `Mientras estábamos en el Tajamar, el grupo instaló un contenedor en el fondo del local de David (OCT79). En 1986 dejamos el Tajamar; en 1990 se deja el local y se sigue en el fondo; en 1993 se empezaron actividades en el terreno de al lado (BCU) y luego en el club Fermín Ferreira. En 1997 nos mudamos al local Volteadores.`,
    },
    {
      nombre: "Volteadores",
      direccion: "Volteadores 1753  Capilla San Jerónimo, Malvín",
      resumen:
        "Capilla San Jerónimo; uso del Parque Baroffio para actividades al aire libre.",
      detalle: `Capilla San Jerónimo. Dirección: Volteadores 1753, Malvín, Montevideo. El Grupo utiliza el Parque Baroffio para actividades al aire libre.`,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 bg-background/60 backdrop-blur-sm">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-80 h-80 bg-muted/30 -top-20 -right-16 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-12 drift-slow" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                Más de 60 años de trayectoria
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6">
              Nuestra Historia
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Desde 1964 formando jóvenes con valores scout. Un recorrido desde el Colegio Alemán hasta nuestros locales actuales, manteniendo viva la llama del escultismo.
            </p>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
              <Card className="text-center card-hover bg-background/70 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">1964</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Año de fundación</p>
                </CardContent>
              </Card>
              <Card className="text-center card-hover bg-background/70 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">11</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Locales históricos</p>
                </CardContent>
              </Card>
              <Card className="text-center card-hover bg-background/70 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">60+</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Años de servicio</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("nacimiento")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Nacimiento
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("locales")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Locales
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("tradiciones")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Tradiciones
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Nacimiento del grupo */}
      <section id="nacimiento" className="py-8 sm:py-12 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <Card className="card-hover border-2 border-primary/20 shadow-xl bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted/30 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                          Nacimiento del Grupo
                        </h2>
                        <Badge variant="outline" className="bg-muted/30 text-primary border-primary/30">
                          1964
                        </Badge>
                      </div>
                      <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
                        Nuestro grupo nació en el{" "}
                        <strong className="text-primary">Colegio Alemán en 1964</strong>, cuando un
                        pequeño grupo de jóvenes y guías se reunió con la
                        intención de formar un espacio de encuentro y formación
                        scout.
                      </p>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        Desde esos primeros pasos hemos crecido manteniendo los
                        valores fundacionales y adaptándonos a nuevas
                        generaciones, siempre fieles al espíritu scout.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Locales Section */}
      <section id="locales" className="py-12 sm:py-16 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 shadow-sm">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                  Nuestros Locales
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Un Recorrido por Nuestros Espacios
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Desde 1964 hemos transitado por diversos locales, cada uno con
                su historia y aportes a la formación de generaciones de scouts.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {locales.map((local, index) => (
                <Reveal key={index}>
                  <Card className="card-hover h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 group bg-background/70 backdrop-blur-sm">
                    <div className="h-2 bg-foreground/10"></div>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg sm:text-xl mb-1 group-hover:text-primary transition-colors">
                            {local.nombre}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {local.direccion}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {local.resumen}
                      </p>
                      <details className="text-sm text-muted-foreground">
                        <summary className="cursor-pointer text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-2">
                          <span>Ver detalles</span>
                          <Award className="w-4 h-4" />
                        </summary>
                        <div className="mt-3 pt-3 border-t border-primary/20 whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                          {local.detalle}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Acontecimientos importantes y Tradiciones */}
      <section id="tradiciones" className="py-12 sm:py-16 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Acontecimientos importantes */}
            <Reveal>
              <Card className="card-hover border-2 hover:border-primary/50 transition-all duration-500 bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Acontecimientos Importantes
                    </h2>
                  </div>
                  <ul className="space-y-4 text-sm sm:text-base text-muted-foreground">
                    <li className="flex gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <Badge variant="outline" className="text-primary border-primary/30 bg-muted/30 h-fit">
                        2004
                      </Badge>
                      <span className="flex-1">
                        Creación de BAUEN, la competencia nacional organizada
                        por nuestro grupo.
                      </span>
                    </li>
                    <li className="flex gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <Badge variant="outline" className="text-primary border-primary/30 bg-muted/30 h-fit">
                        2014
                      </Badge>
                      <span className="flex-1">Aniversario y celebración de los 50 años del Grupo Séptimo.</span>
                    </li>
                    <li className="flex gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <Badge variant="outline" className="text-primary border-primary/30 bg-muted/30 h-fit">
                        2025
                      </Badge>
                      <span className="flex-1">
                        Participación en JOTA-JOTI y colaboración con Grupo de
                        Coleccionistas Scouts.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Reveal>

            {/* Am Lagerfeuers */}
            <Reveal>
              <Card className="card-hover border-2 hover:border-primary/50 transition-all duration-500 bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center shadow-lg">
                      <Flame className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Am Lagerfeuer
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                    Nuestra tradición de reuniones nocturnas alrededor del
                    fuego: cantos, historias y reflexión. "Am Lagerfeuer" resume
                    la esencia del compañerismo scout.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                    Eventos periódicos en el campo de campamento donde
                    compartimos experiencias y fortalecemos lazos.
                  </p>
                  <Link to="/am-lagerfeuer">
                    <Button className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <Flame className="w-4 h-4" />
                      Ver Repositorio
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>

            {/* Línea del Tiempo */}
            <Reveal>
              <Card className="card-hover border-2 hover:border-primary/50 transition-all duration-500 bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Línea del Tiempo
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                    Explorá nuestra historia cronológica desde 1964 hasta hoy.
                    Un recorrido visual por los momentos más importantes del grupo.
                  </p>
                  <Link to="/linea-temporal">
                    <Button className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <Calendar className="w-4 h-4" />
                      Ver Línea del Tiempo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer global en App.tsx */}
    </div>
  );
};

export default Historia;





