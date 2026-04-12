import { useEffect, useState } from "react";
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

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
        className="border-scout-red text-white bg-scout-red hover:bg-red-700 dark:hover:bg-red-600"
        onClick={() => setIsEditing(true)}
      >
        Editar información de unidad
      </Button>
    );
  }

  return (
    <Card className="border-scout-red bg-slate-50 dark:bg-slate-900 border-2">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-scout-red">
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
          <label className="text-sm font-semibold text-scout-red">Lema</label>
          <input
            type="text"
            value={data.lema}
            onChange={(e) => setData({ ...data, lema: e.target.value })}
            className="mt-1 w-full rounded-lg border border-scout-red bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-scout-red"
            placeholder="Ej: Siempre mejor"
          />
        </div>

        {/* Reuniones */}
        <div>
          <label className="text-sm font-semibold text-scout-red">
            Reuniones
          </label>
          <div className="mt-2 space-y-2">
            {data.reuniones.map((reunion, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-scout-red bg-white dark:bg-slate-900 px-3 py-2"
              >
                <span className="text-sm text-slate-900 dark:text-white">{reunion}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveReunion(idx)}
                >
                  <X className="h-4 w-4 text-scout-red" />
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
              className="flex-1 rounded-lg border border-scout-red bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-scout-red"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddReunion}
              className="border-scout-red text-white bg-scout-red hover:bg-red-700 dark:hover:bg-red-600"
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Información */}
        <div>
          <label className="text-sm font-semibold text-scout-red">
            Información interna
          </label>
          <div className="mt-2 space-y-2">
            {data.info.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-scout-red bg-white dark:bg-slate-900 px-3 py-2"
              >
                <span className="text-sm text-slate-900 dark:text-white">{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveInfo(idx)}
                >
                  <X className="h-4 w-4 text-scout-red" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newInfo}
              onChange={(e) => setNewInfo(e.target.value)}
              placeholder="Ej: Trabajar en progresiones de unidad"
              className="flex-1 rounded-lg border border-scout-red bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-scout-red"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddInfo}
              className="border-scout-red text-white bg-scout-red hover:bg-red-700 dark:hover:bg-red-600"
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Avisos */}
        <div>
          <label className="text-sm font-semibold text-scout-yellow">
            Avisos internos
          </label>
          <div className="mt-2 space-y-2">
            {data.avisos.map((aviso, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 rounded-lg border border-scout-yellow bg-yellow-50 dark:bg-slate-900 px-3 py-2"
              >
                <span className="text-sm flex-1 text-slate-900 dark:text-white">{aviso}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAviso(idx)}
                >
                  <X className="h-4 w-4 text-scout-red" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <textarea
              value={newAviso}
              onChange={(e) => setNewAviso(e.target.value)}
              placeholder="Ej: Traer autorización para la salida del próximo sábado"
              className="flex-1 rounded-lg border border-scout-yellow bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-scout-yellow"
              rows={2}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAviso}
              className="border-scout-yellow text-white bg-scout-yellow hover:bg-yellow-600 dark:hover:bg-yellow-700 h-auto"
            >
              Agregar
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="bg-scout-red hover:bg-red-700 dark:hover:bg-red-600 text-white"
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
