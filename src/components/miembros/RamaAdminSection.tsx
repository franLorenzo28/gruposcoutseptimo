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
  onDeleteEvent: (eventId: string) => void;
}

export function RamaAdminSection({
  ramaName,
  rama = "lobatos",
  ramaContent,
  eventos,
  onSaveContent,
  onAddEvent,
  onDeleteEvent,
}: RamaAdminSectionProps) {
  const [activeTab, setActiveTab] = useState("contenido");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-red-100 dark:bg-red-950/30">
          <TabsTrigger value="contenido" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
          <TabsTrigger value="eventos" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
            {eventos.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold text-scout-yellow dark:text-yellow-400">
                {eventos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contenido" className="mt-4">
          <AdminRamaContent
            ramaName={ramaName}
            initialData={ramaContent}
            onSave={onSaveContent}
          />
        </TabsContent>

        <TabsContent value="eventos" className="mt-4">
          <AdminEvents
            ramaName={ramaName}
            eventos={eventos}
            onAddEvent={onAddEvent}
            onDeleteEvent={onDeleteEvent}
          />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <AdminDocuments ramaName={ramaName} rama={rama} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

