import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";

interface FormItem {
  id: string;
  title: string;
  description: string;
  status: "abierto" | "cerrado" | "borrador";
  dueDate?: string;
  responses?: number;
  url?: string;
}

const formsData: FormItem[] = [
  {
    id: "1",
    title: "Ficha de inscripción 2026",
    description: "Formulario de inscripción y datos personales para el año scout.",
    status: "abierto",
    dueDate: "31/03/2026",
    responses: 24,
  },
  {
    id: "2",
    title: "Autorización salida de fin de semana",
    description: "Autorización firmada por responsable para actividades fuera del local.",
    status: "abierto",
    dueDate: "15/06/2026",
    responses: 18,
  },
  {
    id: "3",
    title: "Evaluación de actividad",
    description: "Encuesta interna para evaluar las actividades del mes.",
    status: "cerrado",
    responses: 32,
  },
  {
    id: "4",
    title: "Solicitud de material",
    description: "Formulario para solicitar materiales para actividades.",
    status: "abierto",
    dueDate: "30/06/2026",
    responses: 7,
  },
  {
    id: "5",
    title: "Encuesta de fin de ciclo",
    description: "Evaluación general del ciclo de programa por parte de los miembros.",
    status: "borrador",
  },
];

const statusConfig = {
  abierto: { label: "Abierto", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cerrado: { label: "Cerrado", class: "bg-muted text-muted-foreground" },
  borrador: { label: "Borrador", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
} as const;

export default function InternalFormsPage() {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = formsData.filter((f) => !filter || f.status === filter);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Formularios internos"
        title="Gestión de formularios"
        description="Accede a formularios activos, históricos y borradores del grupo."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!filter ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(null)}
          >
            Todos
          </Button>
          {(["abierto", "cerrado", "borrador"] as const).map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setFilter(s)}
            >
              {statusConfig[s].label}
            </Button>
          ))}
        </div>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo formulario
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((form) => {
          const status = statusConfig[form.status];
          return (
            <Card key={form.id} className="border-border/70 bg-card/85 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${status.class}`}>
                    {form.status === "abierto" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {status.label}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold">{form.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {form.responses !== undefined
                      ? `${form.responses} respuesta(s)`
                      : "Sin respuestas"}
                  </span>
                  {form.dueDate && <span>Vence: {form.dueDate}</span>}
                </div>
                <div className="flex gap-2">
                  {form.url ? (
                    <Button variant="default" size="sm" className="rounded-full" asChild>
                      <a href={form.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir
                      </a>
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" className="rounded-full">
                      <FileText className="mr-1 h-3 w-3" />
                      Ver
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-full">
                    Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-border/70 bg-background/70 p-8 text-center text-sm text-muted-foreground">
            No hay formularios con ese estado.
          </p>
        )}
      </div>
    </section>
  );
}
