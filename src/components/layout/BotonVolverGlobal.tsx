import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BotonVolverGlobal() {
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  const parent = pathname.startsWith("/archivo/") ? { to: "/archivo", label: "Volver al archivo" }
    : pathname.startsWith("/unidades/") ? { to: "/#unidades", label: "Ver todas las unidades" }
    : pathname.startsWith("/eventos/") ? { to: "/eventos", label: "Volver a eventos" }
    : { to: "/", label: "Volver al inicio" };
  return <nav aria-label="Volver a la sección" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
    <Button asChild variant="ghost" size="sm"><Link to={parent.to}><ArrowLeft aria-hidden="true" />{parent.label}</Link></Button>
  </nav>;
}
