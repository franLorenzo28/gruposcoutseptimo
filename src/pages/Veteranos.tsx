import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2, CalendarRange, Shield } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type Veterano = {
  id: string;
  nombre: string;
  aniosActivo: string;
  rama: string;
};

const VETERANOS: Veterano[] = [
  {
    id: "1",
    nombre: "Carlos Alberto Lopez Garcia",
    aniosActivo: "1985-1992 (7 anos)",
    rama: "Scouts",
  },
  {
    id: "2",
    nombre: "Maria Ines Fernandez",
    aniosActivo: "1990-2005 (15 anos)",
    rama: "Guias",
  },
  {
    id: "3",
    nombre: "Luis Miguel Sanchez",
    aniosActivo: "2000-2018 (18 anos)",
    rama: "Rafa",
  },
];
// Estructura lista para completar registro desde wiki

const Veteranos = () => {
  return (
    <div className="page-animate min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <Users2 className="h-4 w-4 text-primary" />
              Comunidad historica
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              Veteranos
              <span className="block text-primary">del Grupo Septimo</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Reconocimiento a ex-integrantes que marcaron historia en distintas ramas y epocas del grupo.
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
                  <Users2 className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{VETERANOS.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Veteranos registrados</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <CalendarRange className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">0</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Periodos cargados</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <Shield className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">0</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ramas documentadas</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {VETERANOS.length === 0 ? (
            <Reveal>
              <Card className="mt-8 border border-dashed border-primary/35 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                    Historial en construccion
                  </Badge>
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    Mostramos veteranos de ejemplo. Se completara con el historial completo de ex-integrantes desde la wiki.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {VETERANOS.map((veterano) => (
                <Reveal key={veterano.id}>
                  <Card className="h-full border-border/70 bg-card/85 shadow-md transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <h2 className="text-xl font-bold">{veterano.nombre}</h2>
                      <p className="mt-2 text-sm leading-7 tracking-[0.01em] text-muted-foreground">{veterano.aniosActivo}</p>
                      <Badge className="mt-3">{veterano.rama}</Badge>
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

export default Veteranos;
