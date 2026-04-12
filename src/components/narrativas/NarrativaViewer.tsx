import { useState } from "react";
import { NarrativaConAutor, NarrativaBloque } from "@/types/narrativa";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface NarrativaViewerProps {
  narrativa: NarrativaConAutor;
  onBack?: () => void;
}

export function NarrativaViewer({
  narrativa,
  onBack,
}: NarrativaViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const isAmLagerfeuerNarrativa = /am\s+lagerfeuer/i.test(narrativa.titulo);

  // Obtener solo los bloques de imagen para la galería
  const imageBloques = narrativa.bloques.filter((b) => b.tipo === "imagen");

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const nextImage = () => {
    if (lightboxIndex < imageBloques.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };
  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
        )}
      </div>

      {/* Título y meta */}
      <header className="mb-8">
        <div className="flex items-center gap-1 mb-2">
          <div className="flex-1">
            <p className="text-base font-bold text-primary mb-2">
              {narrativa.year_section}
            </p>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {narrativa.titulo}
            </h1>
          </div>
        </div>

        {/* Autor y fecha */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <UserAvatar
            user={narrativa.autor}
            size="md"
          />
          <div>
            <p className="font-semibold text-foreground">
              {narrativa.autor?.nombre_completo || narrativa.autor?.username || "Anónimo"}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(narrativa.fecha_publicacion).toLocaleDateString("es-UY", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {isAmLagerfeuerNarrativa && (
          <div className="mt-5">
            <Button asChild variant="outline" size="sm">
              <Link to="/archivo/am-lagerfeuer">Ir al repositorio de Am Lagerfeuer (PDFs)</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Contenido: bloques */}
      <div className="space-y-8">
        {narrativa.bloques.map((bloque, idx) => (
          <BloqueRenderer 
            key={idx} 
            bloque={bloque}
            imageIndex={imageBloques.findIndex((b) => b.id === bloque.id)}
            onImageClick={openLightbox}
          />
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Imagen principal */}
            {imageBloques.length > 0 && lightboxIndex < imageBloques.length && (
              <img
                src={imageBloques[lightboxIndex].contenido}
                alt={`Imagen ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Botón cerrar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Botón anterior */}
            {imageBloques.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Botón siguiente */}
            {imageBloques.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Contador */}
            {imageBloques.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                {lightboxIndex + 1} / {imageBloques.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

/**
 * Renderiza un bloque individual (texto o imagen)
 */
function BloqueRenderer({ 
  bloque, 
  imageIndex, 
  onImageClick 
}: { 
  bloque: NarrativaBloque;
  imageIndex: number;
  onImageClick: (index: number) => void;
}) {
  if (bloque.tipo === "texto") {
    return (
      <section className="space-y-3">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
            {bloque.contenido}
          </p>
        </div>
      </section>
    );
  }

  if (bloque.tipo === "imagen" && imageIndex !== -1) {
    return (
      <figure className="space-y-3">
        <div 
          className="w-full rounded-lg overflow-hidden bg-muted cursor-pointer group"
          onClick={() => onImageClick(imageIndex)}
        >
          <div className="relative aspect-video bg-muted overflow-hidden">
            <OptimizedImage
              src={bloque.contenido}
              alt="Imagen de narrativa"
              quality={85}
              objectFit="contain"
              className="w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            {/* Overlay con instrucción */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded">
                Click para ampliar
              </span>
            </div>
          </div>
        </div>
      </figure>
    );
  }

  return null;
}
