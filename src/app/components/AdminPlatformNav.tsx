import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  ["Resumen", "/admin"],
  ["Usuarios", "/admin/usuarios"],
  ["Solicitudes", "/admin/solicitudes"],
  ["Grupos", "/admin/grupos"],
  ["Eventos", "/admin/eventos"],
  ["Mensajes", "/admin/mensajes"],
  ["Páginas", "/admin/paginas"],
] as const;

export function AdminPlatformNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-foreground">
              Panel admin
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Usuarios, permisos, contenido y operación del sitio
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1 rounded-full shrink-0">
          <Link to="/interno">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al interno</span>
          </Link>
        </Button>
      </div>
      <nav aria-label="Secciones administrativas" className="mx-auto flex w-full max-w-[1480px] gap-1 overflow-x-auto px-3 pb-2 sm:px-6 lg:px-8">
        {adminLinks.map(([label, path]) => {
          const active = path === "/admin"
            ? location.pathname === path
            : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-primary/10 text-primary ring-1 ring-primary/15",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
