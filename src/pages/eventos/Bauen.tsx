import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flag,
  Calendar,
  Phone,
  Users,
  Timer,
  ArrowRight,
  Camera,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";

const Bauen = () => {
  const actividades = [
    { nombre: "Pionerismo", icon: "🏗️" },
    { nombre: "Cabullería", icon: "🪢" },
    { nombre: "Cocina", icon: "🔥" },
  ];

  const ramas = [
    {
      nombre: "La Manada",
      color: "#FEB21A",
      duracion: "1 día",
       descripcion: "En la Manada se realizan construcciones de cubiles. Esta se desarrolla en una sola jornada donde deben presentar sus construcciones dentro de un recinto delimitado. Cada cubil representa a un personaje del Libro de la Selva, elegido por cada seisena, y la elección no puede repetirse dentro del mismo Grupo Scout. Con esta propuesta se busca que exploren y se sumerjan en el mundo de las Tierras Vírgenes durante la actividad. Es una actividad familiar que los Lobatos disfrutan mucho, así como sus familias y amigos.",
    },
    {
      nombre: "Unidad Scout / Tropa",
      color: "#344F1F",
      duracion: "2 días",
       descripcion: "Es uno de los platos fuertes del evento, ya que nuclea la mayor cantidad de participantes. Actualmente participan más de 25 patrullas en competencias de construcción de rincones de patrulla y cocina con fuego. En esta unidad se ve en tiempo real todo lo aprendido en su vida scout y su aplicación práctica: cabullería, amarres, pionerismo, campismo, cocina, armado de toldos, mesas y bancos, además del cuidado y la limpieza del rincón.",
    },
    {
      nombre: "Pioneros",
      color: "#134686",
      duracion: "2 días",
       descripcion: "Se ha transformado en una de las actividades más atractivas del segundo día. La construcción de trebuchet aplica cabullería de forma más compleja, con precisión, técnica y roles claros dentro del equipo. Además, se realiza una cena medieval en la noche y, al día siguiente, una instancia lúdica con pruebas temáticas antes de la competencia principal.",
    },
    {
      nombre: "Rovers",
      color: "#DD0303",
      duracion: "2 días",
      descripcion: "Rovers realiza generalmente competencias de torres, aunque en los últimos años también hubo construcciones de barcos, campamentos elevados y juegos mecánicos. La competencia crece cada año con más comunidades participantes. También existe una actividad de integración la primera noche para conocerse y fortalecer la fraternidad. Se destaca la madurez, la experiencia y el trabajo en equipo.",
    },
  ];

  return (
    <PageGridBackground>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-32 pb-16 sm:pb-20 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 -top-12 -right-12 float-slow" />
          <div className="bg-blob w-48 h-48 sm:w-72 sm:h-72 bg-muted/30 -bottom-16 -left-16 drift-slow" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 backdrop-blur-sm rounded-full mb-6">
              <Flag className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-sm">
                Desde 2004 - Competencia entre Grupos Scouts
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                BAUEN
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-primary/80 mb-8">
              Construyendo juntos los ideales del Escultismo
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                size="lg"
                className="gap-2.5 w-full sm:w-auto min-w-[200px]"
                onClick={() => window.open('https://www.instagram.com/bauen.septimo/', '_blank')}
              >
                <Camera className="w-5 h-5" />
                @bauen.septimo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2.5 w-full sm:w-auto min-w-[200px]"
                onClick={() => window.open('tel:098138668', '_blank')}
              >
                <Phone className="w-5 h-5" />
                098 138 668
              </Button>
            </div>

            <Badge variant="secondary" className="text-sm px-4 py-1.5 gap-2">
              <Calendar className="w-4 h-4" />
              Próxima Edición 2026
            </Badge>
          </Reveal>
        </div>
      </section>

      {/* Acerca del Evento */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Acerca del Evento
            </h2>
            <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full" />
          </Reveal>

          <Reveal>
            <Card className="border-border/70 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 sm:p-8 md:p-10 space-y-6">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  <span className="font-bold text-primary text-2xl">Bauen</span> significa <span className="italic font-medium">"construir"</span>. 
                  El objetivo del Bauen es trabajar en equipo, desarrollando técnicas de pionerismo y, 
                  por supuesto, divirtiéndonos, ayudando a continuar construyendo juntos los ideales del Escultismo.
                </p>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Bauen es una excusa para conocer a otros grupos de nuestro país, otras formas de hacer escultismo,
                  es una instancia para practicar la empatía, la tolerancia y sentir el verdadero espíritu scout
                  del que todos tenemos conocimiento.
                </p>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Si bien es un evento de competencia, no falta el apoyo, el cuidado por el otro, la hermandad y, 
                  sobre todo, la aplicación de todos nuestros valores siempre bajo la mirada de nuestra Ley y Promesa Scout.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          {/* Actividades Destacadas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {actividades.map((act, idx) => (
              <Reveal key={idx} delay={idx * 0.1}>
                <Card className="text-center card-hover border-border/70 bg-card/50">
                  <CardContent className="p-6">
                    <div className="text-5xl mb-3">{act.icon}</div>
                    <p className="font-bold text-lg">{act.nombre}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestras Ramas */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Nuestras Ramas
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Cada rama vive BAUEN de una forma única
            </p>
            <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full mt-3" />
          </Reveal>

          <div className="space-y-4">
            {ramas.map((rama, idx) => (
              <Reveal key={idx} delay={idx * 0.1}>
                <Card 
                  className="card-hover overflow-hidden border-2 group transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: rama.color + '40' }}
                >
                  <div 
                    className="h-2 transition-all group-hover:h-3"
                    style={{ backgroundColor: rama.color }}
                  />
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Icon & Info */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                        <div 
                          className="flex h-12 w-12 items-center justify-center rounded-full shrink-0"
                          style={{ backgroundColor: rama.color + '20' }}
                        >
                          <Users className="h-6 w-6" style={{ color: rama.color }} />
                        </div>
                        <div className="flex-1 sm:hidden">
                          <h3 
                            className="text-xl font-bold"
                            style={{ color: rama.color }}
                          >
                            {rama.nombre}
                          </h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-xl font-bold mb-2 hidden sm:block"
                          style={{ color: rama.color }}
                        >
                          {rama.nombre}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {rama.duracion}
                          </Badge>
                        </div>

                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {rama.descripcion}
                        </p>

                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            📸 Bases en{" "}
                            <a 
                              href="https://www.instagram.com/bauen.septimo/" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              @bauen.septimo
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/30 shadow-xl">
              <CardContent className="p-8 sm:p-10 text-center">
                <p className="text-lg sm:text-xl font-medium text-muted-foreground mb-6">
                  ¿Querés participar con tu grupo?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    className="gap-2 min-w-[200px]"
                    onClick={() => window.open('https://www.instagram.com/bauen.septimo/', '_blank')}
                  >
                    <Camera className="w-4 h-4" />
                    Seguinos en Instagram
                  </Button>
                  <Button 
                    className="gap-2 min-w-[200px]"
                    onClick={() => window.open('tel:098138668', '_blank')}
                  >
                    <Phone className="w-4 h-4" />
                    Contáctanos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </PageGridBackground>
  );
};

export default Bauen;