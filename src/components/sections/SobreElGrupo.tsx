import {
  Shield,
  Heart,
  Compass,
  Tent,
  Users,
  Flame,
  Sparkles,
  Stars,
  Mountain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Reveal } from "@/components/Reveal";
import communityImage from "@/assets/community-scouts.jpg";
import tropaPopupImage from "@/assets/sistema de patrullas.jpg";
import heroImage from "@/assets/hero-scouts.jpg";

const WolfHowlingIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M17 4.5c1.1.2 2 .8 2.8 1.6M17.8 2.2c1.8.3 3.4 1.2 4.6 2.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M11.8 8.4 9.7 5.5 7.2 9l-2.9 1.8c-.5.3-.7.9-.5 1.4l1.2 3.2c.1.4.5.7.9.8l4.8 1.1 1.7 3c.3.5.9.8 1.5.6l3.1-.9c.6-.2 1-.8.9-1.5l-.4-3.1 1.8-3.2c.3-.5.2-1.1-.2-1.5l-2.6-2.3-3.4.1Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11.2" cy="11.2" r=".9" fill="currentColor" />
  </svg>
);

const About = () => {
  const branches = [
    {
      icon: WolfHowlingIcon,
      title: "Manada",
      description:
        "Niños de 7 a 10 años, aprenden jugando y descubriendo el mundo scout",
      route: "manada",
      hoverClass: "hover:bg-[#FEB21A] hover:text-white dark:hover:bg-[#FEB21A] dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-[#FEB21A] dark:group-hover:bg-[#FEB21A]",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "En la Manada los niños descubren el mundo a través del juego, canciones, exploraciones y desafíos simples. Inspirados en El Libro de la Selva, cada encuentro despierta su curiosidad y amor por la naturaleza, aprendiendo valores como la amistad, el respeto y la ayuda mutua en un ambiente divertido y seguro.",
    },
    {
      icon: Compass,
      title: "Tropa",
      description:
        "Jóvenes de 11 a 14 años, desarrollan habilidades y trabajo en equipo",
      route: "tropa",
      image: tropaPopupImage,
      hoverClass: "hover:bg-[#344F1F] hover:text-white dark:hover:bg-[#344F1F] dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-[#344F1F] dark:group-hover:bg-[#344F1F]",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "La Tropa es pura aventura: patrullas, construcciones, campamentos y proyectos donde aprenden a trabajar en equipo, tomar decisiones y asumir responsabilidades. Cada actividad es una oportunidad para vivir la Ley y la Promesa Scout, construyendo carácter y compromiso bajo las estrellas.",
    },
    {
      icon: Tent,
      title: "Pioneros",
      description:
        "Adolescentes de 15 a 17 años, lideran proyectos y asumen responsabilidades",
      route: "pioneros",
      hoverClass: "hover:bg-[#134686] hover:text-white dark:hover:bg-[#134686] dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-[#134686] dark:group-hover:bg-[#134686]",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "Los Pioneros ponen manos a la obra organizando actividades solidarias, proyectos comunitarios y campamentos de servicio. Con espíritu crítico y creativo, transforman su entorno y dejan huella positiva en su grupo y comunidad, comprometiéndose con un mundo más justo y sostenible.",
    },
    {
      icon: Flame,
      title: "Rovers",
      description:
        "Jóvenes adultos de 18 a 21 años, servicio a la comunidad y liderazgo",
      route: "rovers",
      hoverClass: "hover:bg-[#DD0303] hover:text-white dark:hover:bg-[#DD0303] dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-[#DD0303] dark:group-hover:bg-[#DD0303]",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "Los Rovers emprenden su propio camino de crecimiento personal a través de proyectos de servicio, viajes y experiencias que consolidan su identidad como ciudadanos activos. Aprenden a vivir con sentido, con los valores scouts como brújula y el corazón dispuesto a servir donde haga falta.",
    },
    {
      icon: Users,
      title: "Educadores",
      description:
        "Educadores scouts que guían y acompañan el desarrollo de las ramas",
      route: "staff",
      hoverClass: "hover:bg-violet-700 hover:text-white dark:hover:bg-violet-700 dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-violet-700 dark:group-hover:bg-violet-700",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "Los Educadores Scouts son voluntarios que dedican su tiempo a planificar actividades, capacitarse y acompañar el crecimiento de cada niño y joven. Desde la vocación y el compromiso, son testimonio vivo de los valores scouts, formando personas libres, responsables y felices.",
    },
    {
      icon: Shield,
      title: "Comité de Padres",
      description: "Padres y colaboradores que apoyan la gestión del grupo",
      route: "comite",
      hoverClass: "hover:bg-zinc-600 hover:text-white dark:hover:bg-zinc-600 dark:hover:text-white",
      iconHoverBgClass: "group-hover:bg-zinc-600 dark:group-hover:bg-zinc-600",
      hoverIconClass: "group-hover:text-white",
      detailText:
        "El Comité de Padres organiza eventos, gestiona recursos, mantiene el local y colabora en cada campamento y actividad importante. Su participación fortalece la comunidad scout y demuestra que cuando las familias se comprometen, los sueños de los chicos se hacen realidad.",
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Promesa y Ley Scout",
      description:
        "Los fundamentos morales y éticos que guían nuestro comportamiento y desarrollo personal",
    },
    {
      icon: Tent,
      title: "Vida en la Naturaleza",
      description:
        "El contacto directo con el medio ambiente como espacio de aprendizaje y crecimiento",
    },
    {
      icon: Compass,
      title: "Aprendizaje por la Acción",
      description:
        "Educación activa a través de la experiencia directa y la práctica constante",
    },
    {
      icon: Heart,
      title: "Valores y Virtudes",
      description:
        "Desarrollo del carácter y la formación integral basada en valores scouts universales",
    },
  ];

  const highlights = [
    {
      value: "+61",
      label: "años de historia viva",
      detail: "Tradición scout en Montevideo desde 1964",
      bg: "bg-primary/20",
    },
    {
      value: "+100",
      label: "scouts activos",
      detail: "Niños, adolescentes y jóvenes en formación",
      bg: "bg-[#feb21a]/25",
    },
    {
      value: "+25",
      label: "educadores activos en el staff",
      detail: "Voluntarios que sostienen y acompañan cada proceso",
      bg: "bg-emerald-500/20",
    },
    {
      value: "1",
      label: "más allá de un grupo scout",
      detail: "Ya es como una familia",
      bg: "bg-sky-500/20",
    },
  ];

  return (
    <>
      {/* Quiénes Somos */}
      <section
        id="quienes-somos"
        className="relative overflow-hidden section-padding bg-background/60 backdrop-blur-sm"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#feb21a]/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid max-w-7xl items-stretch gap-8 md:grid-cols-[1.15fr_0.85fr] lg:gap-12 mx-auto">
            <Reveal>
              <div id="historia" className="relative rounded-3xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  Comunidad educativa al aire libre
                </div>
                <h2 className="mb-5 bg-gradient-to-r from-primary via-primary/85 to-primary/55 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
                  Quiénes Somos
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Somos un Grupo Scout, una comunidad que acompaña el crecimiento de niños, niñas, jóvenes y adolescentes a través del juego, la aventura, el servicio y la vida al aire libre.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Formamos parte del Movimiento Scout del Uruguay y del Movimiento Scout Mundial, un espacio presente en más de 170 países, que busca contribuir a la construcción de un mundo mejor.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  En nuestro grupo, las distintas unidades comparten un mismo camino: aprender haciendo, desarrollar habilidades, fortalecer valores y descubrir el poder del trabajo en equipo.
                </p>
                <p className="mt-4 text-base font-semibold leading-relaxed text-primary sm:text-lg">
                  Ser scout es vivir con una sonrisa, con la mochila llena de experiencias y con el corazón dispuesto a servir.
                </p>
                <div className="pt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/historia">Conoce nuestra historia</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link to="/contacto">Únete al grupo</Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2 overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
                  <img
                    src={heroImage}
                    alt="Grupo Scout Séptimo en actividad"
                    className="h-[240px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-[320px]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-lg backdrop-blur-sm">
                  <Stars className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Promesa y ley en acción</p>
                  <p className="mt-2 text-sm text-muted-foreground">Aprender con desafíos reales y decisiones compartidas.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-lg backdrop-blur-sm">
                  <Mountain className="h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Aventura con sentido</p>
                  <p className="mt-2 text-sm text-muted-foreground">Campamentos, servicio y vida en naturaleza durante todo el año.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-14 sm:py-20">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={communityImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-scout-black/85 via-scout-black/55 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4">
          <Reveal className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Vivir el escultismo es vivir en comunidad
              </h2>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-6">
              Aventuras al aire libre, fogones que unen generaciones y proyectos
              que dejan huella. Cada encuentro suma una historia nueva.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/galeria">Ver fotos del grupo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-white border-white/50 hover:bg-white/10">
                <Link to="/eventos">Próximos eventos</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-b from-background/60 to-muted/35">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((item) => (
                <Card key={item.label} className="group overflow-hidden rounded-2xl border-0 bg-transparent shadow-none transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className={`h-full rounded-2xl ${item.bg} p-6`}>
                      <p className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">{item.value}</p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">{item.label}</p>
                      <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Ramas y Pilares */}
      <section id="ramas" className="section-padding bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
                Nuestras Unidades
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Cada etapa del escultismo está diseñada para acompañar el
                crecimiento y desarrollo de nuestros jóvenes.
              </p>
            </Reveal>

            <div className="grid grid-cols-2 gap-3 py-2 sm:gap-4 sm:py-4 mb-8 sm:mb-12 md:grid-cols-3 xl:grid-cols-6">
              {branches.map((branch) => {
                return (
                  <div key={branch.title} className="contents">
                    <Reveal>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Card
                            className={`card-hover border border-border/60 shadow-sm cursor-pointer transition-all duration-300 group h-[190px] sm:h-[190px] w-full ${branch.hoverClass}`}
                          >
                            <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center h-full text-center gap-2.5">
                              <div className={`w-14 h-14 bg-muted/30 rounded-xl flex items-center justify-center transition-all duration-300 ${branch.iconHoverBgClass}`}>
                                <branch.icon
                                  className={`w-7 h-7 text-current transition-colors duration-300 ${branch.hoverIconClass}`}
                                />
                              </div>
                              <h3 className="text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem] flex items-center transition-colors duration-300">
                                {branch.title}
                              </h3>
                              <p className="text-xs text-muted-foreground group-hover:text-white line-clamp-2 min-h-[2rem] transition-colors duration-300">
                                {branch.description}
                              </p>
                            </CardContent>
                          </Card>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border/70 bg-card/95 backdrop-blur-lg">
                          <div className="grid gap-6 items-start md:grid-cols-2">
                            <div>
                              <DialogTitle className="text-2xl mb-4">
                                {branch.title}
                              </DialogTitle>
                              <DialogDescription className="space-y-4">
                                <p className="text-base text-foreground/90">{branch.description}</p>
                                <p className="text-muted-foreground">{branch.detailText}</p>
                              </DialogDescription>
                            </div>

                            <div className="w-full space-y-4">
                              <div className="overflow-hidden rounded-xl border border-border/60">
                                <img
                                  src={branch.image ?? communityImage}
                                  alt={`Foto representativa de la rama ${branch.title}`}
                                  className={`w-full bg-transparent ${
                                    branch.route === "tropa"
                                      ? "max-h-[420px] object-cover"
                                      : "aspect-video object-cover"
                                  }`}
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                              <div className="flex gap-3 justify-end">
                                <DialogClose asChild>
                                  <Button variant="outline" size="sm">
                                    Cerrar
                                  </Button>
                                </DialogClose>
                                <Button asChild size="sm">
                                  <Link to={`/ramas/${branch.route}`}>
                                    Más información
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Values Grid - Pilares */}
          <Reveal>
            <div className="bg-card/80 text-foreground border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-xl">
              <div id="pilares" className="text-center mb-6 sm:mb-10">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
                  Los Pilares del Escultismo
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                  Cuatro fundamentos que nos guían en la formación integral de
                  nuestros jóvenes
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="card-hover border border-border/60 shadow-md bg-background/70 backdrop-blur-sm group"
                >
                  <CardContent className="p-6 space-y-2">
                    <div>
                      <h4 className="text-lg font-bold mb-2">{value.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </>
  );
};

export default About;


