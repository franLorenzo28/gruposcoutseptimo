import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  User,
  Share2,
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
import logoImage from "@/assets/grupo-scout-logo.png";

interface NavLink {
  name: string;
  path: string;
  icon?: React.ElementType;
}

interface NavSection {
  label: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    label: "Principal",
    links: [
      { name: "Inicio", path: "/", icon: Home },
      { name: "Comuni 7", path: "/usuarios", icon: Users },
      { name: "Historia", path: "/historia", icon: History },
      { name: "Archivo", path: "/archivo", icon: Archive },
      { name: "Eventos", path: "/eventos", icon: Calendar },
      { name: "Movimiento Scout", path: "/movimiento-scout", icon: BookOpen },
      { name: "Contacto", path: "/contacto", icon: Mail },
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

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
            setIsAdmin((me as any)?.role === "admin");
          }
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre_completo, avatar_url, role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) {
          const emailFallback = user.email || null;
          setUserName(((profile as any).nombre_completo || emailFallback) ?? null);
          setAvatarUrl((profile as any).avatar_url || null);
          setIsAdmin((profile as any)?.role === "admin");
        }
      } catch (err) {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    })();
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      console.log("🔓 Cerrando sesión...");
      
      // Limpiar TODOS los sistemas de autenticación
      if (isLocalBackend()) {
        console.log("🔓 Modo local: limpiando token del backend");
        localStorage.removeItem("local_api_token");
      } else {
        console.log("🔓 Modo Supabase: signOut");
        await supabase.auth.signOut();
      }
      
      // IMPORTANTE: Limpiar también la sesión mock de Supabase (usado en modo local)
      console.log("🔓 Limpiando sesión mock de Supabase");
      localStorage.removeItem("scout-session");
      
      // Limpiar cualquier otro dato de sesión
      console.log("🔓 Limpiando sessionStorage");
      sessionStorage.clear();
      
      // Actualizar estado local
      console.log("🔓 Actualizando estado...");
      setIsLoggedIn(false);
      setUserName(null);
      setAvatarUrl(null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      
      console.log("🔓 Redirigiendo a /auth...");
      // Forzar navegación completa sin SPA
      window.location.href = "/auth";
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (links: NavLink[]) =>
    links.some((link) => location.pathname === link.path);

  return (
    <>
      {/* Desktop & Mobile Navigation */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-md border-b"
            : "bg-transparent",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative">
                <img
                  src={logoImage}
                  alt="Grupo Scout Séptimo"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-muted/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Grupo Scout Séptimo
                </h1>
                <p className="text-xs text-muted-foreground">
                  Montevideo, Uruguay
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Main Links */}
              <div className="flex items-center gap-1">
                {navSections[0].links.map((link) => {
                  const isSpecialActive =
                    (link.path === "/historia" && isActive("/linea-temporal")) ||
                    (link.path === "/eventos" && isActive("/bauen"));
                  const active = isActive(link.path) || isSpecialActive;
                  const isHomeLink = link.path === "/";

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        "relative px-4 py-2 rounded-md text-sm font-medium transition-all group nav-link-underline",
                        "hover:bg-nav-hover hover:text-nav-hover-foreground",
                        active ? "text-foreground nav-link-underline--active" : "text-foreground/80",
                      )}
                    >
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>

                      {/* Notificaciones */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] leading-none rounded-full px-1.5 py-1">
                                {unreadCount}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">Notificaciones</span>
                              {unreadCount > 0 && (
                                <Button size="sm" variant="ghost" onClick={markAllRead}>
                                  Marcar todo como leádo
                                </Button>
                              )}
                            </div>
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                              {notifications.length === 0 ? (
                                <li className="text-sm text-muted-foreground">No hay notificaciones</li>
                              ) : (
                                notifications.map((n) => (
                                  <li key={n.id} className={cn("p-2 rounded-md", !n.read && "bg-accent")}> 
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <div className="text-sm font-medium">Notificación #{n.id}</div>
                                        <div className="text-xs text-muted-foreground truncate">Sin detalles</div>
                                      </div>
                                      {!n.read && (
                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => markRead(n.id)}>Leer</Button>
                                      )}
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => removeNotification(n.id)}>Eliminar</Button>
                                    </div>
                                  </li>
                                ))
                              )}
                            </ul>
                            {hasMore && (
                              <Button size="sm" variant="ghost" className="w-full mt-2" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? "Cargando..." : "Ver más"}
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu or Login */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
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
                      <Link to="/perfil" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/perfil/compartir" className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartir Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/perfil/editar" className="cursor-pointer">
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
            <div className="flex lg:hidden items-center gap-2">
              <ThemeToggle />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menú</SheetTitle>
                  </SheetHeader>
                  <MobileMenu
                    navSections={navSections}
                    isLoggedIn={isLoggedIn}
                    userName={userName}
                    avatarUrl={avatarUrl}
                    isAdmin={isAdmin}
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
  isActive,
  handleSignOut,
  onLinkClick,
}: MobileMenuProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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
            <div className="space-y-1 px-2 animate-in slide-in-from-top-2 duration-200">
              <Link
                to="/perfil"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 transition-colors text-sm"
              >
                <User className="h-4 w-4" />
                <span>Ver mi perfil</span>
              </Link>
              <Link
                to="/perfil/editar"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Editar perfil</span>
              </Link>
              <Link
                to="/perfil/compartir"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLinkClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 transition-colors text-sm"
              >
                <Share2 className="h-4 w-4" />
                <span>Compartir perfil</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-panel"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLinkClick();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-accent transition-colors text-sm font-semibold text-primary"
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors w-full text-sm"
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
              {section.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                    "hover:bg-nav-hover hover:text-nav-hover-foreground",
                    isActive(link.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Navigation;


