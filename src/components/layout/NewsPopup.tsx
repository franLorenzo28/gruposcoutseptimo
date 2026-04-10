/**
 * Modal automático para mostrar novedades/features nuevas
 */

import { useNewFeatures } from "@/hooks/useNewFeatures";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Zap, CheckCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle,
  Plus,
};

export function NewsPopup() {
  const { newFeatures, hasNews, loading, markAsRead } = useNewFeatures();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasNews && !loading) {
      setOpen(true);
    }
  }, [hasNews, loading]);

  if (loading) return null;

  const handleClose = () => {
    setOpen(false);
    markAsRead();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-scout-yellow" />
            <DialogTitle>¡Novedades!</DialogTitle>
          </div>
          <DialogDescription>
            Se agregaron {newFeatures.length}{" "}
            {newFeatures.length === 1 ? "novedad" : "novedades"} a la plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {newFeatures.map((feature) => {
            const IconComponent = iconMap[feature.icon || "Sparkles"];
            return (
              <div
                key={feature.id}
                className="flex gap-3 rounded-lg bg-muted p-3 border border-border"
              >
                <div className="flex-shrink-0 pt-1">
                  {IconComponent && (
                    <IconComponent className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{feature.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(feature.date).toLocaleDateString("es-UY")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleClose} className="flex-1">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
