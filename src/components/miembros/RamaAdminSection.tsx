import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminRamaContent } from "./AdminRamaContent";
import { AdminEvents } from "./AdminEvents";
import { AdminDocuments } from "./AdminDocuments";
import { Settings, Calendar, FileText } from "lucide-react";
import type { MiembroRama } from "@/lib/member-auth";

interface RamaAdminSectionProps {
  ramaName: string;
  rama?: MiembroRama;
  ramaContent: any;
  eventos: any[];
  onSaveContent: (data: any) => void;
  onAddEvent: (event: any) => void;
  onUpdateEvent: (eventId: string, event: any) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function RamaAdminSection({
  ramaName,
  rama = "lobatos",
  ramaContent,
  eventos,
  onSaveContent,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: RamaAdminSectionProps) {
  const [activeTab, setActiveTab] = useState("contenido");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="rounded-[24px] border border-border/70 bg-card/80 p-3 shadow-[0_14px_32px_-24px_hsla(0,0%,0%,0.35)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Control de unidad
              </p>
              <h3 className="mt-1 text-lg font-black tracking-[-0.02em]">
                Gestion de {ramaName}
              </h3>
            </div>
            <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              {activeTab === "contenido" && "Editando contenido base"}
              {activeTab === "eventos" && "Organizando agenda y salidas"}
              {activeTab === "documentos" && "Administrando archivos"}
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-border/70 bg-muted/40 p-1">
            <TabsTrigger
              value="contenido"
              className="gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>Contenido</span>
            </TabsTrigger>
            <TabsTrigger
              value="eventos"
              className="gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
              {eventos.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-semibold">
                  {eventos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="documentos"
              className="gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contenido" className="mt-0">
          <AdminRamaContent
            ramaName={ramaName}
            initialData={ramaContent}
            onSave={onSaveContent}
          />
        </TabsContent>

        <TabsContent value="eventos" className="mt-0">
          <AdminEvents
            ramaName={ramaName}
            eventos={eventos}
            onAddEvent={onAddEvent}
            onUpdateEvent={onUpdateEvent}
            onDeleteEvent={onDeleteEvent}
          />
        </TabsContent>

        <TabsContent value="documentos" className="mt-0">
          <AdminDocuments ramaName={ramaName} rama={rama} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

