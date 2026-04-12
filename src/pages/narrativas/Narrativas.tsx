import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { isCurrentUserAdmin } from "@/lib/admin-permissions";
import { NarrativaConAutor, CreateNarrativaInput } from "@/types/narrativa";
import {
  getNarrativas,
  createNarrativa,
  updateNarrativa,
  deleteNarrativa,
} from "@/lib/narrativas";
import {
  NarrativaCard,
  NarrativaViewer,
  NarrativaForm,
} from "@/components/narrativas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "list" | "view" | "edit";

export default function Narrativas() {
  const { user } = useUser();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedNarrativa, setSelectedNarrativa] =
    useState<NarrativaConAutor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Cargar estado de admin
  const adminQuery = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const result = await isCurrentUserAdmin();
      setIsAdmin(result);
      return result;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Cargar narrativas
  const narrativasQuery = useQuery({
    queryKey: ["narrativas"],
    queryFn: () => getNarrativas(),
    staleTime: 1000 * 60 * 2,
  });

  // Crear narrativa
  const createMutation = useMutation({
    mutationFn: (input: CreateNarrativaInput) => createNarrativa(input),
    onSuccess: () => {
      toast({
        title: "Narrativa creada",
        description: "La narrativa se ha creado exitosamente",
      });
      narrativasQuery.refetch();
      setViewMode("list");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la narrativa",
        variant: "destructive",
      });
    },
  });

  // Actualizar narrativa
  const updateMutation = useMutation({
    mutationFn: async (input: CreateNarrativaInput) => {
      if (!selectedNarrativa) throw new Error("No narrativa selected");
      return updateNarrativa(selectedNarrativa.id, input);
    },
    onSuccess: () => {
      toast({
        title: "Narrativa actualizada",
        description: "La narrativa se ha actualizado exitosamente",
      });
      narrativasQuery.refetch();
      setViewMode("list");
      setSelectedNarrativa(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la narrativa",
        variant: "destructive",
      });
    },
  });

  // Eliminar narrativa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNarrativa(id),
    onSuccess: () => {
      toast({
        title: "Narrativa eliminada",
        description: "La narrativa se ha eliminado exitosamente",
      });
      narrativasQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la narrativa",
        variant: "destructive",
      });
    },
  });

  // Agrupar narrativas por year_section
  const groupedNarrativas = useMemo(() => {
    const narrativas = narrativasQuery.data || [];
    const filtered = searchTerm
      ? narrativas.filter(
          (n) =>
            n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.year_section.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : narrativas;

    const grouped: { [key: string]: NarrativaConAutor[] } = {};
    filtered.forEach((n) => {
      if (!grouped[n.year_section]) {
        grouped[n.year_section] = [];
      }
      grouped[n.year_section].push(n);
    });

    // Ordenar años descendentemente (más reciente primero)
    return Object.keys(grouped)
      .sort((a, b) => {
        // Extraer año numérico
        const yearA = parseInt(a.match(/\d{4}/)?.[0] || "0");
        const yearB = parseInt(b.match(/\d{4}/)?.[0] || "0");
        return yearB - yearA;
      })
      .reduce((acc, key) => {
        // Ordenar narrativas dentro del año por fecha de publicación descendente (más reciente primero)
        acc[key] = grouped[key].sort((a, b) => {
          const dateA = new Date(a.fecha_publicacion || a.created_at).getTime();
          const dateB = new Date(b.fecha_publicacion || b.created_at).getTime();
          return dateB - dateA;
        });
        return acc;
      }, {} as { [key: string]: NarrativaConAutor[] });
  }, [narrativasQuery.data, searchTerm]);

  // Las claves numéricas en objetos pueden renderizarse en orden ascendente;
  // por eso forzamos el orden de secciones al pintar el acordeón.
  const sortedYearSections = useMemo(() => {
    return Object.keys(groupedNarrativas).sort((a, b) => {
      const yearA = parseInt(a.match(/\d{4}/)?.[0] || "0");
      const yearB = parseInt(b.match(/\d{4}/)?.[0] || "0");
      return yearB - yearA;
    });
  }, [groupedNarrativas]);

  // Manejo de eventos
  const handleAddNarrativa = () => {
    setSelectedNarrativa(null);
    setViewMode("edit");
  };

  const handleEditNarrativa = (narrativa: NarrativaConAutor) => {
    setSelectedNarrativa(narrativa);
    setViewMode("edit");
  };

  const handleViewNarrativa = (narrativa: NarrativaConAutor) => {
    setSelectedNarrativa(narrativa);
    setViewMode("view");
  };

  const handleDeleteNarrativa = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFormSubmit = async (input: CreateNarrativaInput) => {
    if (selectedNarrativa) {
      await updateMutation.mutateAsync(input);
    } else {
      await createMutation.mutateAsync(input);
    }
  };

  // Vistas
  if (viewMode === "view" && selectedNarrativa) {
    return (
      <NarrativaViewer
        narrativa={selectedNarrativa}
        onBack={() => {
          setViewMode("list");
          setSelectedNarrativa(null);
        }}
      />
    );
  }

  if (viewMode === "edit") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">
          {selectedNarrativa ? "Editar Narrativa" : "Nueva Narrativa"}
        </h1>
        <NarrativaForm
          narrativa={selectedNarrativa || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setViewMode("list");
            setSelectedNarrativa(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Narrativas</h1>
        <p className="text-muted-foreground">
          Relatos históricos del séptimo. Cada narrativa cuenta un momento
          importante del año.
        </p>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Button
            onClick={handleAddNarrativa}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Narrativa
          </Button>
        )}
      </div>

      {/* Narrativas agrupadas por año */}
      {narrativasQuery.isPending ? (
        <Card className="p-8 text-center text-muted-foreground">
          Cargando narrativas...
        </Card>
      ) : sortedYearSections.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay narrativas disponibles
        </Card>
      ) : (
        <div className="space-y-4">
          <Accordion
            type="multiple"
            defaultValue={sortedYearSections.slice(0, 3)}
            className="space-y-2"
          >
            {sortedYearSections.map((yearSection) => {
              const narrativas = groupedNarrativas[yearSection] || [];
              return (
              <AccordionItem
                key={yearSection}
                value={yearSection}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="text-left">
                    <p className="text-lg font-bold text-primary">
                      {yearSection}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {narrativas.length} {narrativas.length === 1 ? "narrativa" : "narrativas"}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {narrativas.map((narrativa) => (
                    <div key={narrativa.id}>
                      <NarrativaCard
                        narrativa={narrativa}
                        onView={handleViewNarrativa}
                        onEdit={handleEditNarrativa}
                        onDelete={handleDeleteNarrativa}
                        currentUserId={user?.id}
                        isAdmin={isAdmin}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
