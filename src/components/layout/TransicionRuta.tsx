import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Aplica una animación de entrada sutil al cambiar de ruta.
// Respeta 'prefers-reduced-motion'.
export default function RouteTransition({
  children,
  className,
}: RouteTransitionProps) {
  const location = useLocation();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return (
    <div
      key={location.pathname}
      className={cn(
        // Sutil fade/slide
        reduceMotion
          ? "opacity-100 translate-y-0"
          : "page-enter page-animate",
        className,
      )}
    >
      {children}
    </div>
  );
}
