import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  userName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  clickable?: boolean; // Nueva prop para habilitar/deshabilitar el click
}

const UserAvatar = ({
  avatarUrl,
  userName,
  size = "md",
  className = "",
  clickable = true, // Por defecto es clickeable
}: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Función para obtener las iniciales del nombre
  const getInitials = (name?: string | null): string => {
    if (!name) return "GS";

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };

  const initials = getInitials(userName);

  const handleClick = () => {
    if (clickable && avatarUrl) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Avatar 
        className={`${sizeClasses[size]} ${className} ${clickable && avatarUrl ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
        onClick={handleClick}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={userName || "Usuario"} loading="lazy" />}
        <AvatarFallback className="bg-muted/30 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Diálogo para ver la imagen en grande */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-0">
          <DialogTitle className="sr-only">{userName || "Foto de perfil"}</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={avatarUrl || ""}
              alt={userName || "Foto de perfil"}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              loading="lazy"
              decoding="async"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserAvatar;

