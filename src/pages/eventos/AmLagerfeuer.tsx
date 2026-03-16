import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Calendar, Users, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  listLagerfeuerFiles,
  uploadLagerfeuerFile,
  deleteLagerfeuerFile,
  type LagerfeuerFile,
} from "@/lib/lagerfeuer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AmLagerfeuer = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lagerfeuers, setLagerfeuers] = useState<LagerfeuerFile[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadFiles();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol_adulto")
      .eq("user_id", user.id)
      .single();

    setIsAdmin(profile?.rol_adulto === "admin");
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const files = await listLagerfeuerFiles();
      setLagerfeuers(files);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los archivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (const file of Array.from(files)) {
        // Validar que sea PDF
        if (file.type !== "application/pdf") {
          toast({
            title: "Error",
            description: `${file.name} no es un archivo PDF`,
            variant: "destructive",
          });
          continue;
        }

        await uploadLagerfeuerFile(file);
      }

      toast({
        title: "Archivos subidos",
        description: `Se subieron ${files.length} archivo(s) exitosamente`,
      });

      await loadFiles();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron subir los archivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (path: string) => {
    setDeleteTarget(path);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteLagerfeuerFile(deleteTarget);
      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó exitosamente",
      });
      await loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      {/* Hero */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-sm">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                Tradición Scout
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6">
              Am Lagerfeuer
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto">
              Repositorio de nuestras reuniones nocturnas alrededor del fuego.
              Aquá encontrarás los registros de cada Am Lagerfeuer: cantos,
              historias y momentos compartidos que forman parte de nuestra
              historia scout.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de Am Lagerfeuers */}
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Admin Upload Section */}
            {isAdmin && (
              <Card className="mb-6 border-2 border-primary/30">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        Subir Am Lagerfeuer (Admin)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Solo archivos PDF. Nombra el archivo como: YYYY-NN-descripcion.pdf
                      </p>
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={handleUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? "Subiendo..." : "Subir PDFs"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando archivos...</p>
              </div>
            ) : lagerfeuers.length === 0 ? (
              <div className="text-center py-12">
                <Flame className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay Am Lagerfeuers disponibles aún
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                {lagerfeuers.map((event, index) => (
                  <Card
                    key={index}
                    className="card-hover border-2 hover:border-primary/50 transition-all duration-500 overflow-hidden group"
                  >
                    <div className="h-2 bg-foreground/10"></div>
                    <CardContent className="p-5 sm:p-6 lg:p-8">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted/30 rounded-xl flex items-center justify-center">
                              <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                                Am Lagerfeuer {event.año}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {event.tema}
                              </p>
                              {event.editores && (
                                <p className="text-xs text-muted-foreground">
                                  Editores: {event.editores}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground pl-0 sm:pl-14">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm">{event.fileName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 md:ml-4">
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button
                              className="w-full sm:w-auto gap-2"
                              variant="default"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </Button>
                          </a>
                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(event.path)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Mensaje informativo */}
            <Card className="mt-8 sm:mt-12 border-2 border-accent/30 bg-muted/20">
              <CardContent className="p-5 sm:p-6 lg:p-8 text-center">
                <Flame className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-3">
                  ¿Tenés registros de Am Lagerfeuers anteriores?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Si tenés fotos, videos o documentos de Am Lagerfeuers
                  históricos del grupo, ayudanos a completar este repositorio.
                  Contactá con los dirigentes para compartir tus archivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo se eliminará
              permanentemente del repositorio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer global en App.tsx */}
    </div>
  );
};

export default AmLagerfeuer;



