import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Upload,
  User2,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemeToggle from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/grupo-scout-logo.png";

interface InternalNavLink {
  to: string;
  label: string;
  icon: React.ElementType;
}

const primaryLinks: InternalNavLink[] = [
  { to: "/interno/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/interno/usuarios", label: "Comuni 7", icon: User2 },
  { to: "/interno/documentos", label: "Documentos", icon: FolderOpen },
  { to: "/interno/anuncios", label: "Anuncios", icon: BellRing },
  { to: "/interno/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/interno/subidas", label: "PPP", icon: Upload },
  { to: "/interno/configuracion", label: "Configuración", icon: Settings },
];

const secondaryLinks: InternalNavLink[] = [
  { to: "/interno/narrativas", label: "Narrativas", icon: BookOpen },
  { to: "/interno/planificacion", label: "Planificación", icon: CalendarCheck },
];

const allLinks = [...primaryLinks, ...secondaryLinks];

export function InternalPlatformNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, session, logout } = useMemberAuth();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    logout();
  }, [logout]);

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

  const isActive = (path: string) => {
    if (path === "/interno") return location.pathname === "/interno";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isSecondaryActive = secondaryLinks.some(
    (link) => isActive(link.to),
  );

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm bg-slate-950/82 dark:bg-slate-950/82 supports-[backdrop-filter]:bg-slate-950/70 border-b border-white/10",
          isScrolled && "shadow-md",
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative flex h-16 items-center justify-between md:h-20">
            {/* Logo */}
            <Link
              to="/interno/dashboard"
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
                <h1 className="whitespace-nowrap text-base xl:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-none">
                  Plataforma Interna
                </h1>
                <p className="whitespace-nowrap text-xs text-white/70 mt-1">
                  Grupo Scout Séptimo
                </p>
              </div>
            </Link>

            {/* Desktop Right Section: Pills + Actions */}
            <div className="hidden items-center gap-2 xl:flex min-w-0">
              {/* Pills */}
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/55 px-2 py-1 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm dark:bg-slate-950/55">
                {primaryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      to={link.to}
                      className={cn(
                        "relative px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 group nav-link-underline [will-change:transform]",
                        "hover:bg-white/10 hover:text-primary",
                        isActive(link.to) ? "text-white nav-link-underline--active" : "text-white/80",
                      )}
                    >
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Icon className="h-3.5 w-3.5" />
                        {link.label}
                      </span>
                    </Link>
                  );
                })}

                {/* More dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "px-3 py-2 text-xs md:text-sm font-medium rounded-full transition-all duration-300",
                        "hover:bg-white/10 hover:text-primary",
                        isSecondaryActive ? "text-white nav-link-underline--active" : "text-white/80",
                      )}
                    >
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        Más
                        <ChevronDown className="ml-0.5 h-3 w-3" />
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {secondaryLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.to} asChild>
                          <Link
                            to={link.to}
                            className={cn(
                              "flex items-center gap-2 px-2 py-2 cursor-pointer",
                              isActive(link.to) && "bg-primary/10 text-primary font-semibold",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
                  title="Sitio público"
                >
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                    Sitio público
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
                  title="Admin"
                >
                  <Link to="/admin">
                    <Shield className="h-4 w-4 text-primary" />
                    Admin
                  </Link>
                </Button>

                <ThemeToggle />

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/10 transition-all duration-300 outline-none">
                        <UserAvatar userName={session?.nombre} size="sm" />
                        <ChevronDown className="h-3 w-3 text-white/60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} collisionPadding={16} className="w-56">
                      <div className="flex items-center gap-3 p-2">
                        <UserAvatar userName={session?.nombre} size="sm" />
                        <div className="flex flex-col space-y-0.5 leading-none min-w-0">
                          <p className="font-medium text-sm truncate">{session?.nombre || "Usuario"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {session?.rama ? `Rama: ${session.rama}` : "Miembro"}
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-muted my-1" />
                      <DropdownMenuItem asChild>
                        <Link to="/interno/perfil" className="cursor-pointer flex w-full items-center">
                          <User2 className="mr-2 h-4 w-4" />
                          <span>Ver Perfil</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/interno/configuracion" className="cursor-pointer flex w-full items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configuración</span>
                        </Link>
                      </DropdownMenuItem>
                      <div className="h-px bg-muted my-1" />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive flex w-full items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link to="/interno/auth">Iniciar Sesión</Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="ml-auto flex items-center gap-2 xl:hidden">
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="xl:hidden text-white"
                    aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={isMobileMenuOpen}
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
                    <SheetTitle className="text-left">Plataforma Interna</SheetTitle>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
                    <div className="flex flex-col gap-6 mt-6">
                      {/* User Section */}
                      {isAuthenticated ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                            <UserAvatar
                              userName={session?.nombre}
                              size="md"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium truncate">
                                {session?.nombre || "Usuario"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session?.rama ? `Rama: ${session.rama}` : "Miembro"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button asChild variant="default" className="w-full">
                          <Link to="/interno/auth">Iniciar Sesión</Link>
                        </Button>
                      )}

                      {/* Nav Links */}
                      <div className="space-y-1">
                        {allLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.to}
                              to={link.to}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300",
                                "hover:bg-nav-hover hover:text-primary",
                                isActive(link.to) ? "bg-primary text-primary-foreground" : "text-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-sm font-medium">{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Public site & Admin */}
                      <div className="space-y-1 pt-4 border-t">
                        <Link
                          to="/"
                          className="flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 hover:bg-muted/30 hover:text-primary text-foreground"
                        >
                          <ArrowLeft className="h-5 w-5" />
                          <span className="text-sm font-medium">Volver al sitio público</span>
                        </Link>
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 hover:bg-muted/30 hover:text-primary text-foreground"
                        >
                          <Shield className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Panel Admin</span>
                        </Link>
                        {isAuthenticated && (
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 hover:bg-destructive/10 text-destructive w-full text-sm"
                          >
                            <LogOut className="h-5 w-5" />
                            <span className="text-sm font-medium">Cerrar sesión</span>
                          </button>
                        )}
                      </div>
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
}
