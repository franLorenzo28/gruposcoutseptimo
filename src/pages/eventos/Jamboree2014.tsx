import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, MapPin, CalendarDays, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";

const Jamboree2014 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen page-animate">
      <section className="relative overflow-hidden pb-12 pt-24 sm:pt-28 md:pt-32 bg-gradient-to-b from-background via-background/95 to-muted/25">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/eventos/jamborees")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Jamborees
          </Button>

          <Reveal className="max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              Narrativa Histórica
            </div>

            <h1 className="text-4xl font-extrabold leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent sm:text-5xl md:text-6xl">
              Jamboree Panamericano
              <span className="block text-primary">Chile 2014</span>
            </h1>

            <div className="mt-8 flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Chile</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>2014</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Rovers y vivencias inolvidables</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Reveal className="mb-16">
            <p className="text-xs text-primary font-semibold mb-2">Narrativa de</p>
            <h2 className="text-3xl font-bold mb-2">Josefina Mazzie Alé (Rover)</h2>
            <p className="text-sm text-muted-foreground">Registrada el 14 de Julio de 2014</p>
          </Reveal>

          <div className="space-y-16 sm:space-y-20 text-muted-foreground">
            <Reveal delay={0.1}>
              <div className="max-w-2xl">
                <p className="leading-relaxed text-base">
                  El primer día que llegamos al JamPan, después de armar todo y descansar un rato, empezamos a oír una música a lo lejos, al parecer era un batucada y decidimos ir a ver y más que claro, a bailar.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">El Ambiente Espectacular</h3>
                <p className="leading-relaxed text-base">
                  Llegamos y había gente de varios países bailando, riendo, un ambiente espectacular; nos pusimos a bailar y después de un rato volvimos al rincón.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="border-t border-red-500/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">Primeros Síntomas</h3>
                <p className="leading-relaxed text-base">
                  Luego, ya más o menos a las 8 de la noche me empecé a sentir mal del estómago y cada vez peor, probablemente por la cantidad inimaginable de porquerías chilenas que había comido toda la semana anterior.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="border-t border-red-500/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-16">
                <h3 className="text-lg font-semibold text-foreground mb-4">Las 3 de la Mañana</h3>
                <p className="leading-relaxed text-base">
                  Y antes de que me diera cuenta eran las 3 de la mañana y yo no me podía dormir de la náuseas, así que decidí levantarme, ir al baño y hacer lo mío, eso requirió un esfuerzo imponente.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="border-t border-blue-500/30 pt-10 max-w-3xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">El Encuentro Inesperado</h3>
                <p className="leading-relaxed text-base mb-4">
                  Cuando llego al baño y concreto la cosa, mientras me lavaba la cara veo entrar por la puerta a Facundo Sosa, en exactamente las mismas condiciones que yo, solo que no llegó al baño… sí, vómito en la carpa y sobre todos sus compañeros.
                </p>
                <p className="leading-relaxed text-base italic text-primary/80">
                  En el momento que nos miramos nos entramos a reír a carcajadas, no podíamos creer que estábamos en la misma y justo en el mismo momento.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-12">
                <h3 className="text-lg font-semibold text-foreground mb-4">Los Días Siguientes</h3>
                <p className="leading-relaxed text-base">
                  Después de esa noche seguimos enfermos por probablemente 4 o 5 días más, pero estábamos juntos, comiendo 1 galleta de agua por día y viendo cómo todos nuestros amigos iban a las actividades mientras nosotros estábamos muertos durmiendo sobre el sobre de dormir.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="border-t border-yellow-500/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">La Fama Instantánea</h3>
                <p className="leading-relaxed text-base">
                  Obviamente todo el Jam Pan se enteró y se corría la voz de que el séptimo estaba pasando por una situación difícil.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="border-t border-border/30 pt-10 max-w-xl ml-auto pr-4 sm:pr-16">
                <h3 className="text-lg font-semibold text-foreground mb-4">La Recuperación</h3>
                <p className="leading-relaxed text-base">
                  Después de cuidarnos mutuamente y tomar mucha agua nos curamos y pudimos participar de las actividades.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="border-t border-primary/30 pt-10 max-w-2xl">
                <h3 className="text-lg font-semibold text-foreground mb-4">La Reflexión Final</h3>
                <p className="leading-relaxed text-base">
                  Nosotros no lo vimos como algo negativo en lo absoluto ya que la experiencia hizo que nos uniéramos mucho más.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jamboree2014;
