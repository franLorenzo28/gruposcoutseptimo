import { Reveal } from "@/components/Reveal";
import { Users } from "lucide-react";

const Compania = () => {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="bg-blob w-72 h-72 bg-primary/10 -top-20 -right-16 float-slow" />
          <div className="bg-blob w-64 h-64 bg-muted/20 -bottom-16 -left-12 drift-slow" />
          <div className="bg-blob w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400/22 top-[55%] left-[8%] float-slow" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full mb-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm">
                Archivo · Compañía
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Sección Compañía
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              En proceso de migración desde wiki.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Compania;



