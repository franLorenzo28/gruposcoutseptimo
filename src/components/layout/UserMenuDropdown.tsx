import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, Shield, LogOut } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface UserMenuDropdownProps {
  userName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  needsProfileSetup: boolean;
  onSignOut: () => void;
}

export function UserMenuDropdown({ userName, avatarUrl, isAdmin, needsProfileSetup, onSignOut }: UserMenuDropdownProps) {
  const profileMainPath = needsProfileSetup ? "/perfil/editar" : "/perfil";
  const profileMainLabel = needsProfileSetup ? "Crear perfil" : "Perfil";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <UserAvatar userName={userName} avatarUrl={avatarUrl} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{userName || "Usuario"}</p>
            <p className="text-xs text-muted-foreground">Mi Cuenta</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={profileMainPath}>
            <User className="h-4 w-4 mr-2" />
            {profileMainLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/configuracion">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="font-semibold text-primary">
                <Shield className="h-4 w-4 mr-2" />
                Panel Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
