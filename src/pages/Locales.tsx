import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Compass } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type Local = {
  id: string;
  nombre: string;
  direccion: string;
  periodo?: string;
  descripcion: string;
  hitos?: string[];
  referencia?: string;
};

const LOCALES: Local[] = [
  {
    id: "colegio-aleman",
    nombre: "Colegio Aleman",
    direccion: "Montevideo, Uruguay",
    periodo: "1964 - 1965 aprox.",
    descripcion:
      "Lugar de reunion desde la fundacion del grupo hasta la busqueda de una nueva ubicacion.",
    hitos: [
      "Etapa inicial de funcionamiento del Grupo Septimo",
      "Transicion posterior hacia Elias Regules",
    ],
    referencia: "Javier Barreneche, 24-SEP-2002",
  },
  {
    id: "elias-regules",
    nombre: "Elias Regules",
    direccion: "Zona del Parque Rivera, Montevideo",
    periodo: "Decadas de 1970 y 1980",
    descripcion:
      "Espacio de larga permanencia y crecimiento, asociado a una etapa de fuerte actividad del grupo.",
    hitos: [
      "Construccion de locales de patrulla",
      "Uso de banos y espacios de apoyo",
      "Actividades en zonas de bosque y campo",
    ],
    referencia: "Testimonios historicos del grupo",
  },
  {
    id: "gral-paz-rivera",
    nombre: "Gral. Paz y Rivera",
    direccion: "Entorno de General Paz y Rivera, Montevideo",
    periodo: "Referencia historica anterior a 1972",
    descripcion:
      "Referencia de terreno familiar y de apoyo logistico en una etapa temprana de traslado y reorganizacion.",
    referencia: "Javier Barreneche, 19-SEP-2022; Ruben D'Acosta, SEP-2022",
  },
  {
    id: "tomas-gomez",
    nombre: "Tomas Gomez",
    direccion: "Tomas Gomez 3689, Montevideo",
    periodo: "2022 (referencia documental)",
    descripcion:
      "Punto de memoria para reconstruir recorridos de reuniones y caminatas hacia espacios verdes del entorno.",
    referencia: "Hebert Hernandez, 2-ENE-2022",
  },
  {
    id: "tajamar",
    nombre: "El Tajamar",
    direccion: "Liga 6416, Parque Julio Cesar Grunert, Carrasco, Montevideo",
    periodo: "1970s - 1990s",
    descripcion:
      "Espacio historico de uso extendido para actividades del grupo y base de varias transiciones hacia locales posteriores.",
    hitos: [
      "Instalacion de contenedor en etapa de Avenida Bolivia",
      "Actividades de intemperie y uso de parque",
      "Referencia recurrente en testimonios de ex integrantes",
    ],
    referencia: "Carlos Pascual T.M.M., 22-MAR-2022; Editor, 25-MAR-2024",
  },
  {
    id: "cilindro",
    nombre: "El Cilindro",
    direccion: "Bajo tanque de agua del complejo habitacional del BHU, Montevideo",
    periodo: "1978 - 1983 (referencias)",
    descripcion:
      "Ubicacion asociada a actividades juveniles y de formacion en una etapa puntual del grupo.",
    referencia: "Miguel Tastoni, Ana Lagerbauer, Editor",
  },
  {
    id: "parque-rivera",
    nombre: "Parque Rivera",
    direccion: "Parque Rivera, Montevideo",
    periodo: "1972 - 1973",
    descripcion:
      "Espacio de actividades y debate historico sobre su condicion como local, con registros de entrevistas y memoria oral.",
    referencia: "Conversacion documentada, 28-ABR-2023",
  },
  {
    id: "terreno-david",
    nombre: "Terreno de David",
    direccion: "Av. Bolivia (numeracion historica 2294), Carrasco Norte",
    periodo: "1979 - 1993",
    descripcion:
      "Terreno de referencia para reuniones y armado de rancho/local en una etapa de crecimiento logístico.",
    hitos: [
      "Llegada a Avenida Bolivia en octubre de 1979",
      "Funcionamiento compartido con etapa del Tajamar",
      "Inicio de uso de local recibido hacia finales de los 80",
    ],
    referencia: "David Pinelli, 21-MAR-2022",
  },
  {
    id: "baldio-banco-central",
    nombre: "Baldio Banco Central",
    direccion: "Av. Bolivia 2282, Carrasco Norte",
    periodo: "Desde 1993 (referencias)",
    descripcion:
      "Terreno utilizado para actividades y obras de acondicionamiento comunitario en continuidad con la etapa de Avenida Bolivia.",
    hitos: [
      "Gestion de permisos de uso precario",
      "Cierre perimetral y mejoras de infraestructura",
      "Transicion entre Terreno de David y Club Juan Ferreira",
    ],
    referencia: "David Pinelli, 27-ABR-2023 y 28-MAY-2022",
  },
  {
    id: "club-juan-ferreira",
    nombre: "Club Juan Ferreira",
    direccion: "Av. Bolivia 2278, Carrasco Norte",
    periodo: "1995 en adelante",
    descripcion:
      "Club social y deportivo asociado a reuniones, guardado de materiales y actividades de patrulla.",
    hitos: [
      "Espacio para cajones de patrulla y almacenamiento",
      "Uso de banos y techo para dias de lluvia",
      "Convivencia de actividades con equipos juveniles",
    ],
    referencia: "David Pinelli, 28-MAY-2022; Ignacio Andreatta y Adrian Hein, 21-MAR-2022",
  },
  {
    id: "volteadores",
    nombre: "Volteadores",
    direccion: "Volteadores 1753, Punta Gorda",
    periodo: "Actualidad",
    descripcion:
      "Ubicacion identificada como sede actual del grupo y punto de encuentro para reuniones y propuestas educativas.",
    hitos: [
      "Vinculo directo con el Parque Baroffio para actividades al aire libre",
      "Consolidacion como sede de referencia contemporanea",
    ],
    referencia: "Registro institucional actual",
  },
];

const Locales = () => {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              Espacios del grupo
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl md:text-7xl">
              Locales
              <span className="block text-primary">y sedes</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Recorrido por sedes historicas y actuales donde el Grupo Septimo desarrolla su vida scout.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-5 md:grid-cols-3">
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <Building2 className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{LOCALES.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sedes registradas</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <MapPin className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{LOCALES.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Direcciones cargadas</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <Compass className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{LOCALES.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descripciones listas</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {LOCALES.length === 0 ? (
            <Reveal>
              <Card className="mt-8 border border-dashed border-primary/35 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                    Pendiente de importacion
                  </Badge>
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    Esta pagina mostrara nombre, direccion y descripcion de cada sede cuando integremos el contenido de la wiki.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {LOCALES.map((local) => (
                <Reveal key={local.id}>
                  <Card className="h-full border-border/70 bg-card/85 shadow-md">
                    <CardContent className="p-5">
                      <h2 className="text-xl font-bold">{local.nombre}</h2>
                      <p className="mt-2 text-sm font-semibold text-primary">{local.direccion}</p>
                      {local.periodo && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {local.periodo}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-muted-foreground">{local.descripcion}</p>
                      {local.hitos && local.hitos.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                          {local.hitos.map((hito) => (
                            <li key={hito} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span>{hito}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {local.referencia && (
                        <p className="mt-4 text-[11px] text-muted-foreground/80 italic">
                          Fuente: {local.referencia}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Locales;
