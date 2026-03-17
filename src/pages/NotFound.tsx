import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background/70 flex items-center justify-center px-4">
      <Card className="w-full max-w-xl border-border/70 bg-card/85 shadow-xl">
        <CardContent className="p-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Compass className="h-4 w-4" />
            Ruta no encontrada
          </p>
          <h1 className="mt-4 text-6xl font-black">404</h1>
          <p className="mt-3 text-base text-muted-foreground">
            La pagina que buscaste no existe o fue movida. Te ayudamos a retomar el camino.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Volver al inicio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contacto">Contactar al grupo</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
