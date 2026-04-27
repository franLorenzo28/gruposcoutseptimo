import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

interface RamaEvent {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
}

interface AdminEventsProps {
  ramaName: string;
  eventos: RamaEvent[];
  onAddEvent: (event: Omit<RamaEvent, "id">) => void;
  onUpdateEvent: (eventId: string, event: Omit<RamaEvent, "id">) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function AdminEvents({
  ramaName,
  eventos,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: AdminEventsProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    fecha: "",
    hora: "",
    lugar: "",
    descripcion: "",
  });

  const sortedEvents = useMemo(() => {
    const toTimestamp = (event: RamaEvent) => {
      const iso = `${event.fecha || ""}T${event.hora || "00:00"}:00`;
      const value = new Date(iso).getTime();
      return Number.isFinite(value) ? value : 0;
    };

    return [...eventos].sort((a, b) => toTimestamp(a) - toTimestamp(b));
  }, [eventos]);

  const resetForm = () => {
    setFormData({
      titulo: "",
      fecha: "",
      hora: "",
      lugar: "",
      descripcion: "",
    });
  };

  const handleSubmitEvent = () => {
    if (!formData.titulo || !formData.fecha || !formData.hora) {
      toast({
        title: "Faltan datos",
        description: "Completa titulo, fecha y hora para guardar el evento.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      onUpdateEvent(editingId, formData);
      toast({
        title: "Evento actualizado",
        description: "Los cambios del evento se guardaron correctamente.",
      });
      setEditingId(null);
    } else {
      onAddEvent(formData);
      toast({
        title: "Evento creado",
        description: "Nuevo evento agregado al calendario de unidad.",
      });
    }

    resetForm();
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingId(null);
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (event: RamaEvent) => {
    setEditingId(event.id);
    setFormData({
      titulo: event.titulo || "",
      fecha: event.fecha || "",
      hora: event.hora || "",
      lugar: event.lugar || "",
      descripcion: event.descripcion || "",
    });
    setIsCreating(true);
  };

  const cancelEdition = () => {
    setEditingId(null);
    resetForm();
    setIsCreating(false);
  };

  const handleDelete = (eventId: string) => {
    if (!window.confirm("Eliminar este evento de la unidad?")) return;
    onDeleteEvent(eventId);
    toast({
      title: "Evento eliminado",
      description: "El evento fue removido del calendario.",
    });
  };

  const isFutureEvent = (event: RamaEvent) => {
    const value = new Date(`${event.fecha}T${event.hora || "00:00"}:00`).getTime();
    return Number.isFinite(value) && value >= Date.now();
  };

  return (
    <Card className="border border-border/70 bg-card/80 shadow-sm">
      <CardContent className="space-y-3 p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Gestionar eventos</h3>
            <p className="text-xs text-muted-foreground">
              Planifica agenda y visibilidad para {ramaName}.
            </p>
          </div>
          {!isCreating && (
            <Button size="sm" onClick={startCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo evento
            </Button>
          )}
        </div>

        {isCreating && (
          <div className="space-y-3 rounded-lg border border-border/70 bg-background/80 p-3">
            <h4 className="font-semibold">
              {editingId ? "Editar evento" : "Crear nuevo evento"}
            </h4>

            <div>
              <Label className="text-xs font-semibold">Titulo *</Label>
              <Input
                type="text"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ej: Reunion de unidad"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Fecha *</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Hora *</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) =>
                    setFormData({ ...formData, hora: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Lugar</Label>
              <Input
                type="text"
                value={formData.lugar}
                onChange={(e) =>
                  setFormData({ ...formData, lugar: e.target.value })
                }
                placeholder="Ej: Sede Scout"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Descripcion</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Detalles adicionales del evento"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmitEvent}>
                {editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                ) : (
                  "Crear evento"
                )}
              </Button>
              <Button variant="outline" onClick={cancelEdition}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {sortedEvents.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Eventos de {ramaName}</h4>
            <div className="space-y-2">
              {sortedEvents.map((evento) => (
                <div
                  key={evento.id}
                  className="space-y-2 rounded-lg border border-border/70 bg-background/90 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold">{evento.titulo}</h5>
                        <Badge variant={isFutureEvent(evento) ? "default" : "secondary"}>
                          {isFutureEvent(evento) ? "Proximo" : "Pasado"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {evento.fecha}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {evento.hora}
                        </span>
                      </div>
                      {evento.lugar && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {evento.lugar}
                        </p>
                      )}
                      {evento.descripcion && (
                        <p className="mt-2 text-xs">{evento.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(evento)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(evento.id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedEvents.length === 0 && !isCreating && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/70 px-3 py-4 text-sm text-muted-foreground">
            <p>No hay eventos programados. Crea el primero.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
