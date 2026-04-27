import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, RefreshCw } from "lucide-react";
import type { MiembroRama } from "@/lib/member-auth";
import { listRamaBroadcast, publishRamaBroadcast } from "@/lib/rama-difusion";
import { useToast } from "@/hooks/use-toast";

interface RamaBroadcastChannelProps {
  rama: MiembroRama;
  isRamaAdmin: boolean;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RamaBroadcastChannel({
  rama,
  isRamaAdmin,
}: RamaBroadcastChannelProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  const broadcastQuery = useQuery({
    queryKey: ["rama-broadcast", rama],
    queryFn: () => listRamaBroadcast(rama),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const publishMutation = useMutation({
    mutationFn: (content: string) => publishRamaBroadcast(rama, content),
    onSuccess: () => {
      setDraft("");
      broadcastQuery.refetch();
      toast({
        title: "Difusion enviada",
        description: "El mensaje ya esta visible para toda la unidad.",
      });
    },
    onError: (error: unknown) => {
      const description =
        error instanceof Error
          ? error.message
          : "No se pudo publicar el mensaje de difusion";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    const content = draft.trim();
    if (!content) return;
    publishMutation.mutate(content);
  };

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-3 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold">Canal de difusion</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRamaAdmin
                ? "Como educador/a, puedes publicar avisos para toda la unidad."
                : "Solo lectura: aqui veras avisos oficiales de tu equipo educativo."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => broadcastQuery.refetch()}
            disabled={broadcastQuery.isFetching}
          >
            {broadcastQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isRamaAdmin && (
          <div className="space-y-2 rounded-lg border border-border/70 bg-background/70 p-2.5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[72px] w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
              placeholder="Escribe un aviso para toda la unidad..."
              maxLength={2000}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{draft.length}/2000</span>
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending || !draft.trim()}
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Aceptar y enviar"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {broadcastQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando difusion...
            </div>
          ) : (broadcastQuery.data || []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
              Aun no hay mensajes de difusion para esta unidad.
            </div>
          ) : (
            (broadcastQuery.data || []).map((message) => {
              const author =
                message.nombre_completo ||
                (message.username ? `@${message.username}` : "Educador/a");
              return (
                <article key={message.id} className="rounded-lg border border-border/60 bg-background/80 p-2.5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {author} · {formatDateTime(message.created_at)}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
