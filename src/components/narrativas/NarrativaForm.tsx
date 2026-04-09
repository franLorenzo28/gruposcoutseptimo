import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { narrativaSchema, NarrativaFormData } from "@/lib/validation";
import { NarrativaConAutor, CreateNarrativaInput } from "@/types/narrativa";
import { uploadNarrativaImage } from "@/lib/supabase-upload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, X, Upload, ChevronUp, ChevronDown } from "lucide-react";

interface NarrativaFormProps {
  narrativa?: NarrativaConAutor;
  onSubmit: (data: CreateNarrativaInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function NarrativaForm({
  narrativa,
  onSubmit,
  onCancel,
  isLoading = false,
}: NarrativaFormProps) {
  const form = useForm<NarrativaFormData>({
    resolver: zodResolver(narrativaSchema),
    defaultValues: narrativa ? {
      titulo: narrativa.titulo,
      year_section: narrativa.year_section,
      fecha_publicacion: narrativa.fecha_publicacion?.split('T')[0] || new Date().toISOString().split('T')[0],
      bloques: narrativa.bloques,
    } : {
      titulo: "",
      year_section: "",
      fecha_publicacion: new Date().toISOString().split('T')[0],
      bloques: [{ tipo: "texto", contenido: "" }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "bloques",
  });

  const handleAddBloque = () => {
    append({ tipo: "texto", contenido: "" });
  };

  const handleMoveBloque = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      move(index, index - 1);
    } else if (direction === "down" && index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  const handleSubmit = async (data: NarrativaFormData) => {
    try {
      // Asegurar que cada bloque tiene un ID
      const bloquesConId = data.bloques.map((bloque) => ({
        ...bloque,
        id: bloque.id || crypto.randomUUID(),
      }));

      const input: CreateNarrativaInput = {
        titulo: data.titulo,
        year_section: data.year_section,
        fecha_publicacion: data.fecha_publicacion,
        bloques: bloquesConId as any,
      };
      await onSubmit(input);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Título */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Iniciativa de Formar un Grupo Scout de Habla Alemana"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                El título principal de la narrativa
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Año/Sección */}
        <FormField
          control={form.control}
          name="year_section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año o Período</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: 1964, JUN-1964, 1964-1965"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Año o período de la narrativa para agrupación cronológica
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de Publicación */}
        <FormField
          control={form.control}
          name="fecha_publicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Publicación</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Fecha en que se registró esta narrativa. Importante para ordenar cronológicamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bloques de contenido */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bloques de Contenido</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBloque}
              disabled={fields.length >= 50}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Bloque
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <BloqueField
                key={field.id}
                form={form}
                index={index}
                totalBloques={fields.length}
                onRemove={() => remove(index)}
                onMove={handleMoveBloque}
              />
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Guardando..." : narrativa ? "Actualizar" : "Crear"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

/**
 * Componente para editar un bloque individual - Simplificado
 */
function BloqueField({
  form,
  index,
  totalBloques,
  onRemove,
  onMove,
}: {
  form: ReturnType<typeof useForm<NarrativaFormData>>;
  index: number;
  totalBloques: number;
  onRemove: () => void;
  onMove: (index: number, direction: "up" | "down") => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const contenido = form.getValues(`bloques.${index}.contenido`);
  const tipo = form.getValues(`bloques.${index}.tipo`);

  // Manejar cambios de tipo y preview con Effect
  useEffect(() => {
    if (tipo === "imagen") {
      // Si hay contenido válido como URL, mostrar preview
      if (contenido && (contenido.startsWith("http") || contenido.startsWith("data:"))) {
        setPreview(contenido);
      } else {
        setPreview(null);
      }
    } else {
      // Si cambias a texto, limpiar preview
      setPreview(null);
    }
  }, [tipo, contenido]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadNarrativaImage(file);
      form.setValue(`bloques.${index}.contenido`, url);
      setPreview(url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error ? error.message : "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTipoChange = (newTipo: string) => {
    form.setValue(`bloques.${index}.tipo`, newTipo as "texto" | "imagen");
    // Limpiar contenido al cambiar tipo
    form.setValue(`bloques.${index}.contenido`, "");
  };

  return (
    <Card className="p-4 space-y-3 border-l-4 border-l-primary">
      {/* Controles: Tipo, Mover, Eliminar */}
      <div className="flex items-start gap-2">
        <FormField
          control={form.control}
          name={`bloques.${index}.tipo` as const}
          render={({ field }) => (
            <FormItem className="flex-1">
              <Select value={field.value} onValueChange={handleTipoChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="texto">📝 Texto</SelectItem>
                  <SelectItem value="imagen">🖼️ Imagen</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        {/* Botones de movimiento */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            title="Mover bloque arriba"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(index, "down")}
            disabled={index === totalBloques - 1}
            title="Mover bloque abajo"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón eliminar */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-red-500 hover:text-red-600"
          title="Eliminar bloque"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contenido */}
      <FormField
        control={form.control}
        name={`bloques.${index}.contenido` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              {tipo === "texto" ? (
                <Textarea
                  placeholder="Escribe todo el texto aquí. Usa Enter para separar párrafos..."
                  {...field}
                  rows={12}
                  className="resize-none"
                />
              ) : (
                <div className="space-y-3">
                  <label className="block cursor-pointer">
                    <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-3 hover:bg-accent transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {isUploading ? "Subiendo..." : "Subir o pegar URL"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    {...field}
                    type="url"
                    value={field.value || ""}
                    className="text-xs"
                  />

                  {/* Preview con Dialog para ampliar */}
                  {preview && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-muted">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-contain group-hover:opacity-75 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Click para ampliar
                            </span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <div className="relative w-full">
                          <img
                            src={preview}
                            alt="Imagen completa"
                            className="w-full h-auto rounded-lg object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Card>
  );
}
