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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useState } from "react";

type Novedad = {
  id: string;
  titulo: string;
  fecha: string;
  descripcion: string;
  href: string;
  etiqueta: string;
};

const NovedadesRecientes = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [newsOpen, setNewsOpen] = useState(false);
  const [hasOpenedNews, setHasOpenedNews] = useState(false);

  // Cargar novedades de Supabase
  const { data: novedadesApi = [] } = useQuery<Novedad[]>({
    queryKey: ["novedades"],
    enabled: isHome,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("novedades" as any)
          .select("id, titulo, descripcion, href, etiqueta, created_at")
          .eq("activa", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        return (
          data?.map((n: any) => ({
            ...n,
            fecha: new Date(n.created_at).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })) || []
        );
      } catch (error) {
        console.error("Error cargando novedades:", error);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 1 * 60 * 1000, // 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (!isHome) {
    return null;
  }

  // Fallback: novedades por defecto si la API no retorna nada
  const novedades =
    novedadesApi.length > 0
      ? novedadesApi
      : [
          {
            id: "1",
            titulo: "Cancionero actualizado",
            fecha: "29 de marzo de 2026",
            descripcion:
              "Se agregó un repositorio de canciones y soporte para subir audios (solo admin).",
            href: "/cancionero",
            etiqueta: "Actualización",
          },
        ];

  return (
    <div
      aria-label="Novedades del sitio"
      className="pointer-events-none fixed right-0 top-1/2 z-[80] -translate-y-1/2"
    >
      <Sheet
        open={newsOpen}
        onOpenChange={(open) => {
          setNewsOpen(open);
          if (open) setHasOpenedNews(true);
        }}
      >
        <SheetTrigger asChild>
          <button
            type="button"
            className={
              hasOpenedNews
                ? "pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-l-xl rounded-r-none border border-r-0 border-primary/30 bg-background/95 shadow-md backdrop-blur-sm transition-colors hover:bg-background"
                : "pointer-events-auto group inline-flex items-center gap-2 rounded-l-xl rounded-r-none border border-r-0 border-primary/30 bg-background/95 px-2.5 py-3 shadow-md backdrop-blur-sm transition-colors hover:bg-background"
            }
            aria-label="Abrir novedades del sitio"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {!hasOpenedNews && (
              <span className="hidden -rotate-180 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80 [writing-mode:vertical-rl] group-hover:text-foreground md:inline">
                Novedades
              </span>
            )}
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

          <div className="mt-6 max-h-[calc(100vh-200px)] space-y-3 overflow-y-auto pr-2">
            {novedades.map((novedad) => (
              <article
                key={novedad.id}
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