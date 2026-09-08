import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Images,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Shield,
  Upload,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemeToggle from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { useNotifications } from "@/context/Notifications";
import { NotificationsPopover } from "@/components/layout/NotificationsPanel";
import { useScrolledHeader } from "@/hooks/useScrolledHeader";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, resetLocalBackendAuth } from "@/lib/backend";
import logoImage from "@/assets/grupo-scout-logo.png";

interface InternalNavLink {
  to: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

interface InternalNavSection {
  label: string;
  links: InternalNavLink[];
}

const primaryLinks: InternalNavLink[] = [
  { to: "/interno/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/interno/usuarios", label: "Comuni 7", icon: User2 },
  { to: "/interno/mensajes", label: "Mensajes", icon: MessageCircle },
  { to: "/interno/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/interno/anuncios", label: "Anuncios", icon: BellRing },
];

const resourceLinks: InternalNavLink[] = [
  { to: "/interno/documentos", label: "Documentos", icon: FolderOpen, description: "Material institucional" },
  { to: "/interno/galeria", label: "Galería", icon: Images, description: "Fotos de la comunidad" },
  { to: "/interno/subidas", label: "PPP y subidas", icon: Upload, description: "Archivos de tu unidad" },
  { to: "/interno/narrativas", label: "Narrativas", icon: BookOpen, description: "Memoria e identidad" },
  { to: "/interno/planificacion", label: "Planificación", icon: CalendarCheck, description: "Ciclo de programa" },
  { to: "/interno/biblioteca", label: "Biblioteca", icon: Library, description: "Recursos pedagógicos" },
  { to: "/interno/formularios", label: "Formularios", icon: ClipboardList, description: "Fichas y autorizaciones" },
  { to: "/interno/configuracion", label: "Configuración", icon: Settings, description: "Perfil y preferencias" },
];

const mobileSections: InternalNavSection[] = [
  { label: "Comunidad", links: primaryLinks },
  { label: "Recursos y gestión", links: resourceLinks },
];

const allLinks = [...primaryLinks, ...resourceLinks];

export function InternalPlatformNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isScrolled = useScrolledHeader();
  const { isAuthenticated, session, logout } = useMemberAuth();
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    removeNotification,
    loadMore,
    hasMore,
    loadingMore,
    resolvedActions,
    resolveFollowRequest,
  } = useNotifications();

  const handleLogout = useCallback(async () => {
    if (isLocalBackend()) {
      await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/v1/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("grupo7_local_access_token") || ""}`,
        },
      }).catch(() => undefined);
      resetLocalBackendAuth();
    } else {
      await supabase.auth.signOut();
    }
    logout();
  }, [logout]);

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  const isActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname],
  );

  const resourcesActive = resourceLinks.some((link) => isActive(link.to));
  const currentLabel = useMemo(
    () => allLinks.find((link) => isActive(link.to))?.label ?? "Plataforma interna",
    [isActive],
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3">
        <nav
          aria-label="Navegación de la plataforma interna"
          className={cn(
            "pointer-events-auto mx-auto max-w-[1480px] rounded-[22px] border border-white/10 bg-[#080c14]/[0.92] text-white shadow-[0_10px_40px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300",
            isScrolled && "border-white/15 bg-[#080c14]/[0.97] shadow-[0_18px_52px_-20px_rgba(0,0,0,0.9)]",
          )}
        >
          <div className="relative flex h-14 items-center gap-3 px-3 sm:h-16 sm:px-4 lg:px-5">
            <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-secondary/90 to-transparent" aria-hidden="true" />

            <Link
              to="/interno/dashboard"
              className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              aria-label="Plataforma interna, ir al dashboard"
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-secondary/30 bg-white/5 sm:h-11 sm:w-11">
                <img src={logoImage} alt="" className="h-9 w-9 object-contain transition-transform duration-300 motion-safe:group-hover:scale-105 sm:h-10 sm:w-10" loading="eager" decoding="async" />
              </span>
              <span className="min-w-0">
                <span className="hidden truncate text-sm font-bold leading-tight text-white 2xl:block">Plataforma interna</span>
                <span className="block max-w-[145px] truncate text-xs font-semibold text-white sm:hidden">{currentLabel}</span>
                <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary/80 2xl:block">Grupo Scout Séptimo</span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              <div className="flex items-center gap-0.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-1">
                {primaryLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
                        active && "bg-white/[0.09] text-white shadow-sm",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", active && "text-secondary")} />
                      {link.label}
                      {active ? <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-secondary" aria-hidden="true" /> : null}
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
                        resourcesActive && "bg-white/[0.09] text-white",
                      )}
                    >
                      <FolderOpen className={cn("h-3.5 w-3.5", resourcesActive && "text-secondary")} />
                      Recursos
                      <ChevronDown className="h-3.5 w-3.5 text-white/45" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" sideOffset={12} className="w-[340px] rounded-2xl p-2 shadow-xl">
                    <DropdownMenuLabel className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Herramientas de la plataforma</DropdownMenuLabel>
                    <div className="grid grid-cols-2 gap-1">
                      {resourceLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <DropdownMenuItem key={link.to} asChild>
                            <Link
                              to={link.to}
                              className={cn(
                                "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2.5",
                                isActive(link.to) && "bg-secondary/15 text-foreground",
                              )}
                            >
                              <span className="mt-0.5 rounded-lg bg-muted p-1.5"><Icon className="h-4 w-4" /></span>
                              <span className="min-w-0"><span className="block truncate text-xs font-bold">{link.label}</span><span className="block truncate text-[10px] text-muted-foreground">{link.description}</span></span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Button asChild variant="ghost" size="icon" className="hidden h-9 w-9 rounded-xl text-white/60 hover:bg-white/10 hover:text-white 2xl:inline-flex" title="Sitio público">
                <Link to="/" aria-label="Volver al sitio público"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden h-9 w-9 rounded-xl text-white/60 hover:bg-white/10 hover:text-white 2xl:inline-flex" title="Panel administrativo">
                <Link to="/admin" aria-label="Abrir panel administrativo"><Shield className="h-4 w-4 text-primary" /></Link>
              </Button>
              <span className="hidden h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] [&_button]:h-9 [&_button]:w-9 [&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:hover:text-white sm:grid"><ThemeToggle /></span>

              {isAuthenticated ? (
                <NotificationsPopover
                  notifications={notifications}
                  unreadCount={unreadCount}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  onMarkAllRead={markAllRead}
                  onMarkRead={markRead}
                  onRemove={removeNotification}
                  onLoadMore={loadMore}
                  resolvedActions={resolvedActions}
                  onResolveRequest={resolveFollowRequest}
                  align="end"
                >
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white" aria-label="Notificaciones">
                    <BellRing className="h-4 w-4" />
                    {unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#080c14] bg-primary px-1 text-[9px] font-black text-white">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
                  </Button>
                </NotificationsPopover>
              ) : null}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-1.5 pr-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:flex">
                      <UserAvatar userName={session?.nombre} size="sm" />
                      <span className="hidden max-w-24 truncate text-xs font-semibold text-white/80 2xl:block">{session?.nombre || "Usuario"}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-white/45" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12} collisionPadding={16} className="w-64 rounded-2xl p-2">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <UserAvatar userName={session?.nombre} size="sm" />
                      <div className="min-w-0"><p className="truncate text-sm font-bold">{session?.nombre || "Usuario"}</p><p className="truncate text-xs text-muted-foreground">{session?.rama ? `Rama: ${session.rama}` : "Miembro"}</p></div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/interno/perfil" className="cursor-pointer rounded-xl"><User2 className="mr-2 h-4 w-4" />Ver perfil</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/interno/configuracion" className="cursor-pointer rounded-xl"><Settings className="mr-2 h-4 w-4" />Configuración</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-xl text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white xl:hidden" aria-label="Abrir menú" aria-expanded={isMobileMenuOpen} aria-controls="internal-mobile-navigation"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex h-[100dvh] w-[90vw] max-w-sm flex-col overflow-hidden p-0">
                  <div className="shrink-0 bg-[#080c14] px-6 pb-6 pt-7 text-white">
                    <SheetHeader className="text-left">
                      <div className="mb-3 flex items-center gap-3"><img src={logoImage} alt="" className="h-11 w-11 object-contain" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Área de miembros</p><p className="mt-1 max-w-[220px] truncate text-sm font-semibold text-white/80">{session?.nombre || "Grupo Scout Séptimo"}</p></div></div>
                      <SheetTitle className="text-left text-2xl text-white">{currentLabel}</SheetTitle>
                      <SheetDescription className="text-left text-white/60">Organizá la vida del grupo desde cualquier dispositivo.</SheetDescription>
                    </SheetHeader>
                  </div>
                  <div id="internal-mobile-navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                    {mobileSections.map((section) => (
                      <section key={section.label} className="mb-6 last:mb-0">
                        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{section.label}</p>
                        <div className="space-y-1">
                          {section.links.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.to);
                            return <Link key={link.to} to={link.to} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold", "hover:border-border/70 hover:bg-muted/60", active && "border-secondary/30 bg-secondary/15 text-foreground")}><span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-muted", active && "bg-secondary text-secondary-foreground")}><Icon className="h-4 w-4" /></span>{link.label}</Link>;
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-2 border-t bg-background/95 p-4">
                    <Button asChild variant="outline" className="rounded-xl"><Link to="/"><ArrowLeft className="h-4 w-4" />Sitio</Link></Button>
                    <Button asChild variant="outline" className="rounded-xl"><Link to="/admin"><Shield className="h-4 w-4" />Admin</Link></Button>
                    <Button variant="outline" className="rounded-xl text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4" />Salir</Button>
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
