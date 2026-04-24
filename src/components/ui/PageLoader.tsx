import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  compact?: boolean;
  className?: string;
}

export default function PageLoader({
  message = "Cargando contenido...",
  compact = false,
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 text-center",
        compact ? "py-8" : "min-h-screen py-20",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/35 border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
