import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { BookOpen, Search, ExternalLink, FileText } from "lucide-react";

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "guia" | "manual" | "referencia" | "material";
  url?: string;
}

const libraryData: LibraryItem[] = [
  {
    id: "1",
    title: "Manual del Educador Scout",
    description: "Guía completa para educadores sobre metodología educativa scout.",
    category: "Educación",
    type: "manual",
  },
  {
    id: "2",
    title: "Sistema de Progresión Personal",
    description: "Documento de referencia sobre el sistema de insignias y progresión.",
    category: "Metodología",
    type: "guia",
  },
  {
    id: "3",
    title: "Técnicas de Campamento",
    description: "Manual de habilidades y técnicas para actividades al aire libre.",
    category: "Actividades",
    type: "manual",
  },
  {
    id: "4",
    title: "Marco Simbólico Scout",
    description: "Referencia sobre el marco simbólico y su aplicación en cada rama.",
    category: "Metodología",
    type: "referencia",
  },
  {
    id: "5",
    title: "Planificación de Ciclo de Programa",
    description: "Guía paso a paso para planificar el ciclo de programa anual.",
    category: "Planificación",
    type: "guia",
  },
  {
    id: "6",
    title: "Cancionero Scout Nacional",
    description: "Recopilación de canciones tradicionales del movimiento scout.",
    category: "Recursos",
    type: "material",
  },
];

const categories = Array.from(new Set(libraryData.map((item) => item.category)));

const typeLabels: Record<LibraryItem["type"], string> = {
  guia: "Guía",
  manual: "Manual",
  referencia: "Referencia",
  material: "Material",
};

export default function InternalLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = libraryData.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Biblioteca Scout"
        title="Material de referencia"
        description="Guias, manuales y documentos educativos para el trabajo en las unidades."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar en la biblioteca..."
          className="pl-9 rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={!activeCategory ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setActiveCategory(null)}
        >
          Todas
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="border-border/70 bg-card/85 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  {item.type === "material" ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </div>
                <Badge variant="outline" className="rounded-full shrink-0">
                  {typeLabels[item.type]}
                </Badge>
              </div>
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.category}</span>
                {item.url ? (
                  <Button variant="ghost" size="sm" className="rounded-full" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Abrir <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Próximamente</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-border/70 bg-background/70 p-8 text-center text-sm text-muted-foreground">
            No se encontraron materiales con esos criterios.
          </p>
        )}
      </div>
    </section>
  );
}
