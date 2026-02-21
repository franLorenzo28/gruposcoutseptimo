import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Hand, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { OptimizedImage } from "@/components/OptimizedImage";
import heroImage from "@/assets/hero-scouts.jpg";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseUser } from "@/App";
const Hero = () => {
  const { toast } = useToast();
  const { user } = useSupabaseUser();

  const handleJoinClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (user) {
      // Evita navegar a /auth si ya está logueado
      e.preventDefault();
      toast({
        title:
          "Gracias por ser parte de la página web oficial del Grupo Scout Séptimo",
      });
    }
  };
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <OptimizedImage
          src={heroImage}
          alt="Grupo Scout Séptimo de Montevideo en actividad al aire libre"
          className="absolute inset-0 object-left"
          objectFit="cover"
          priority
        />
        <div className="bg-blob w-72 h-72 bg-muted/40 -top-24 -right-16 float-slow" />
        <div className="bg-blob w-64 h-64 bg-muted/40 -bottom-24 -left-10 drift-slow" />
        <div className="absolute inset-0 bg-gradient-to-r from-scout-black/75 via-scout-black/60 to-scout-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-scout-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-20 pb-24 md:pb-32">
        <div className="max-w-4xl">
          <div className="space-y-8">
            {/* Main Title */}
            <Reveal>
              <h1 
                id="hero-title"
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight"
              >
                <span className="text-primary block mb-2">
                  Grupo Scout Séptimo
                </span>
                <span className="block text-white drop-shadow-lg">
                  de Montevideo
                </span>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 leading-relaxed max-w-2xl">
                Una comunidad de aventura, valores y formación integral para
                jóvenes. Construimos un futuro mejor a través del escultismo.
              </p>
            </Reveal>

            {/* CTA Buttons */}
            <Reveal>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to="/auth" className="group" onClick={handleJoinClick}>
                  <Button
                    size="lg"
                    variant="hero"
                    className="text-lg w-full sm:w-auto transition-all duration-300 hover:shadow-2xl hover:scale-105"
                    aria-label="Únete al Grupo Scout Séptimo"
                  >
                    Únete al Grupo
                    <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </Link>

                <Button
                  onClick={() => {
                    document.getElementById("historia")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  size="lg"
                  variant="heroSecondary"
                  className="group text-lg w-full sm:w-auto transition-all duration-300 hover:shadow-xl hover:scale-105"
                  aria-label="Conoce nuestra historia de 61 años"
                >
                  <Users className="mr-2 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  Conoce Nuestra Historia
                </Button>
              </div>
            </Reveal>

            <Reveal>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white bg-transparent hover:bg-transparent hover:text-white"
                  onClick={() =>
                    document
                      .getElementById("quienes-somos")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Quiénes somos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white bg-transparent hover:bg-transparent hover:text-white"
                  onClick={() =>
                    document
                      .getElementById("ramas")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Unidades
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white bg-transparent hover:bg-transparent hover:text-white"
                  onClick={() =>
                    document
                      .getElementById("pilares")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Pilares
                </Button>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal>
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-white/20"
                role="list"
                aria-label="Estadásticas del grupo"
              >
                <div className="group" role="listitem">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary transition-transform duration-300 group-hover:scale-110" aria-label="Más de 61 años">
                    +61
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-300 mt-1 sm:mt-2 font-medium">
                    Años de historia
                  </div>
                </div>
                <div className="group" role="listitem">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent transition-transform duration-300 group-hover:scale-110" aria-label="Más de 100 scouts">
                    +100
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-300 mt-1 sm:mt-2 font-medium">
                    Scouts activos
                  </div>
                </div>
                <div className="group col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-3xl sm:text-4xl md:text-5xl font-bold text-primary transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    <span>1</span>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-300 mt-1 sm:mt-2 font-medium">
                    Locales scouts
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Scroll Indicator Desktop */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce flex-col items-center gap-2">
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center transition-colors duration-300 hover:border-primary">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
        <span className="text-xs text-white/60 font-medium">Descubre más</span>
      </div>

      {/* Mobile Scroll Indicator */}
      <div className="md:hidden pointer-events-none absolute bottom-20 right-4 z-10 animate-bounce">
        <div className="w-12 h-12 bg-muted/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-primary/30">
          <Hand className="w-6 h-6 text-primary" />
        </div>
      </div>
    </section>
  );
};
export default Hero;


