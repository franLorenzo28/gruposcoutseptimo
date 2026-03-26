import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, ShieldCheck, Flag } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type Dirigente = {
  id: string;
  nombre: string;
  cargo: string;
  rama: string;
};

const DIRIGENTES: Dirigente[] = [
  {
    id: "1",
    nombre: "Roberto Martinez",
    cargo: "Jefe de Grupo",
    rama: "Supervision General",
  },
  {
    id: "2",
    nombre: "Gabriela Nunez",
    cargo: "Coordinadora de Ramas",
    rama: "Administracion",
  },
  {
    id: "3",
    nombre: "Diego Rodriguez",
    cargo: "Guía de Scouts",
    rama: "Scouts",
  },
];
// Estructura lista para cargar equipo de wiki

const Dirigentes = () => {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <UserCog className="h-4 w-4 text-primary" />
              Equipo actual
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl md:text-7xl">
              Dirigentes
              <span className="block text-primary">en actividad</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Referentes que acompanan cada rama y sostienen la propuesta educativa del grupo.
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
                  <UserCog className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{DIRIGENTES.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dirigentes activos</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">0</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cargos definidos</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <Flag className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">0</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ramas cubiertas</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {DIRIGENTES.length === 0 ? (
            <Reveal>
              <Card className="mt-8 border border-dashed border-primary/35 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                    Datos en actualizacion
                  </Badge>
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    Mostramos datos de ejemplo. Se completara con toda la informacion de dirigentes activos desde la wiki del grupo.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {DIRIGENTES.map((dirigente) => (
                <Reveal key={dirigente.id}>
                  <Card className="h-full border-border/70 bg-card/85 shadow-md">
                    <CardContent className="p-5">
                      <h2 className="text-xl font-bold">{dirigente.nombre}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{dirigente.cargo}</p>
                      <Badge className="mt-3">{dirigente.rama}</Badge>
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

export default Dirigentes;
