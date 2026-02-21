import Events from "@/components/Events";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Sparkles, Flag } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const Eventos = () => {
  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 border-b border-muted/30">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-12 drift-slow" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto">
            <div className="mb-2 text-sm text-muted-foreground">
              <Link to="/">Inicio</Link> <span className="mx-1">/</span> <span className="text-foreground font-semibold">Eventos</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-2 text-foreground">
              CARTELERA DE <span className="text-foreground">EVENTOS</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-2xl">
              Descubre torneos, watch parties y reuniones de la comunidad. No te pierdas la acción en vivo.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>3 eventos activos</span> 
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("cartelera")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Cartelera
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("bauen")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                BAUEN
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cartelera de eventos */}
      <section id="cartelera" className="container mx-auto px-2 sm:px-4 lg:px-8 py-8">
        <Events />
      </section>

      {/* Sección destacada BAUEN */}
      <section id="bauen" className="py-10 sm:py-14 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="card-hover border-2 border-primary/20 shadow-2xl bg-background/70 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted/40 backdrop-blur-sm rounded-full mb-4">
                    <Flag className="w-5 h-5 text-primary" />
                    <span className="text-primary font-bold text-sm">Evento Destacado</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
                    ¿Buscás información sobre BAUEN?
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                    Descubrí todo sobre el evento scout nacional más importante del año. Creado por nuestro grupo en 2004, BAUEN reúne a más de 300 scouts de todo el país.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  <Card className="text-center card-hover">
                    <CardContent className="p-2 sm:p-4">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">2004</div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Año de creación</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center card-hover">
                    <CardContent className="p-2 sm:p-4">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">+300</div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Participantes</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center card-hover">
                    <CardContent className="p-2 sm:p-4">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">4</div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ramas participantes</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center">
                  <Link to="/bauen">
                    <Button size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 whitespace-normal">
                      <Calendar className="w-5 h-5" />
                      Ver toda la información de BAUEN
                      <Flag className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Eventos;





