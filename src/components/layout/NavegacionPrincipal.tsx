import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Check,
  Dot,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  Home,
  Calendar,
  History,
  BookOpen,
  Mail,
  Users,
  MessageSquare,
  Shield,
  Archive,
  Building,
  Music,
  Images,
  Tent,
  FileText,
  Compass,
  Clock,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import UserAvatar from "@/components/UserAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/Notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { isRestrictedForGuest } from "@/lib/access-control";
import { acceptFollow, rejectFollow } from "@/lib/follows";
import {
  getCurrentUserAdminAccess,
  reviewEducatorPermissionRequest,
  type EducatorUnit,
} from "@/lib/admin-permissions";
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

function filterNavLinksForGuest(links: NavLink[], isLoggedIn: boolean): NavLink[] {
  if (isLoggedIn) return links;

  const hiddenWhenLoggedOut = new Set(["/usuarios", "/area-miembros"]);

  return links
    .map((link) => {
      const filteredSubitems = link.subitems
        ? filterNavLinksForGuest(link.subitems, isLoggedIn)
        : undefined;

      const pathHidden =
        !!link.path &&
        (hiddenWhenLoggedOut.has(link.path) || isRestrictedForGuest(link.path));

      if (pathHidden) return null;

      if (link.subitems && (!filteredSubitems || filteredSubitems.length === 0)) {
        return null;
      }

      return {
        ...link,
        subitems: filteredSubitems,
      };
    })
    .filter((link): link is NavLink => link !== null);
}

const navSections: NavSection[] = [
  {
    label: "Inicio",
    links: [
      { name: "Inicio", path: "/", icon: Home },
      { name: "Narrativas", path: "/narrativas", icon: BookOpen },
      { name: "Comuni 7", path: "/usuarios", icon: Users },
      { name: "Contacto", path: "/contacto", icon: Mail },
    ],
  },
  {
    label: "Archivo",
    links: [
      { name: "Historia", path: "/historia", icon: History, type: "link" },
      {
        name: "Archivo",
        path: "/archivo",
        icon: FileText,
        type: "link",
        subitems: [
          { name: "Archivo", path: "/archivo", icon: Archive, type: "link" },
          { name: "Scoutpedia", path: "/archivo/scoutpedia", icon: Compass, type: "link" },
          { name: "Cápsula del Tiempo", path: "/archivo/capsula-del-tiempo", icon: Clock, type: "link" },
          { name: "Locales", path: "/archivo/locales", icon: Building, type: "link" },
          { name: "Am Lagerfeuer", path: "/archivo/am-lagerfeuer", icon: FileText, type: "link" },
        ],
      },
      { name: "Compañía", path: "/archivo/compania", icon: MessageSquare, type: "link" },
    ],
  },
  {
    label: "Explorar",
    links: [
      { name: "Eventos", path: "/eventos", icon: Calendar, type: "link" },
      { name: "Jamborees", path: "/eventos/jamborees", icon: Tent, type: "link" },
      { name: "Movimiento Scout", path: "/movimiento-scout", icon: Shield, type: "link" },
      { name: "Cancionero", path: "/cancionero", icon: Music },
      { name: "Galería", path: "/galeria", icon: Images },
    ],
  },
  {
    label: "Comunidad",
    links: [
      // { name: "Veteranos", path: "/veteranos", icon: Users }, // Cerrado temporalmente
      { name: "Educadores", path: "/dirigentes", icon: Users },
      { name: "Área de Miembros", path: "/area-miembros", icon: Settings },
    ],
  },
];

const Navigation = () => {
  const { notifications, unreadCount, markAllRead, removeNotification, markRead, loadMore, hasMore, loadingMore } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageEducatorRequests, setCanManageEducatorRequests] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isProfileComplete = (profile: any, email: string | null | undefined) => {
    const nombre = String(profile?.nombre_completo || "").trim();
    const username = String(profile?.username || "").trim();
    const fechaNacimiento = String(profile?.fecha_nacimiento || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    const nameLooksLikeEmail =
      !!normalizedEmail && nombre.toLowerCase() === normalizedEmail;

    return !!nombre && !nameLooksLikeEmail && !!username && !!fechaNacimiento;
  };

  const profileMainPath = needsProfileSetup ? "/perfil/editar" : "/perfil";
  const profileMainLabel = needsProfileSetup ? "Crear perfil" : "Perfil";
  const mobileProfileMainLabel = needsProfileSetup ? "Crear perfil" : "Ver mi perfil";
  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      links: filterNavLinksForGuest(section.links, isLoggedIn),
    }))
    .filter((section) => section.links.length > 0);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load user profile
  useEffect(() => {
    (async () => {
      try {
        if (isLocalBackend()) {
          const me: any = await apiFetch("/profiles/me").catch(() => null);
          if (me) {
            setUserName(me.nombre_completo || null);
            setAvatarUrl(me.avatar_url || null);
            setIsLoggedIn(true);
            const normalizedRole = String((me as any)?.role || "").trim().toLowerCase();
            const canOpenAdmin = normalizedRole === "admin" || normalizedRole === "mod";
            setIsAdmin(canOpenAdmin);
            setCanManageEducatorRequests(canOpenAdmin);
            setNeedsProfileSetup(!isProfileComplete(me, me?.email || null));
          } else {
            setIsLoggedIn(false);
            setIsAdmin(false);
            setNeedsProfileSetup(false);
            setCanManageEducatorRequests(false);
          }
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCanManageEducatorRequests(false);
          setNeedsProfileSetup(false);
          return;
        }
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre_completo, avatar_url, role, username, fecha_nacimiento")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) {
          const emailFallback = user.email || null;
          setUserName(((profile as any).nombre_completo || emailFallback) ?? null);
          setAvatarUrl((profile as any).avatar_url || null);
          const access = await getCurrentUserAdminAccess();
          setIsAdmin(access.canOpenAdminPanel);
          setCanManageEducatorRequests(access.canManageEducators);
          setNeedsProfileSetup(!isProfileComplete(profile, user.email));
        } else {
          setIsAdmin(false);
          setNeedsProfileSetup(true);
          setCanManageEducatorRequests(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCanManageEducatorRequests(false);
        setNeedsProfileSetup(false);
      }
    })();
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      console.log("Cerrando sesión...");
      
      // Limpiar TODOS los sistemas de autenticación
      if (isLocalBackend()) {
        console.log("Modo local: limpiando token del backend");
        localStorage.removeItem("local_api_token");
      } else {
        console.log("Modo Supabase: signOut");
        await supabase.auth.signOut();
      }
      
      // IMPORTANTE: Limpiar también la sesión mock de Supabase (usado en modo local)
      console.log("Limpiando sesión mock de Supabase");
      localStorage.removeItem("scout-session");
      
      // Limpiar cualquier otro dato de sesión
      console.log("Limpiando sessionStorage");
      sessionStorage.clear();
      
      // Actualizar estado local
      console.log("Actualizando estado...");
      setIsLoggedIn(false);
      setUserName(null);
      setAvatarUrl(null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      
      console.log("Redirigiendo a /auth...");
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const formatNotification = (n: any) => {
    const d = n?.data || {};
    const kind = String(d.kind || "").toLowerCase();

    if (n.type === "message" && kind === "educator_permission_request") {
      return {
        title: "Solicitud de permisos de educador",
        description: `${d.requester_name || d.display || "Un educador"} solicita habilitación por unidad`,
      };
    }

    if (n.type === "message" && kind === "educator_permission_response") {
      return {
        title: d.approved ? "Permisos aprobados" : "Solicitud rechazada",
        description: d.approved
          ? "Tu solicitud de permisos de educador fue aprobada"
          : "Tu solicitud de permisos de educador fue rechazada",
      };
    }

    switch (n.type) {
      case "follow_request":
        return {
          title: "Solicitud de seguimiento",
          description: `${d.display || "Alguien"} quiere seguirte`,
        };
      case "follow_accepted":
        return {
          title: "Nuevo seguidor",
          description: `${d.display || "Alguien"} ahora te sigue`,
        };
      case "message":
        return {
          title: "Nuevo mensaje",
          description: (d.content || "Tienes un mensaje nuevo").slice(0, 80),
        };
      case "group_invite":
        return {
          title: "Invitación a grupo",
          description: `Ahora perteneces a ${d.group_name || "un grupo"}`,
        };
      case "gallery_upload":
        return {
          title: "Nuevas fotos",
          description:
            d.count && d.count > 1
              ? `${d.count} fotos nuevas en ${d.album || "Galería"}`
              : `Nueva foto en ${d.album || "Galería"}`,
        };
      case "thread_new":
        return {
          title: "Nuevo hilo",
          description: `${d.display || "Alguien"} publicó: ${(d.content || "").slice(0, 60)}`,
        };
      case "thread_comment":
        return {
          title: "Nuevo comentario",
          description: (d.content || "Comentaron tu hilo").slice(0, 80),
        };
      case "mention":
        return {
          title: "Te mencionaron",
          description: (d.content || "Alguien te mencionó").slice(0, 80),
        };
      default:
        return {
          title: "Notificación",
          description: "Tienes una notificación nueva",
        };
    }
  };

  const getNotificationActor = (n: any) => {
    const d = n?.data || {};
    return d.display || (d.username ? `@${d.username}` : null);
  };

  const getNotificationRelativeTime = (createdAt: string) => {
    const now = Date.now();
    const then = new Date(createdAt).getTime();
    const diffSeconds = Math.max(1, Math.floor((now - then) / 1000));

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}sem`;
  };

  const formatUnitsList = (rawUnits: unknown): string => {
    const labels: Record<EducatorUnit, string> = {
      manada: "Manada",
      tropa: "Tropa",
      pioneros: "Pioneros",
      rovers: "Rovers",
    };

    if (!Array.isArray(rawUnits)) return "Sin unidades";
    const units = rawUnits
      .map((unit) => String(unit || "").trim().toLowerCase())
      .filter((unit): unit is EducatorUnit =>
        ["manada", "tropa", "pioneros", "rovers"].includes(unit),
      );
    if (units.length === 0) return "Sin unidades";
    return Array.from(new Set(units)).map((unit) => labels[unit]).join(", ");
  };

  const renderNotificationContent = (n: any) => {
    const d = n?.data || {};
    const actor = getNotificationActor(n);
    const kind = String(d.kind || "").toLowerCase();

    if (n.type === "message" && kind === "educator_permission_request") {
      const units = formatUnitsList(d.requested_units);
      return (
        <div className="space-y-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{d.requester_name || actor || "Educador/a"}</span>{" "}
            solicita permisos para: <span className="font-medium">{units}</span>
          </p>
          {d.note ? (
            <p className="text-xs text-muted-foreground line-clamp-2">{String(d.note)}</p>
          ) : null}
        </div>
      );
    }

    if (n.type === "message" && kind === "educator_permission_response") {
      const approved = !!d.approved;
      const units = formatUnitsList(d.approved_units);
      return (
        <p className="text-sm leading-snug">
          <span className="font-semibold">
            {approved ? "Permisos aprobados" : "Solicitud rechazada"}
          </span>{" "}
          <span className="text-muted-foreground">
            {approved
              ? `por ${d.reviewer_name || "administración"}. Unidades: ${units}.`
              : `por ${d.reviewer_name || "administración"}.`}
          </span>
        </p>
      );
    }

    switch (n.type) {
      case "follow_request":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            quiere seguirte
          </p>
        );
      case "follow_accepted":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            ahora te sigue
          </p>
        );
      case "message":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Nuevo mensaje"}</span>{" "}
            <span className="text-muted-foreground">{(d.content || "te envió un mensaje").slice(0, 70)}</span>
          </p>
        );
      default:
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{formatNotification(n).title}</span>{" "}
            <span className="text-muted-foreground">{formatNotification(n).description}</span>
          </p>
        );
    }
  };

  return (
    <>
      {/* Desktop & Mobile Navigation */}
      <nav
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
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative">
                <img
                  src={logoImage}
                  alt="Grupo Scout Séptimo"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain transition-transform group-hover:scale-110 [will-change:transform]"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-muted/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden xl:block">
                <h1 className="whitespace-nowrap text-base xl:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-none">
                  Grupo Scout Séptimo
                </h1>
                <p className="whitespace-nowrap text-xs text-white/70 mt-1">
                  Montevideo, Uruguay
                </p>
              </div>
            </Link>

            {/* Desktop Main Links */}
            <div className="hidden min-w-0 flex-1 justify-center px-2 xl:flex xl:px-4 2xl:px-8">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/55 px-2 py-1 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm dark:bg-slate-950/55">
                {/* Mostrar primer sección siempre horizontal */}
                {visibleNavSections[0]?.links.map((link) => {
                  const isSpecialActive =
                    (link.path === "/historia" && isActive("/linea-temporal")) ||
                    (link.path === "/eventos" && isActive("/bauen"));
                  const active = isActive(link.path) || isSpecialActive;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "relative px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 group nav-link-underline [will-change:transform]",
                        "hover:bg-white/10 hover:text-primary",
                        active ? "text-white nav-link-underline--active" : "text-white/80",
                      )}
                    >
                      <span className="whitespace-nowrap">{link.name}</span>
                    </Link>
                  );
                })}

                {/* Dropdowns para otras secciones */}
                {visibleNavSections.slice(1).map((section) => (
                  <DropdownMenu key={section.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 text-xs md:text-sm font-medium text-white/80 hover:text-primary hover:bg-white/10"
                      >
                        <span className="whitespace-nowrap">{section.label}</span>
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      {section.links.map((link) => {
                        if (link.type === "separator") {
                          return (
                            <div key={`separator-${link.name}`}>
                              <DropdownMenuSeparator />
                              {link.name && (
                                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2">
                                  {link.name}
                                </DropdownMenuLabel>
                              )}
                            </div>
                          );
                        }

                        const Icon = link.icon;
                        const active = isActive(link.path || "");
                        const hasSubitems = link.subitems && link.subitems.length > 0;

                        if (hasSubitems) {
                          return (
                            <Popover key={link.path}>
                              <PopoverTrigger asChild>
                                <button className="w-full p-0">
                                  <div className={cn(
                                    "flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm hover:bg-muted/40",
                                    active && "bg-primary/10 text-primary font-semibold"
                                  )}>
                                    <div className="flex items-center gap-2">
                                      {Icon && <Icon className="h-4 w-4" />}
                                      <span className="text-sm">{link.name}</span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </div>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" align="start" className="w-48 p-2">
                                <div className="space-y-1">
                                  {link.subitems.map((subitem) => {
                                    const SubIcon = subitem.icon;
                                    const subActive = isActive(subitem.path || "");
                                    return (
                                      <Link
                                        key={subitem.path}
                                        to={subitem.path || "#"}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                          "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-muted/40",
                                          subActive && "bg-primary/10 text-primary font-semibold"
                                        )}
                                      >
                                        {SubIcon && <SubIcon className="h-4 w-4" />}
                                        <span className="text-sm">{subitem.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        }

                        return (
                          <DropdownMenuItem key={link.path} asChild>
                            <Link
                              to={link.path || "#"}
                              onClick={() => setIsMobileMenuOpen(false)}
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
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden shrink-0 items-center gap-2 xl:flex xl:gap-3">

              {/* Notificaciones */}
              {isLoggedIn && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] leading-none rounded-full px-1.5 py-1">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,360px)] sm:w-[360px] p-0 max-h-[80vh]">
                    <div className="p-0">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <span className="text-sm font-semibold">Notificaciones</span>
                        {unreadCount > 0 && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={markAllRead}>
                            Marcar todo como leído
                          </Button>
                        )}
                      </div>
                      <ul className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No hay notificaciones</li>
                        ) : (
                          notifications.map((n) => {
                            const kind = String((n.data as any)?.kind || "").toLowerCase();
                            const isEducatorPermissionRequest =
                              n.type === "message" && kind === "educator_permission_request";
                            const requestStatus = String((n.data as any)?.status || "pending").toLowerCase();
                            const canReviewEducatorRequest =
                              isEducatorPermissionRequest &&
                              canManageEducatorRequests &&
                              !n.read &&
                              requestStatus === "pending";

                            return (
                              <li
                                key={n.id}
                                className={cn(
                                  "border-b px-4 py-3 transition-colors",
                                  !n.read ? "bg-primary/5" : "hover:bg-muted/30",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <UserAvatar
                                    avatarUrl={(n.data as any)?.avatar_url || null}
                                    userName={(n.data as any)?.display || "Scout"}
                                    size="sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    {renderNotificationContent(n)}
                                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <span>{getNotificationRelativeTime(n.created_at)}</span>
                                      {!n.read && <Dot className="h-4 w-4 text-primary" />}
                                    </div>
                                  </div>
                                  {n.type === "follow_request" ? (
                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        size="icon"
                                        className="h-7 w-7"
                                        aria-label="Aceptar solicitud"
                                        title="Aceptar solicitud"
                                        onClick={async () => {
                                          const followerId = (n.data as any)?.follower_id as string | undefined;
                                          if (!followerId) return;
                                          const { error } = await acceptFollow(followerId);
                                          if (error) {
                                            toast({
                                              title: "Error",
                                              description: (error as any).message || "No se pudo aceptar",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          markRead(n.id);
                                          removeNotification(n.id);
                                          toast({ title: "Solicitud aceptada" });
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7"
                                        aria-label="Rechazar solicitud"
                                        title="Rechazar solicitud"
                                        onClick={async () => {
                                          const followerId = (n.data as any)?.follower_id as string | undefined;
                                          if (!followerId) return;
                                          const { error } = await rejectFollow(followerId);
                                          if (error) {
                                            toast({
                                              title: "Error",
                                              description: (error as any).message || "No se pudo rechazar",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          markRead(n.id);
                                          removeNotification(n.id);
                                          toast({ title: "Solicitud rechazada" });
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : canReviewEducatorRequest ? (
                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        size="icon"
                                        className="h-7 w-7"
                                        aria-label="Aprobar permisos"
                                        title="Aprobar permisos"
                                        onClick={async () => {
                                          const requesterId = String((n.data as any)?.requester_id || "").trim();
                                          const requestedUnitsRaw = Array.isArray((n.data as any)?.requested_units)
                                            ? (n.data as any).requested_units
                                            : [];
                                          const requestedUnits = requestedUnitsRaw
                                            .map((unit: unknown) => String(unit || "").trim().toLowerCase())
                                            .filter((unit: string): unit is EducatorUnit =>
                                              ["manada", "tropa", "pioneros", "rovers"].includes(unit),
                                            );

                                          if (!requesterId || requestedUnits.length === 0) {
                                            toast({
                                              title: "Solicitud inválida",
                                              description: "Faltan datos para aprobar la solicitud.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          try {
                                            await reviewEducatorPermissionRequest({
                                              notificationId: n.id,
                                              requesterId,
                                              approve: true,
                                              units: requestedUnits,
                                            });
                                            markRead(n.id);
                                            removeNotification(n.id);
                                            toast({ title: "Permisos aprobados" });
                                          } catch (error: any) {
                                            toast({
                                              title: "Error",
                                              description: error?.message || "No se pudo aprobar la solicitud",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7"
                                        aria-label="Rechazar permisos"
                                        title="Rechazar permisos"
                                        onClick={async () => {
                                          const requesterId = String((n.data as any)?.requester_id || "").trim();
                                          if (!requesterId) {
                                            toast({
                                              title: "Solicitud inválida",
                                              description: "No se pudo identificar al solicitante.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          try {
                                            await reviewEducatorPermissionRequest({
                                              notificationId: n.id,
                                              requesterId,
                                              approve: false,
                                              units: [],
                                            });
                                            markRead(n.id);
                                            removeNotification(n.id);
                                            toast({ title: "Solicitud rechazada" });
                                          } catch (error: any) {
                                            toast({
                                              title: "Error",
                                              description: error?.message || "No se pudo rechazar la solicitud",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      {!n.read && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          aria-label="Marcar como leído"
                                          title="Marcar como leído"
                                          onClick={() => markRead(n.id)}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        aria-label="Eliminar notificación"
                                        title="Eliminar notificación"
                                        onClick={() => removeNotification(n.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                      {hasMore && (
                        <Button size="sm" variant="ghost" className="w-full rounded-none py-3" onClick={loadMore} disabled={loadingMore}>
                          {loadingMore ? "Cargando..." : "Ver más"}
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu or Login */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <UserAvatar
                        userName={userName}
                        avatarUrl={avatarUrl}
                        size="sm"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">
                          {userName || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mi Cuenta
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={profileMainPath} className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        {profileMainLabel}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/configuracion" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin-panel" className="cursor-pointer font-semibold text-primary">
                            <Shield className="h-4 w-4 mr-2" />
                            Panel Admin
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" size="sm">
                  <Link to="/auth">Iniciar Sesión</Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="ml-auto flex items-center gap-2 xl:hidden">
              {isLoggedIn && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] leading-none rounded-full px-1.5 py-1">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,340px)] p-0 max-h-[75vh]" align="end">
                    <div className="p-0">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <span className="text-sm font-semibold">Notificaciones</span>
                        {unreadCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={markAllRead}
                          >
                            Marcar todo como leído
                          </Button>
                        )}
                      </div>
                      <ul className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No hay notificaciones
                          </li>
                        ) : (
                          notifications.map((n) => (
                            <li
                              key={`mobile-${n.id}`}
                              className={cn(
                                "border-b px-4 py-3 transition-colors",
                                !n.read ? "bg-primary/5" : "hover:bg-muted/30",
                              )}
                              onClick={async () => {
                                if (!n.read) await markRead(n.id);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <UserAvatar
                                  avatarUrl={(n.data as any)?.avatar_url || null}
                                  userName={(n.data as any)?.display || "Scout"}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  {renderNotificationContent(n)}
                                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>{getNotificationRelativeTime(n.created_at)}</span>
                                    {!n.read && <Dot className="h-4 w-4 text-primary" />}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))
                        )}
                        {hasMore && (
                          <li className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={loadMore}
                              disabled={loadingMore}
                            >
                              {loadingMore ? "Cargando..." : "Cargar más"}
                            </Button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="xl:hidden">
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[400px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menú</SheetTitle>
                  </SheetHeader>
                  <MobileMenu
                    navSections={visibleNavSections}
                    isLoggedIn={isLoggedIn}
                    userName={userName}
                    avatarUrl={avatarUrl}
                    isAdmin={isAdmin}
                    needsProfileSetup={needsProfileSetup}
                    isActive={isActive}
                    handleSignOut={handleSignOut}
                    onLinkClick={() => setIsMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer para que el contenido no quede debajo del nav */}
      <div className="h-16 md:h-20" />
    </>
  );
};

// Mobile Menu Component
interface MobileMenuProps {
  navSections: NavSection[];
  isLoggedIn: boolean;
  userName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  needsProfileSetup: boolean;
  isActive: (path: string) => boolean;
  handleSignOut: () => void;
  onLinkClick: () => void;
}

function MobileMenu({
  navSections,
  isLoggedIn,
  userName,
  avatarUrl,
  isAdmin,
  needsProfileSetup,
  isActive,
  handleSignOut,
  onLinkClick,
}: MobileMenuProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const profileMainPath = needsProfileSetup ? "/perfil/editar" : "/perfil";
  const profileMainLabel = needsProfileSetup ? "Crear perfil" : "Ver mi perfil";

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* User Section */}
      {isLoggedIn ? (
        <div className="space-y-2">
          {/* Tarjeta de usuario con dropdown */}
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors"
          >
            <UserAvatar userName={userName} avatarUrl={avatarUrl} size="md" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">
                {userName || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground">Mi Cuenta</p>
            </div>
            {accountMenuOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </button>
          
          {/* Opciones de cuenta (collapsible) */}
          {accountMenuOpen && (
            <div className="space-y-1 px-2 animate-in slide-in-from-top-2 duration-200 [will-change:transform]">
              <Link
                to={profileMainPath}
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 hover:text-primary transition-all duration-300 text-sm"
              >
                <User className="h-4 w-4" />
                <span>{profileMainLabel}</span>
              </Link>
              <Link
                to="/configuracion"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 hover:text-primary transition-all duration-300 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-panel"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLinkClick();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-accent transition-all duration-300 text-sm font-semibold text-primary"
                >
                  <Shield className="h-4 w-4" />
                  <span>Panel Admin</span>
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-destructive/10 text-destructive transition-all duration-300 w-full text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Button asChild variant="default" className="w-full">
          <Link to="/auth" onClick={onLinkClick}>
            Iniciar Sesión
          </Link>
        </Button>
      )}

      {/* Navigation Sections */}
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
                        isActive(link.path || "")
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {link.icon && <link.icon className="h-5 w-5" />}
                        <span className="text-sm font-medium">{link.name}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="pl-6 space-y-1 mt-1">
                        {link.subitems.map((subitem) => (
                          <Link
                            key={subitem.path}
                            to={subitem.path || "#"}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300",
                              "hover:bg-nav-hover hover:text-primary",
                              isActive(subitem.path || "")
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground text-sm",
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
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 [will-change:transform]",
                    "hover:bg-nav-hover hover:text-primary",
                    isActive(link.path || "")
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
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
  );
}

export default Navigation;


