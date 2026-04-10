import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Save, X } from "lucide-react";

interface RamaContentData {
  lema: string;
  reuniones: string[];
  info: string[];
  avisos: string[];
}

interface AdminRamaContentProps {
  ramaName: string;
  initialData: RamaContentData;
  onSave: (data: RamaContentData) => void;
}

export function AdminRamaContent({
  ramaName,
  initialData,
  onSave,
}: AdminRamaContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<RamaContentData>(initialData);
  const [newReunion, setNewReunion] = useState("");
  const [newInfo, setNewInfo] = useState("");
  const [newAviso, setNewAviso] = useState("");

  const handleAddReunion = () => {
    if (newReunion.trim()) {
      setData({
        ...data,
        reuniones: [...data.reuniones, newReunion.trim()],
      });
      setNewReunion("");
    }
  };

  const handleRemoveReunion = (index: number) => {
    setData({
      ...data,
      reuniones: data.reuniones.filter((_, i) => i !== index),
    });
  };

  const handleAddInfo = () => {
    if (newInfo.trim()) {
      setData({
        ...data,
        info: [...data.info, newInfo.trim()],
      });
      setNewInfo("");
    }
  };

  const handleRemoveInfo = (index: number) => {
    setData({
      ...data,
      info: data.info.filter((_, i) => i !== index),
    });
  };

  const handleAddAviso = () => {
    if (newAviso.trim()) {
      setData({
        ...data,
        avisos: [...data.avisos, newAviso.trim()],
      });
      setNewAviso("");
    }
  };

  const handleRemoveAviso = (index: number) => {
    setData({
      ...data,
      avisos: data.avisos.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    onSave(data);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
        onClick={() => setIsEditing(true)}
      >
        Editar información de rama
      </Button>
    );
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-emerald-900">
            Editando información de {ramaName}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setData(initialData);
              setIsEditing(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Lema */}
        <div>
          <label className="text-sm font-semibold text-emerald-900">Lema</label>
          <input
            type="text"
            value={data.lema}
            onChange={(e) => setData({ ...data, lema: e.target.value })}
            className="mt-1 w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm"
            placeholder="Ej: Siempre mejor"
          />
        </div>

        {/* Reuniones */}
        <div>
          <label className="text-sm font-semibold text-emerald-900">
            Reuniones
          </label>
          <div className="mt-2 space-y-2">
            {data.reuniones.map((reunion, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2"
              >
                <span className="text-sm">{reunion}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveReunion(idx)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newReunion}
              onChange={(e) => setNewReunion(e.target.value)}
              placeholder="Ej: Lunes 20:00 - 22:00"
              className="flex-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddReunion}
              className="border-emerald-300"
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Información */}
        <div>
          <label className="text-sm font-semibold text-emerald-900">
            Información interna
          </label>
          <div className="mt-2 space-y-2">
            {data.info.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2"
              >
                <span className="text-sm">{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveInfo(idx)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newInfo}
              onChange={(e) => setNewInfo(e.target.value)}
              placeholder="Ej: Trabajar en progresiones de rama"
              className="flex-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddInfo}
              className="border-emerald-300"
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Avisos */}
        <div>
          <label className="text-sm font-semibold text-emerald-900">
            Avisos internos
          </label>
          <div className="mt-2 space-y-2">
            {data.avisos.map((aviso, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2"
              >
                <span className="text-sm flex-1">{aviso}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAviso(idx)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <textarea
              value={newAviso}
              onChange={(e) => setNewAviso(e.target.value)}
              placeholder="Ej: Traer autorización para la salida del próximo sábado"
              className="flex-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm"
              rows={2}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAviso}
              className="border-emerald-300 h-auto"
            >
              Agregar
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setData(initialData);
              setIsEditing(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
