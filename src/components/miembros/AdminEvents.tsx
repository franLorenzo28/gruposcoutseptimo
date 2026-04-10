import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trash2, Plus, X } from "lucide-react";

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
  onDeleteEvent: (eventId: string) => void;
}

export function AdminEvents({
  ramaName,
  eventos,
  onAddEvent,
  onDeleteEvent,
}: AdminEventsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    fecha: "",
    hora: "",
    lugar: "",
    descripcion: "",
  });

  const handleCreateEvent = () => {
    if (!formData.titulo || !formData.fecha || !formData.hora) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    onAddEvent(formData);
    setFormData({
      titulo: "",
      fecha: "",
      hora: "",
      lugar: "",
      descripcion: "",
    });
    setIsCreating(false);
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-purple-900">Gestionar eventos</h3>
          {!isCreating && (
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo evento
            </Button>
          )}
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="space-y-3 rounded-lg border border-purple-200 bg-white p-4">
            <h4 className="font-semibold text-purple-900">Crear nuevo evento</h4>

            <div>
              <label className="text-xs font-semibold text-purple-900">
                Título *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ej: Reunión de rama"
                className="mt-1 w-full rounded-lg border border-purple-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-purple-900">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-purple-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-900">
                  Hora *
                </label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) =>
                    setFormData({ ...formData, hora: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-purple-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-900">
                Lugar
              </label>
              <input
                type="text"
                value={formData.lugar}
                onChange={(e) =>
                  setFormData({ ...formData, lugar: e.target.value })
                }
                placeholder="Ej: Sede Scout"
                className="mt-1 w-full rounded-lg border border-purple-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-900">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Detalles adicionales del evento"
                rows={2}
                className="mt-1 w-full rounded-lg border border-purple-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateEvent}
              >
                Crear evento
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setFormData({
                    titulo: "",
                    fecha: "",
                    hora: "",
                    lugar: "",
                    descripcion: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Events list */}
        {eventos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-3">
              Eventos de {ramaName}
            </h4>
            <div className="space-y-3">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-lg border border-purple-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900">
                        {evento.titulo}
                      </h5>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {evento.fecha}
                        </span>
                        <span>Hora: {evento.hora}</span>
                      </div>
                      {evento.lugar && (
                        <p className="mt-1 text-xs text-gray-600">
                          📍 {evento.lugar}
                        </p>
                      )}
                      {evento.descripcion && (
                        <p className="mt-2 text-xs text-gray-700">
                          {evento.descripcion}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEvent(evento.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventos.length === 0 && !isCreating && (
          <div className="flex items-center justify-center rounded-lg border border-purple-200 bg-white px-3 py-4 text-sm text-gray-600">
            <p>No hay eventos programados. ¡Crea el primero!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
