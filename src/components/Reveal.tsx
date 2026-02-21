import React, { HTMLAttributes, useEffect, useRef, useState } from "react";

type RevealProps = {
  /**
   * Añade clases cuando el elemento entra en viewport.
   * Usa utilidades de tailwindcss-animate: animate-in fade-in slide-in-from-bottom-2
   */
  animationClassName?: string;
  /**
   * Ejecutar solo la primera vez que entra en viewport.
   */
  once?: boolean;
  /**
   * Margen para adelantar o retrasar el disparo de la intersección.
   * Ej: "0px 0px -10% 0px" revela un poco antes.
   */
  rootMargin?: string;
} & HTMLAttributes<HTMLDivElement>;

/**
 * Componente de aparición sutil al hacer scroll, accesible y ligero.
 * Respeta prefers-reduced-motion para personas con sensibilidad a la animación.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  animationClassName = "reveal-up",
  once = true,
  rootMargin = "0px 0px -10% 0px",
  ...rest
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // Respeta prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { root: null, rootMargin, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return (
    <div
      ref={ref}
      className={[
        "will-change-transform",
        visible ? animationClassName : "opacity-0 translate-y-10",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Reveal;
