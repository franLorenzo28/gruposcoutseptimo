import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminRamaContent } from "./AdminRamaContent";
import { AdminDocuments } from "./AdminDocuments";
import { AdminEvents } from "./AdminEvents";
import { Settings, FileText, Calendar } from "lucide-react";

interface RamaAdminSectionProps {
  ramaName: string;
  ramaContent: any;
  documentos: any[];
  eventos: any[];
  onSaveContent: (data: any) => void;
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (docId: string) => void;
  onAddEvent: (event: any) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function RamaAdminSection({
  ramaName,
  ramaContent,
  documentos,
  eventos,
  onSaveContent,
  onUploadDocument,
  onDeleteDocument,
  onAddEvent,
  onDeleteEvent,
}: RamaAdminSectionProps) {
  const [activeTab, setActiveTab] = useState("contenido");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-emerald-100">
          <TabsTrigger value="contenido" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
            {documentos.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {documentos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="eventos" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
            {eventos.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-purple-700">
                {eventos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contenido" className="mt-4">
          <AdminRamaContent
            ramaName={ramaName}
            initialData={ramaContent}
            onSave={onSaveContent}
          />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <AdminDocuments
            ramaName={ramaName}
            documentos={documentos}
            onUpload={onUploadDocument}
            onDelete={onDeleteDocument}
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
      </Tabs>
    </div>
  );
}
