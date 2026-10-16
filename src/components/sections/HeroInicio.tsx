import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageProps } from "@/lib/optimized-images";

const highlights = [
  { value: "+61", label: "Años de historia" },
  { value: "+100", label: "Scouts activos" },
];

export default function HeroInicio() {
  const heroImages = getOptimizedImageProps("hero");

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col justify-center overflow-hidden bg-scout-black text-white sm:min-h-[calc(100svh-5.25rem)]"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <OptimizedImage {...heroImages} alt="" className="absolute inset-0" objectFit="cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-scout-black/90 via-scout-black/75 to-scout-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-scout-black/65 via-transparent to-scout-black/20" />
      </div>

      <div className="container relative mx-auto w-full px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:py-16">
        <div className="max-w-[850px]">
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-scout-black/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white sm:text-sm">
              <MapPin className="size-4" aria-hidden="true" /> Montevideo · desde 1964
            </p>
          </Reveal>
          <Reveal>
            <h1 id="hero-title" className="max-w-[13ch] font-bold leading-[0.98] tracking-tight text-[clamp(2.9rem,6.3vw,6.25rem)]">
              <span className="block text-primary">Grupo Scout Séptimo</span>
              <span className="mt-2 block text-white">Montevideo</span>
            </h1>
          </Reveal>
          <Reveal>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg lg:text-xl">
              Grupo Scout de Montevideo donde niños, adolescentes y jóvenes crecen en comunidad, servicio y aventura al aire libre aplicando el método scout.
            </p>
          </Reveal>
          <Reveal>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button asChild size="lg" variant="hero" className="min-h-12 w-full px-7 text-base sm:w-auto">
                <Link to="/contacto#formulario">Quiero sumarme <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-12 w-full border-white/70 bg-scout-black/35 px-7 text-base text-white hover:bg-white/15 hover:text-white sm:w-auto">
                <a href="#unidades">Conocer las unidades</a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-white/80">Puedes consultar por tu primera visita sin crear una cuenta.</p>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/30 pt-5 sm:mt-12" aria-label="Datos del grupo">
            {highlights.map((item) => (
              <div key={item.label} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-secondary sm:text-3xl">{item.value}</span>
                <span className="text-sm font-medium text-white/85">{item.label}</span>
              </div>
            ))}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-secondary sm:text-3xl">1</span>
              <span className="text-sm font-medium text-white/85">Local Scout</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
