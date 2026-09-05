import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Archive,
  Building,
  Calendar,
  ChevronDown,
  Compass,
  History,
  Home,
  Mail,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useScrolledHeader } from "@/hooks/useScrolledHeader";
import logoImage from "@/assets/grupo-scout-logo.png";

interface NavLink {
  name: string;
  path: string;
  icon: React.ElementType;
  description?: string;
}

interface NavSection {
  label: string;
  links: NavLink[];
}

const mainLinks: NavLink[] = [
  { name: "Inicio", path: "/", icon: Home },
  { name: "Historia", path: "/historia", icon: History },
  { name: "Movimiento Scout", path: "/movimiento-scout", icon: Shield },
  { name: "Eventos", path: "/eventos", icon: Calendar },
  { name: "Contacto", path: "/contacto", icon: Mail },
];

const exploreSections: NavSection[] = [
  {
    label: "Archivo y memoria",
    links: [
      { name: "Archivo", path: "/archivo", icon: Archive, description: "Historia documentada del grupo" },
      { name: "Scoutpedia", path: "/archivo/scoutpedia", icon: Compass, description: "Conocimiento y método scout" },
      { name: "Locales", path: "/archivo/locales", icon: Building, description: "Los espacios que habitamos" },
    ],
  },
  {
    label: "Comunidad",
    links: [
      { name: "Educadores", path: "/educadores", icon: Users, description: "Equipo de educadores" },
      { name: "Plataforma interna", path: "/interno", icon: Settings, description: "Acceso para miembros" },
    ],
  },
];

const mobileSections: NavSection[] = [
  { label: "Conocer el grupo", links: mainLinks },
  ...exploreSections,
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isScrolled = useScrolledHeader();

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/historia" && location.pathname === "/linea-temporal") return true;
    if (path === "/eventos" && location.pathname === "/bauen") return true;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const exploreActive = exploreSections.some((section) =>
    section.links.some((link) => isActive(link.path)),
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3">
        <nav
          aria-label="Navegación principal"
          className={cn(
            "pointer-events-auto mx-auto max-w-[1480px] overflow-visible rounded-[22px] border border-white/10 bg-[#080c14]/92 text-white shadow-[0_10px_40px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300",
            isScrolled && "border-white/15 bg-[#080c14]/97 shadow-[0_18px_52px_-20px_rgba(0,0,0,0.9)]",
          )}
        >
          <div className="relative flex h-14 items-center gap-3 px-3 sm:h-16 sm:px-4 lg:px-5">
            <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" aria-hidden="true" />

            <Link
              to="/"
              className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Grupo Scout Séptimo, ir al inicio"
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-secondary/30 bg-white/5 shadow-inner sm:h-11 sm:w-11">
                <img
                  src={logoImage}
                  alt=""
                  className="h-9 w-9 object-contain transition-transform duration-300 motion-safe:group-hover:scale-105 sm:h-10 sm:w-10"
                  loading="eager"
                  decoding="async"
                />
              </span>
              <span className="hidden min-w-0 xl:block">
                <span className="block truncate font-bold leading-tight text-white">Grupo Scout Séptimo</span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Montevideo · desde 1964
                </span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              <div className="flex items-center gap-0.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-1">
                {mainLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active && "bg-white/[0.09] text-white shadow-sm",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
                      <span>{link.name}</span>
                      {active ? <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                    </Link>
                  );
                })}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 rounded-xl px-3 text-xs text-white/68 hover:bg-white/[0.07] hover:text-white",
                        exploreActive && "bg-white/[0.09] text-white",
                      )}
                    >
                      <Sparkles className={cn("h-3.5 w-3.5", exploreActive && "text-secondary")} />
                      Explorar
                      <ChevronDown className="h-3.5 w-3.5 text-white/45" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" sideOffset={12} className="w-72 rounded-2xl p-2 shadow-xl">
                    {exploreSections.map((section, sectionIndex) => (
                      <div key={section.label}>
                        {sectionIndex > 0 ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {section.label}
                        </DropdownMenuLabel>
                        {section.links.map((link) => {
                          const Icon = link.icon;
                          return (
                            <DropdownMenuItem key={link.path} asChild>
                              <Link
                                to={link.path}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5",
                                  isActive(link.path) && "bg-primary/10 text-primary",
                                )}
                              >
                                <span className="mt-0.5 rounded-lg bg-muted p-1.5 text-foreground"><Icon className="h-4 w-4" /></span>
                                <span><span className="block text-sm font-semibold">{link.name}</span><span className="block text-xs text-muted-foreground">{link.description}</span></span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
              <Button asChild size="sm" className="h-10 rounded-xl px-4 shadow-[0_8px_24px_-10px_hsl(var(--primary))]">
                <Link to="/interno"><Shield className="h-4 w-4" />Plataforma interna</Link>
              </Button>
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] [&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
                <ThemeToggle />
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5 xl:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] [&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
                <ThemeToggle />
              </span>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                    aria-label="Abrir menú"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="public-mobile-navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex h-[100dvh] w-[90vw] max-w-sm flex-col overflow-hidden border-l-border/60 p-0">
                  <div className="shrink-0 bg-[#080c14] px-6 pb-6 pt-7 text-white">
                    <SheetHeader className="text-left">
                      <div className="mb-3 flex items-center gap-3">
                        <img src={logoImage} alt="" className="h-11 w-11 object-contain" />
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Siempre listos</span>
                      </div>
                      <SheetTitle className="text-left text-2xl text-white">Explorá el Séptimo</SheetTitle>
                      <SheetDescription className="text-left text-white/60">Historia, actividades y comunidad scout en un solo lugar.</SheetDescription>
                    </SheetHeader>
                  </div>
                  <div id="public-mobile-navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                    {mobileSections.map((section) => (
                      <section key={section.label} className="mb-6 last:mb-0">
                        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{section.label}</p>
                        <div className="space-y-1">
                          {section.links.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.path);
                            return (
                              <Link
                                key={link.path}
                                to={link.path}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-foreground",
                                  "hover:border-border/70 hover:bg-muted/60",
                                  active && "border-primary/20 bg-primary/10 text-primary",
                                )}
                              >
                                <span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-muted", active && "bg-primary text-primary-foreground")}><Icon className="h-4 w-4" /></span>
                                <span>{link.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="shrink-0 border-t bg-background/95 p-4">
                    <Button asChild className="h-12 w-full rounded-xl"><Link to="/interno"><Shield className="h-4 w-4" />Entrar a la plataforma</Link></Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>
      <div className="h-[4.5rem] sm:h-[5.25rem]" aria-hidden="true" />
    </>
  );
}
