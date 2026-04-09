import { NarrativaConAutor } from "@/types/narrativa";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useState } from "react";

interface NarrativaCardProps {
  narrativa: NarrativaConAutor;
  onView?: (narrativa: NarrativaConAutor) => void;
  onEdit?: (narrativa: NarrativaConAutor) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function NarrativaCard({
  narrativa,
  onView,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin = false,
}: NarrativaCardProps) {
  const [loading, setLoading] = useState(false);

  const isAuthor = currentUserId && currentUserId === narrativa.autor_id;
  const canEdit = isAdmin || isAuthor;
  const canDelete = isAdmin || isAuthor;

  console.log("NarrativaCard Debug:", {
    titulo: narrativa.titulo,
    currentUserId,
    autorId: narrativa.autor_id,
    isAuthor,
    isAdmin,
    canEdit,
    canDelete,
    hasOnEdit: !!onEdit,
    hasOnDelete: !!onDelete,
  });

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta narrativa?")) return;
    if (onDelete) {
      setLoading(true);
      onDelete(narrativa.id);
      setLoading(false);
    }
  };

  // Extraer primer bloque de texto para preview
  const firstTextBlock = narrativa.bloques.find((b) => b.tipo === "texto");
  const preview = firstTextBlock?.contenido.substring(0, 200) || "";

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-2">
            {narrativa.titulo}
          </h3>
          <p className="text-sm font-semibold text-primary mb-3">
            {narrativa.year_section}
          </p>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {preview}...
        </p>
      )}

      {/* Autor y fecha */}
      <div className="flex items-center gap-3 pt-4 border-t border-border mb-4">
        <UserAvatar
          user={narrativa.autor}
          size="sm"
        />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold">
            {narrativa.autor?.nombre_completo || narrativa.autor?.username || "Anónimo"}
          </p>
          <p>{new Date(narrativa.fecha_publicacion || narrativa.created_at).toLocaleDateString("es-UY")}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2">
        {onView && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onView(narrativa)}
            disabled={loading}
            title="Ver narrativa"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(narrativa)}
            disabled={loading}
            title="Editar narrativa"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 hover:text-red-600"
            title="Eliminar narrativa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
