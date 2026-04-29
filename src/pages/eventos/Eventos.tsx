import { Link } from "react-router-dom";
import SeccionEventos from "@/components/sections/SeccionEventos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";

const Eventos = () => {
  return (
    <PageGridBackground>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-14 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-12 drift-slow" />
          <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/22 top-[55%] left-[7%] float-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_45%)]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto">
            <div className="mb-2 text-sm text-muted-foreground">
              <Link to="/">Inicio</Link> <span className="mx-1">/</span> <span className="text-foreground font-semibold">Eventos</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-2 text-foreground">
              CARTELERA DE <span className="text-foreground">EVENTOS</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-2xl">
              Aqui anunciaremos los eventos más importantes del año, tanto internos como externos. ¡No te pierdas nada!
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
            </div>
          </Reveal>
        </div>
      </section>


      {/* Cartelera de eventos */}
      <section id="cartelera" className="container mx-auto px-2 sm:px-4 lg:px-8 py-10 sm:py-14">
        <Card className="border-border/70 bg-card/85 shadow-lg backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <SeccionEventos />
          </CardContent>
        </Card>
      </section>

      <NovedadesRecientes />
    </PageGridBackground>
  );
};

export default Eventos;






