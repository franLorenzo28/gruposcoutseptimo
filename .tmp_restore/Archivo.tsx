import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";
import {
  Archive,
  FileText,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

const secciones = [
  {
    title: "Scoutpedia",
    description:
      "Definiciones, términos y contenidos enciclopédicos del historial scout.",
    to: "/archivo/scoutpedia",
  },
  {
    title: "Compañáa",
    description:
      "Historia, actividades y documentación especáfica de la Compañáa.",
    to: "/archivo/compania",
  },
  {
    title: "Miembros y exmiembros",
    description:
      "Listados históricos con revisión de privacidad y consentimiento.",
    to: "/archivo/miembros",
  },
];

const Archivo = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14 bg-background/60 backdrop-blur-sm">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-muted/30 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/30 -bottom-20 -left-10 drift-slow" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                Archivo del Grupo
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6">
              Archivo del Grupo
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed mb-6">
              Este espacio reúne la información del Grupo Scout Séptimo. La
              idea es conservar el contenido, mejorar su organización y hacerlo
              fácil de encontrar.
            </p>

            <Button
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl"
              onClick={() =>
                document
                  .getElementById("secciones")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Archive className="w-4 h-4" />
              Ver secciones
            </Button>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("secciones")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Secciones
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document
                    .getElementById("cta-material")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Enviar material
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Secciones */}
      <section
        id="secciones"
        className="py-16 sm:py-20 bg-background/60 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 shadow-sm">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                  Secciones destacadas
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Contenido organizado por temática
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed">
                Entradas clave organizadas para una navegación más simple.
              </p>
            </Reveal>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {secciones.map((section) => (
                <Link key={section.to} to={section.to}>
                  <Button size="sm" variant="outline" className="rounded-full">
                    {section.title}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {secciones.map((section, index) => (
                <Reveal key={index}>
                  <Card className="card-hover border-2 border-primary/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-background/70 backdrop-blur-sm">
                    <CardContent className="p-6 min-h-[220px] flex flex-col">
                      <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                        {section.title}
                      </h4>
                      <p className="text-sm text-muted-foreground/90 mb-4 flex-1">
                        {section.description}
                      </p>
                      <Link to={section.to}>
                        <Button size="sm" variant="outline">
                          Abrir sección
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section id="cta-material" className="py-12 sm:py-16 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto">
            <Card className="card-hover border-2 border-primary/20 shadow-xl bg-background/70 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/60 text-muted-foreground rounded-full mb-3">
                      <Layers className="w-4 h-4" />
                      <span className="font-medium text-[11px] sm:text-xs">
                        Material
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                      ¿Tenés material?
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground/90">
                      Si querés sumar contenido del grupo, escribinos y lo
                      incorporamos al archivo.
                    </p>
                  </div>
                  <Link to="/contacto">
                    <Button size="lg" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Enviar material
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Archivo;



