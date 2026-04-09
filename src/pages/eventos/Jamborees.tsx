import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe2, Flag, CalendarDays, MapPin, BookOpen } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useNavigate } from "react-router-dom";

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
    tipo: "panamericano",
    anio: 1981,
    lugar: "Porto Alegre, Brasil",
    descripcion: "4º Jamboree Panamericano en el Parque Saint Hilaire. Delegacion destacada con participacion de 13 miembros incluyendo jovenes scouts y padres.",
  },
  {
    id: "2",
    tipo: "panamericano",
    anio: 2014,
    lugar: "Chile",
    descripcion: "Jamboree Panamericano con participación de rovers. Experiencia memorable marcada por la solidaridad del grupo ante desafíos inesperados.",
  },
  {
    id: "3",
    tipo: "panamericano",
    anio: 2023,
    lugar: "Paso de los Libres, Corrientes, Argentina",
    descripcion: "Jamboree Sudamericano con participación de Rovers y Pioneros. Experiencia desafiante que fortaleció la unidad del grupo a través de las dificultades.",
  }
];
// Base de datos lista para actualizar con historial

const TIPO_LABEL: Record<TipoJamboree, string> = {
  mundial: "Mundial",
  panamericano: "Panamericano",
};

const Jamborees = () => {
  const navigate = useNavigate();
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
                  <Card className="h-full border-border/70 bg-card/85 shadow-md transition-shadow duration-300 hover:shadow-lg flex flex-col">
                    <CardContent className="p-6 md:p-8 flex-1">
                      <Badge className="mb-3">{TIPO_LABEL[jamboree.tipo]}</Badge>
                      <h2 className="text-xl font-bold">{jamboree.anio}</h2>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        <MapPin className="h-4 w-4" />
                        {jamboree.lugar}
                      </p>
                      <p className="mt-3 text-sm leading-7 tracking-[0.01em] text-muted-foreground">{jamboree.descripcion}</p>
                      {jamboree.id === "1" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full"
                          onClick={() => navigate("/eventos/jamboree-1981")}
                        >
                          Ver narrativa completa
                        </Button>
                      )}
                      {jamboree.id === "2" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full"
                          onClick={() => navigate("/eventos/jamboree-2014")}
                        >
                          Ver narrativa completa
                        </Button>
                      )}
                      {jamboree.id === "3" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full"
                          onClick={() => navigate("/eventos/jamboree-2023")}
                        >
                          Ver narrativa completa
                        </Button>
                      )}
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
