import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

const getFallbackPath = (pathname: string): string => {
  if (pathname.startsWith("/archivo/scoutpedia")) return "/archivo";
  if (pathname.startsWith("/archivo/")) return "/archivo";
  if (pathname.startsWith("/eventos/")) return "/eventos";
  if (pathname.startsWith("/area-miembros/")) return "/area-miembros";
  if (pathname.startsWith("/unidades/")) return "/area-miembros";
  if (pathname.startsWith("/ramas/")) return "/area-miembros";
  return "/";
};

const BotonVolverGlobal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") {
    return null;
  }

  const handleBack = () => {
    const fallbackPath = getFallbackPath(location.pathname);
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };

  const fallbackPath = getFallbackPath(location.pathname);
  const textoSecundario = fallbackPath === "/" ? "Ir al inicio" : "Ir a la sección";

  return (
    <div className="fixed left-2 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 sm:left-6 sm:top-24 sm:translate-y-0 sm:flex-row sm:gap-0">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="h-10 w-10 rounded-full border-border/70 bg-background/85 px-0 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:w-auto sm:px-3"
      >
        <ArrowLeft className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Volver</span>
        <span className="sr-only">{textoSecundario}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="h-10 w-10 rounded-full border border-border/70 bg-background/85 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:ml-2"
        aria-label="Ir al inicio"
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BotonVolverGlobal;
