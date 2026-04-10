/**
 * PageGridBackground - Componente reutilizable de fondo con degradado
 * Provides a consistent gradient background for all pages
 */

interface PageGridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const PageGridBackground = ({
  children,
  className = "",
}: PageGridBackgroundProps) => {
  return (
    <div
      className={`min-h-screen page-animate relative bg-gradient-to-br from-background via-background to-background ${className}`}
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_150%_150%_at_50%_0%,var(--color-primary)_0%,transparent_50%)] opacity-5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
