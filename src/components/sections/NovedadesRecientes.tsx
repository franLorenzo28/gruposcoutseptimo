import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Novedad = {
  titulo: string;
  fecha: string;
  descripcion: string;
  href: string;
  etiqueta: string;
};

const novedades: Novedad[] = [
  {
    titulo: "Cápsula del Tiempo",
    fecha: "26 de marzo de 2026",
    descripcion:
      "Nuevo contenido en Archivo con fotos y memoria histórica de la cápsula.",
    href: "/archivo/capsula-del-tiempo",
    etiqueta: "Nuevo contenido",
  },
];

const NovedadesRecientes = () => {
  return (
    <div
      aria-label="Novedades del sitio"
      className="pointer-events-none fixed right-0 top-1/2 z-[60] -translate-y-1/2"
    >
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="pointer-events-auto fixed bottom-5 right-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-background/95 shadow-md backdrop-blur-sm transition-colors hover:bg-background md:hidden"
            aria-label="Abrir novedades del sitio"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          </button>
        </SheetTrigger>

        <SheetTrigger asChild>
          <button
            type="button"
            className="pointer-events-auto group hidden items-center gap-2 rounded-l-xl border border-r-0 border-primary/30 bg-background/95 px-2.5 py-3 shadow-md backdrop-blur-sm transition-colors hover:bg-background md:flex"
            aria-label="Abrir novedades del sitio"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="-rotate-180 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80 [writing-mode:vertical-rl] group-hover:text-foreground">
              Novedades
            </span>
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[92vw] max-w-sm sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Novedades del sitio
            </SheetTitle>
            <SheetDescription>
              Secciones agregadas recientemente.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {novedades.map((novedad) => (
              <article
                key={novedad.href}
                className="rounded-xl border border-border/70 bg-card/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {novedad.etiqueta}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {novedad.fecha}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {novedad.titulo}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {novedad.descripcion}
                </p>

                <div className="mt-4">
                  <Button asChild size="sm" className="gap-1.5">
                    <Link to={novedad.href}>
                      Ir a la sección
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovedadesRecientes;