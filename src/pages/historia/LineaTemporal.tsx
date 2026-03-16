import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import emblemImage from "@/assets/scout-emblem.jpg";

const Historia = () => {
  const milestones = [
    {
      year: "1964",
      title: "Fundación del Grupo",
      description:
        "Nace el Grupo Scout Séptimo de Montevideo con un grupo de jóvenes visionarios comprometidos con los valores del escultismo.",
    },
    {
      year: "1965",
      title: "Primer Local Propio",
      description:
        "Inauguramos nuestro primer local, consolidando nuestra presencia en la comunidad.",
    },
    {
      year: "2004",
      title: "Nace BAUEN",
      description:
        "Se crea la competencia BAUEN, que se convertirá en el evento más importante del escultismo uruguayo.",
    },
    {
      year: "1990",
      title: "Expansión de Ramas",
      description:
        "Incorporamos todas las ramas del escultismo, desde castores hasta rovers, ofreciendo formación integral.",
    },
    {
      year: "2014",
      title: "Aniversario 50 Años",
      description:
        "Enterramos una placa conmemorativa para celebrar nuestro centenario en el 2064, dejando un legado para las futuras generaciones de scouts.",
    },
    {
      year: "2020",
      title: "Adaptación Digital",
      description:
        "Durante la pandemia, innovamos con actividades virtuales manteniendo vivo el espáritu scout.",
    },
    {
      year: "2025",
      title: "20 años del BAUEN",
      description: "Celebramos dos décadas de la competencia BAUEN.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                Nuestra Historia
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              61 Años Construyendo Futuro
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Desde 1964, hemos sido parte fundamental del movimiento scout
              uruguayo, formando generaciones de láderes comprometidos con su
              comunidad.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
            <div className="text-center lg:text-left">
              <img
                src={emblemImage}
                alt="Emblemas Scout"
                className="w-full rounded-xl shadow-2xl mb-4 transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="lg:col-span-2 flex flex-col justify-center space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                El Comienzo de una Tradición
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                El Grupo Scout Séptimo de Montevideo fue fundado en 1964 por un
                grupo de jóvenes comprometidos con los ideales de Baden-Powell.
                Desde entonces, hemos crecido hasta convertirnos en uno de los
                grupos scouts más reconocidos del Uruguay.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                A lo largo de más de seis décadas, hemos formado a miles de
                scouts, participado en innumerables campamentos, competencias y
                proyectos de servicio comunitario. Nuestra historia es la
                historia de compromiso, fraternidad y crecimiento constante.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-foreground/20"></div>

            <div className="space-y-12 sm:space-y-16">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row gap-6 sm:gap-8 items-center ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="flex-1">
                    <Card className="card-hover border-2 hover:border-primary/50 transition-all duration-500 shadow-lg">
                      <CardContent className="p-5 sm:p-6 lg:p-8">
                        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-3 sm:mb-4 transition-transform duration-300 hover:scale-110">
                          {milestone.year}
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                          {milestone.title}
                        </h3>
                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline Dot */}
                  <div className="hidden md:block relative">
                    <div className="w-6 h-6 bg-primary rounded-full border-4 border-background shadow-2xl z-10 transition-transform duration-300 hover:scale-150">
                      <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>

                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer global en App.tsx */}
    </div>
  );
};

export default Historia;


