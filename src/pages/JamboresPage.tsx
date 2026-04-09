import { Suspense } from "react";
import { Reveal } from "@/components/Reveal";
import JamboresMundiales from "@/components/sections/JamboresMundiales";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function JamboresPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Jamborees Mundiales</span>
          </nav>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              Jamborees Mundiales
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explora la historia de los encuentros scouts más grandes del mundo,
              donde miles de jóvenes de diferentes países se reúnen cada cuatro
              años para vivirla aventura scout.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <Reveal>
          <Suspense fallback={<div>Cargando jamborees...</div>}>
            <JamboresMundiales />
          </Suspense>
        </Reveal>
      </div>
    </div>
  );
}
