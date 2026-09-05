/**
 * PageGridBackground - Componente reutilizable de fondo con degradado
 * Provides a consistent gradient background for all pages
 */

import { memo } from "react";
import { cn } from "@/lib/utils";

interface PageGridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const PageGridBackground = memo(function PageGridBackground({
  children,
  className = "",
}: PageGridBackgroundProps) {
  return (
    <div
      className={cn("page-animate relative isolate min-h-screen overflow-clip bg-background", className)}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--primary)/0.075),transparent_28rem),radial-gradient(circle_at_88%_24%,hsl(var(--secondary)/0.09),transparent_24rem)]" aria-hidden="true" />
      <div className="app-grid pointer-events-none absolute inset-0 -z-10 opacity-35 dark:opacity-20" aria-hidden="true" />

      <div className="relative">{children}</div>
    </div>
  );
});

PageGridBackground.displayName = "PageGridBackground";
