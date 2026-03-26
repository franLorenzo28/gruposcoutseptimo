import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe2, Flag, CalendarDays, MapPin } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type TipoJamboree = "mundial" | "panamericano";

type Jamboree = {
  id: string;
  tipo: TipoJamboree;
  anio: number;
  lugar: string;
  descripcion: string;
};

const JAMBOREES: Jamboree[] = [
  {
    id: "1",
    tipo: "mundial",
    anio: 2015,
    lugar: "Yamaguchi, Japon",
    descripcion: "Participacion historica en Japon con delegacion de 8 miembros del grupo.",
  },
  {
    id: "2",
    tipo: "panamericano",
    anio: 2016,
    lugar: "San Isidro de El General, Costa Rica",
    descripcion: "Encuentro regional panamericano con scouts de toda America Latina.",
  },
  {
    id: "3",
    tipo: "mundial",
    anio: 2019,
    lugar: "Summit Bechtel Reserve, USA",
    descripcion: "Jamboree mundial en Estados Unidos con representacion del grupo.",
  },
];
// Base de datos lista para actualizar con historial

const TIPO_LABEL: Record<TipoJamboree, string> = {
  mundial: "Mundial",
  panamericano: "Panamericano",
};

const Jamborees = () => {
  const mundiales = JAMBOREES.filter((j) => j.tipo === "mundial");
  const panamericanos = JAMBOREES.filter((j) => j.tipo === "panamericano");

  return (
    <div className="page-animate min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <Globe2 className="h-4 w-4 text-primary" />
              Eventos internacionales
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              Jamborees
              <span className="block text-primary">Mundiales y Panamericanos</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Registro de participaciones y referencias historicas en encuentros scouts internacionales.
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
                  <Globe2 className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{JAMBOREES.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Jamborees registrados</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <Flag className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{mundiales.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mundiales</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                <CardContent className="p-6">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-3xl font-black text-primary">{panamericanos.length}</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Panamericanos</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {JAMBOREES.length === 0 ? (
            <Reveal>
              <Card className="mt-8 border border-dashed border-primary/35 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                    Participaciones destacadas
                  </Badge>
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    Mostramos una seleccion de jamborees historicos. Se ampliara con la base de datos completa desde la wiki.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {JAMBOREES.map((jamboree) => (
                <Reveal key={jamboree.id}>
                  <Card className="h-full border-border/70 bg-card/85 shadow-md transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <Badge className="mb-3">{TIPO_LABEL[jamboree.tipo]}</Badge>
                      <h2 className="text-xl font-bold">{jamboree.anio}</h2>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        <MapPin className="h-4 w-4" />
                        {jamboree.lugar}
                      </p>
                      <p className="mt-3 text-sm leading-7 tracking-[0.01em] text-muted-foreground">{jamboree.descripcion}</p>
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

export default Jamborees;
