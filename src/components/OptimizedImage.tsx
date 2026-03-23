import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  webpSrc?: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none";
  priority?: boolean; // Para imágenes above-the-fold
}

/**
 * Componente de imagen optimizada con soporte para:
 * - WebP con fallback automático
 * - Lazy loading nativo
 * - Aspect ratio
 * - Loading states
 * - Error handling
 */
export function OptimizedImage({
  src,
  webpSrc,
  fallbackSrc,
  alt,
  className,
  aspectRatio,
  objectFit = "cover",
  priority = false,
  loading,
  fetchPriority,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src;
  const loadingMode = priority ? "eager" : (loading || "lazy");
  const fetchMode = priority ? "high" : fetchPriority;

  return (
    <div 
      className={cn("relative overflow-hidden bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/40" />
      )}
      
      <picture>
        {/* WebP version si está disponible */}
        {webpSrc && !hasError && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        
        {/* Imagen original */}
        <img
          src={displaySrc}
          alt={alt}
          loading={loadingMode}
          decoding="async"
          fetchPriority={fetchMode}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            {
              "object-contain": objectFit === "contain",
              "object-cover": objectFit === "cover",
              "object-fill": objectFit === "fill",
              "object-none": objectFit === "none",
            }
          )}
          {...props}
        />
      </picture>
    </div>
  );
}

/**
 * Componente para imagen de hero/banner con gradiente overlay
 */
export function HeroImage({
  src,
  webpSrc,
  alt,
  overlayOpacity = 0.4,
  children,
  className,
}: OptimizedImageProps & { overlayOpacity?: number; children?: React.ReactNode }) {
  return (
    <div className={cn("relative min-h-[400px] md:min-h-[500px]", className)}>
      <OptimizedImage
        src={src}
        webpSrc={webpSrc}
        alt={alt}
        priority
        className="absolute inset-0"
        objectFit="cover"
      />
      
      {/* Overlay gradient */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Contenido */}
      {children && (
        <div className="relative z-10 flex items-center justify-center min-h-[400px] md:min-h-[500px]">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para avatar/thumbnail circular
 */
export function AvatarImage({
  src,
  alt,
  size = "md",
  fallbackText,
  className,
}: OptimizedImageProps & {
  size?: "sm" | "md" | "lg" | "xl";
  fallbackText?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg",
  };

  if (hasError && fallbackText) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full bg-muted/30 text-foreground font-semibold",
          sizeClasses[size],
          className
        )}
      >
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("rounded-full", sizeClasses[size], className)}
      objectFit="cover"
    />
  );
}
