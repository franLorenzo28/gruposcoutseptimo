import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { ramaConfig } from "@/app/internal/rama-storage";
import type { MiembroRama } from "@/lib/member-auth";
import {
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";

interface PlanningItem {
  id: string;
  titulo: string;
  descripcion: string;
  fase: "diagnostico" | "planificacion" | "ejecucion" | "evaluacion";
  fechaInicio: string;
  fechaFin: string;
  completado: number;
  total: number;
}

const planningData: Record<MiembroRama, PlanningItem[]> = {
  lobatos: [
    { id: "l1", titulo: "Diagnóstico de unidad", descripcion: "Evaluación inicial del grupo y necesidades.", fase: "diagnostico", fechaInicio: "01/03/2026", fechaFin: "15/03/2026", completado: 3, total: 3 },
    { id: "l2", titulo: "Plan de juegos educativo", descripcion: "Diseño de actividades lúdicas para el semestre.", fase: "planificacion", fechaInicio: "16/03/2026", fechaFin: "30/04/2026", completado: 2, total: 5 },
    { id: "l3", titulo: "Gran juego en la naturaleza", descripcion: "Salida didáctica al aire libre.", fase: "ejecucion", fechaInicio: "01/05/2026", fechaFin: "15/05/2026", completado: 1, total: 4 },
  ],
  tropa: [
    { id: "t1", titulo: "Plan de patrullas", descripcion: "Organización y objetivos de patrullas.", fase: "planificacion", fechaInicio: "01/03/2026", fechaFin: "20/03/2026", completado: 4, total: 6 },
    { id: "t2", titulo: "Campamento de patrullas", descripcion: "Preparación y ejecución del campamento.", fase: "ejecucion", fechaInicio: "15/04/2026", fechaFin: "20/04/2026", completado: 3, total: 8 },
  ],
  pioneros: [
    { id: "p1", titulo: "Proyecto comunitario", descripcion: "Planificación del proyecto de servicio.", fase: "diagnostico", fechaInicio: "01/03/2026", fechaFin: "31/03/2026", completado: 1, total: 4 },
    { id: "p2", titulo: "Expedición de unidad", descripcion: "Preparación de la expedición pionera.", fase: "planificacion", fechaInicio: "01/04/2026", fechaFin: "30/06/2026", completado: 0, total: 6 },
  ],
  rover: [
    { id: "r1", titulo: "Plan de servicio anual", descripcion: "Definición de acciones solidarias del año.", fase: "planificacion", fechaInicio: "01/03/2026", fechaFin: "30/03/2026", completado: 2, total: 5 },
    { id: "r2", titulo: "Ruta de servicio", descripcion: "Preparación de la ruta rover.", fase: "ejecucion", fechaInicio: "01/05/2026", fechaFin: "31/05/2026", completado: 1, total: 3 },
  ],
};

const faseConfig = {
  diagnostico: { label: "Diagnóstico", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Target },
  planificacion: { label: "Planificación", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: ClipboardCheck },
  ejecucion: { label: "Ejecución", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: TrendingUp },
  evaluacion: { label: "Evaluación", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
};

export default function InternalPlanningPage() {
  const { session } = useMemberAuth();
  const initialRama = session?.rama ?? "lobatos";
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : [initialRama];
  const [activeRama, setActiveRama] = useState<MiembroRama>(initialRama);

  if (!session) return null;

  const items = planningData[activeRama] || [];
  const totalProgress = items.reduce((acc, item) => acc + item.completado, 0);
  const totalTasks = items.reduce((acc, item) => acc + item.total, 0);
  const progressPct = totalTasks > 0 ? Math.round((totalProgress / totalTasks) * 100) : 0;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Planificación operativa"
        title="Ciclo de programa"
        description="Seguí y gestioná el plan de actividades de tu unidad para el ciclo en curso."
        meta={
          <Badge variant="outline" className="rounded-full bg-background/80">
            Unidad activa: {ramaConfig[activeRama].titulo}
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-2">
        {allowedRamas.map((rama) => (
          <Button
            key={rama}
            type="button"
            variant={activeRama === rama ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setActiveRama(rama)}
          >
            {ramaConfig[rama].titulo}
          </Button>
        ))}
      </div>

      <Card className="border-border/70 bg-card/85 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Progreso general</p>
                <p className="text-xs text-muted-foreground">
                  {totalProgress} de {totalTasks} tareas completadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm font-bold">{progressPct}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((item) => {
          const fase = faseConfig[item.fase];
          const FaseIcon = fase.icon;
          const itemProgress = item.total > 0 ? Math.round((item.completado / item.total) * 100) : 0;

          return (
            <Card key={item.id} className="border-border/70 bg-card/85 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${fase.color}`}>
                      <FaseIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold">{item.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shrink-0 ${fase.color}`}>
                    {fase.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.fechaInicio} → {item.fechaFin}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {item.completado === item.total ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {item.completado}/{item.total} tareas
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      itemProgress === 100 ? "bg-emerald-500" : "bg-primary"
                    }`}
                    style={{ width: `${itemProgress}%` }}
                  />
                </div>

                <Button variant="outline" size="sm" className="rounded-full">
                  <Plus className="mr-1 h-3 w-3" />
                  Ver detalle
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-8 text-center text-sm text-muted-foreground">
            No hay planificación cargada para esta unidad.
          </p>
        )}
      </div>
    </section>
  );
}
