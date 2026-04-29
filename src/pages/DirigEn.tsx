import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, BookOpen, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Link } from "react-router-dom";

const DIRIGENTES_DATA = [
  {
    titulo: "Coordinador de Grupo",
    nombre: "Cargo en proceso",
    descripcion: "Coordina la propuesta educativa global del grupo.",
    estado: "vacante" as const,
  },
  {
    titulo: "Jefe de Manada",
    nombre: "Cargo en proceso",
    descripcion: "Lidera el equipo de lobatos.",
    estado: "vacante" as const,
  },
  {
    titulo: "Jefe de Tropa",
    nombre: "Cargo en proceso",
    descripcion: "Lidera el equipo de scouts.",
    estado: "vacante" as const,
  },
  {
    titulo: "Jefe de Pioneros",
    nombre: "Cargo en proceso",
    descripcion: "Lidera el equipo de jovenes pioneros.",
    estado: "vacante" as const,
  },
  {
    titulo: "Jefe de Rovers",
    nombre: "Cargo en proceso", 
    descripcion: "Lidera el equipo de jovenes adultos.",
    estado: "vacante" as const,
  },
  {
    titulo: "Secretario de Unidad",
    nombre: "Cargo en proceso",
    descripcion: "Gestiona documentacion y comunicacion.",
    estado: "vacante" as const,
  },
];

const DirigEn = () => {
  return (
    <div className="page-animate min-h-screen">
      <section className="relative overflow-hidden pb-14 pt-28 sm:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-primary/10 -top-16 -right-12 float-slow" />
          <div className="bg-blob w-64 h-64 bg-accent/10 -bottom-20 -left-12 drift-slow" />
        </div>
        <div className="container mx-auto px-4">
          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <UserCog className="h-4 w-4 text-primary" />
              Equipo de Servicio
            </div>
            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-6xl md:text-7xl">
              Educadores
              <span className="block text-foreground">del Grupo Séptimo</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 tracking-[0.01em] text-muted-foreground sm:text-lg">
              Adultos voluntarios que sostenido el proyecto educativo con compromiso, formacion y cercania.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-background/70">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {DIRIGENTES_DATA.map((cargo, idx) => (
                <Card key={idx} className="card-hover border-border/50 bg-gradient-to-br from-card via-card to-card/80">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={cargo.estado === "vacante" ? "outline" : "default"} className="text-xs">
                        {cargo.estado === "vacante" ? "Vacante" : "Activo"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{cargo.titulo}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{cargo.descripcion}</p>
                    <p className="text-xs text-primary/70">{cargo.nombre}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-background/70 to-muted/25">
        <div className="container mx-auto px-4">
          <Reveal>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Queres formar parte del equipo?</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  El grupo siempre necesita adultos que accompagnen la propuesta educativa.
                  Contactanos para conocer como podes participar.
                </p>
                <Link to="/contacto">
                  <Button className="gap-2">
                    Contactanos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default DirigEn;