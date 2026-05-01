import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PendingApprovalScreenProps = {
  userName?: string;
  status?: string | null;
};

export default function PendingApprovalScreen({ userName, status }: PendingApprovalScreenProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const isRejected = status === "rechazado";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-muted/20 p-4">
      <Card className="w-full max-w-md border border-amber-400/30 dark:border-amber-500/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl font-bold">
            {isRejected ? "Solicitud rechazada" : "Cuenta pendiente de aprobación"}
          </CardTitle>
          <CardDescription className="mt-2">
            {isRejected
              ? "Tu solicitud de acceso no fue aprobada. Contacta a un administrador para más información."
              : `Hola ${userName || "Usuario"}. Tu registro fue recibido y está siendo revisado por un administrador.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isRejected && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Próximos pasos:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Verifica tu correo electrónico</li>
                <li>Contacta a un responsable por WhatsApp</li>
                <li>Un administrador revisará tu solicitud</li>
                <li>Recibirás acceso cuando seas aprobado</li>
              </ol>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
