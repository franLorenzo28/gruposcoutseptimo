import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { Users, FileText, Clock3, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Compania = () => {
  const bloques = [
    {
      titulo: "Historia de la Compañía",
      descripcion: "Relatos, hitos y materiales que cuentan su evolución en el grupo.",
      icono: Clock3,
    },
    {
      titulo: "Documentación",
      descripcion: "Programas, registros y recursos pedagógicos para consulta.",
      icono: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-primary/10 -top-20 -right-16 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/20 -bottom-16 -left-12 drift-slow" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full mb-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                Archivo · Compañía
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Sección Compañía
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              Espacio para la historia, actividades y documentación de la
              Compañía.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-muted/25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {bloques.map((bloque) => (
                <Reveal key={bloque.titulo}>
                  <Card className="h-full border border-border/70 bg-card/85 shadow-md">
                    <CardContent className="p-5">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <bloque.icono className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold">{bloque.titulo}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{bloque.descripcion}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <Card className="border-2 border-primary/20 shadow-lg bg-background/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                        Contenido en preparación
                      </h2>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Enviá el material de Compañía para organizarlo aquí.
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

export default Compania;



