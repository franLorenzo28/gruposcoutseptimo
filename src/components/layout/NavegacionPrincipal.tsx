import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  Home,
  Calendar,
  History,
  Mail,
  Users,
  Shield,
  Archive,
  Building,
  FileText,
  Compass,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/grupo-scout-logo.png";

interface NavLink {
  name: string;
  path?: string;
  icon?: React.ElementType;
  type?: "link" | "label" | "separator";
  subitems?: NavLink[];
}

interface NavSection {
  label: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    label: "Inicio",
    links: [
      { name: "Inicio", path: "/", icon: Home },
      { name: "Historia", path: "/historia", icon: History },
      { name: "Movimiento Scout", path: "/movimiento-scout", icon: Shield },
      { name: "Eventos", path: "/eventos", icon: Calendar },
      { name: "Contacto", path: "/contacto", icon: Mail },
    ],
  },
  {
    label: "Archivo",
    links: [
      {
        name: "Archivo",
        path: "/archivo",
        icon: FileText,
        type: "link",
        subitems: [
          { name: "Archivo", path: "/archivo", icon: Archive, type: "link" },
          { name: "Scoutpedia", path: "/archivo/scoutpedia", icon: Compass, type: "link" },
          { name: "Locales", path: "/archivo/locales", icon: Building, type: "link" },
        ],
      },
    ],
  },
  {
    label: "Comunidad",
    links: [
      { name: "Educadores", path: "/educadores", icon: Users },
      { name: "Plataforma Interna", path: "/interno", icon: Settings },
    ],
  },
];

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const activeParentPaths = navSections
      .flatMap((section) => section.links)
      .filter((link) => {
        if (!link.path || !link.subitems?.length) return false;
        return link.subitems.some((subitem) => {
          if (!subitem.path) return false;
          if (subitem.path === "/") return location.pathname === "/";
          return location.pathname === subitem.path || location.pathname.startsWith(`${subitem.path}/`);
        });
      })
      .map((link) => link.path as string);

    if (activeParentPaths.length === 0) return;
    setExpandedItems((prev) => Array.from(new Set([...prev, ...activeParentPaths])));
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm bg-slate-950/82 dark:bg-slate-950/82 supports-[backdrop-filter]:bg-slate-950/70 border-b border-white/10",
          isScrolled && "shadow-md",
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative flex h-16 items-center gap-3 md:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group shrink-0"
            >
              <div className="relative">
                <img
                  src={logoImage}
                  alt="Grupo Scout Séptimo"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain transition-transform group-hover:scale-110 [will-change:transform]"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-muted/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden xl:block">
                <span className="whitespace-nowrap text-base xl:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-none">
                  Grupo Scout Séptimo
                </span>
                <p className="whitespace-nowrap text-xs text-white/70 mt-1">
                  Montevideo, Uruguay
                </p>
              </div>
            </Link>

            {/* Desktop Main Links */}
            <div className="hidden min-w-0 flex-1 justify-center px-2 xl:flex xl:px-4 2xl:px-8">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/55 px-2 py-1 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm dark:bg-slate-950/55">
                {navSections[0]?.links.map((link) => {
                  const linkPath = link.path ?? "#";
                  const Icon = link.icon;
                  const isSpecialActive =
                    (linkPath === "/historia" && isActive("/linea-temporal")) ||
                    (linkPath === "/eventos" && isActive("/bauen"));
                  const active = isActive(linkPath) || isSpecialActive;

                  return (
                    <Link
                      key={linkPath}
                      to={linkPath}
                      className={cn(
                        "relative px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 group nav-link-underline [will-change:transform]",
                        "hover:bg-white/10 hover:text-primary",
                        active ? "text-white nav-link-underline--active" : "text-white/80",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {link.name}
                      </span>
                    </Link>
                  );
                })}

                {/* Desktop Dropdown único */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-3 py-2 text-xs md:text-sm font-medium text-white/80 hover:text-primary hover:bg-white/10"
                    >
                      <span className="whitespace-nowrap">Más</span>
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {navSections.slice(1).flatMap((section) =>
                      section.links.filter((link) => link.path !== "/interno" && link.path !== "/educadores").flatMap((link) => {
                        if (link.subitems && link.subitems.length > 0) {
                          return link.subitems.map((subitem) => {
                            const SubIcon = subitem.icon;
                            const subActive = isActive(subitem.path || "");
                            return (
                              <DropdownMenuItem key={subitem.path} asChild>
                                <Link
                                  to={subitem.path || "#"}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-2 cursor-pointer",
                                    subActive && "bg-primary/10 text-primary font-semibold"
                                  )}
                                >
                                  {SubIcon && <SubIcon className="h-4 w-4" />}
                                  <span>{subitem.name}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          });
                        }
                        const Icon = link.icon;
                        const active = isActive(link.path || "");
                        return (
                          <DropdownMenuItem key={link.path} asChild>
                            <Link
                              to={link.path || "#"}
                              className={cn(
                                "flex items-center gap-2 px-2 py-2 cursor-pointer",
                                active && "bg-primary/10 text-primary font-semibold"
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4" />}
                              <span>{link.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden shrink-0 items-center gap-2 xl:flex xl:gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-primary/45 hover:bg-primary/10 hover:text-white text-white gap-1.5 font-semibold"
              >
                <Link to="/interno">
                  <Shield className="h-4 w-4 text-primary" />
                  Plataforma Interna
                </Link>
              </Button>

              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="ml-auto flex items-center gap-2 xl:hidden">
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="xl:hidden"
                    aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation"
                    title={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex h-[100dvh] w-[85vw] max-w-[400px] flex-col overflow-hidden p-0 sm:w-[400px]"
                >
                  <SheetHeader className="shrink-0 border-b px-6 py-4 pr-12">
                    <SheetTitle className="text-left">Menú</SheetTitle>
                  </SheetHeader>
                  <div id="mobile-navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
                    <div className="flex flex-col gap-6 mt-6">
                      {navSections.map((section) => (
                        <div key={section.label} className="space-y-2">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            {section.label}
                          </h3>
                          <div className="space-y-1">
                            {section.links.map((link) => {
                              if (link.type === "separator") {
                                return (
                                  <div key={`separator-${link.name}`} className="pt-2">
                                    <div className="border-t border-muted mb-2" />
                                    {link.name && (
                                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                                        {link.name}
                                      </h4>
                                    )}
                                  </div>
                                );
                              }

                              const isExpanded = expandedItems.includes(link.path || "");
                              const hasSubitems = link.subitems && link.subitems.length > 0;

                              if (hasSubitems) {
                                return (
                                  <div key={link.path}>
                                    <button
                                      onClick={() => toggleExpanded(link.path || "")}
                                      className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300",
                                        "hover:bg-nav-hover hover:text-primary",
                                        isActive(link.path || "") ? "bg-primary text-primary-foreground" : "text-foreground",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        {link.icon && <link.icon className="h-5 w-5" />}
                                        <span className="text-sm font-medium">{link.name}</span>
                                      </div>
                                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                                    </button>
                                    {isExpanded && (
                                      <div className="pl-6 space-y-1 mt-1">
                                        {(link.subitems ?? []).map((subitem) => (
                                          <Link
                                            key={subitem.path}
                                            to={subitem.path || "#"}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                              "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300",
                                              "hover:bg-nav-hover hover:text-primary",
                                              isActive(subitem.path || "") ? "bg-primary text-primary-foreground" : "text-foreground text-sm",
                                            )}
                                          >
                                            {subitem.icon && <subitem.icon className="h-4 w-4" />}
                                            <span className="text-sm font-medium">{subitem.name}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <Link
                                  key={link.path}
                                  to={link.path || "#"}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 [will-change:transform]",
                                    "hover:bg-nav-hover hover:text-primary",
                                    isActive(link.path || "") ? "bg-primary text-primary-foreground" : "text-foreground",
                                  )}
                                >
                                  {link.icon && <link.icon className="h-5 w-5" />}
                                  <span className="text-sm font-medium">{link.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navigation;
