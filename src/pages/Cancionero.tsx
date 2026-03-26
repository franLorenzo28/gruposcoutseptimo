import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Flame, Tent, Footprints } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type TipoCancion = "fogon" | "marcha" | "campamento";

type Cancion = {
  id: string;
  titulo: string;
  tipo: TipoCancion;
  resumen: string;
  letra: string;
};

const CANCIONES: Cancion[] = [
  {
    id: "1",
    titulo: "La Marcha de Zumbador",
    tipo: "marcha",
    resumen: "Clásica marcha scout de motivación y unidad",
    letra: "Vamos todos, compañeros, con la frente en alto, a cumplir nuestra promesa, el honor y el ideal.",
  },
  {
    id: "2",
    titulo: "Fuego de Campamento",
    tipo: "fogon",
    resumen: "Canción tradicional para fogón, ambiente contemplativo",
    letra: "Fuego sagrado que iluminas la noche, en tu resplandor vemos la amistad verdadera.",
  },
  {
    id: "3",
    titulo: "Baden en el Cielo",
    tipo: "campamento",
    resumen: "Homenaje al fundador, canto de reflexión",
    letra: "En lo alto del cielo brilla una estrella, es Baden-Powell que nos guía siempre.",
  },
];
// Estructura lista para integrar datos de wiki

const TIPO_LABEL: Record<TipoCancion, string> = {
  fogon: "Fogon",
  marcha: "Marcha",
  campamento: "Campamento",
};

const TIPO_ICON = {
  fogon: Flame,
  marcha: Footprints,
  campamento: Tent,
};

const Cancionero = () => {
  const cancionesPorTipo = useMemo(
    () => ({
      fogon: CANCIONES.filter((c) => c.tipo === "fogon"),
      marcha: CANCIONES.filter((c) => c.tipo === "marcha"),
      campamento: CANCIONES.filter((c) => c.tipo === "campamento"),
    }),
    [],
  );

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <Music className="h-4 w-4 text-primary" />
              Archivo musical scout
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-6xl md:text-7xl">
              Cancionero
              <span className="block text-primary">del Grupo Septimo</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Repertorio para fogones, marchas y campamentos. Esta seccion se alimentara con el material de la wiki del grupo.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-5 md:grid-cols-3">
            {(["fogon", "marcha", "campamento"] as const).map((tipo) => {
              const Icon = TIPO_ICON[tipo];
              return (
                <Reveal key={tipo}>
                  <Card className="h-full border-border/70 bg-card/80 shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/40">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-3xl font-black text-primary">
                        {cancionesPorTipo[tipo].length}
                      </p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {TIPO_LABEL[tipo]}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          {CANCIONES.length === 0 ? (
            <Reveal>
              <Card className="mt-8 border border-dashed border-primary/35 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                    Muestra de ejemplo
                  </Badge>
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    Se muestran algunas canciones de ejemplo. El repertorio completo se alimentara de la wiki del grupo scout.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {CANCIONES.map((cancion) => (
                <Reveal key={cancion.id}>
                  <Card className="h-full border-border/70 bg-card/85 shadow-md">
                    <CardContent className="p-5">
                      <Badge className="mb-3">{TIPO_LABEL[cancion.tipo]}</Badge>
                      <h2 className="text-xl font-bold">{cancion.titulo}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{cancion.resumen}</p>
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

export default Cancionero;
