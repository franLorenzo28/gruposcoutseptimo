import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminPlatformNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              Panel admin
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block truncate">
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
    </header>
  );
}
