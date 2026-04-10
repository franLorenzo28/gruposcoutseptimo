import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const Dirigentes = () => {
  return (
    <div className="page-animate min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <UserCog className="h-4 w-4 text-primary" />
              Seccion interna
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              Educadores
              <span className="block text-primary">en proceso</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Esta seccion se encuentra en proceso de actualizacion.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <Reveal>
            <Card className="mx-auto max-w-3xl border border-dashed border-primary/35 bg-primary/5">
              <CardContent className="p-8 text-center">
                <Badge variant="outline" className="border-primary/35 text-primary bg-background/70">
                  Seccion en proceso
                </Badge>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  Estamos trabajando en esta seccion para publicar la informacion completa de educadores.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Dirigentes;
