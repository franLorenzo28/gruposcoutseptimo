import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { DocumentsList } from "@/components/miembros/DocumentsList";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { ramaConfig } from "@/app/internal/rama-storage";
import type { MiembroRama } from "@/lib/member-auth";

export default function InternalDocumentsPage() {
  const { session } = useMemberAuth();
  const initialRama = session?.rama ?? "lobatos";
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : [initialRama];
  const [activeRama, setActiveRama] = useState<MiembroRama>(initialRama);

  if (!session) return null;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Centro documental"
        title="Documentos internos"
        description="Accede al material compartido por cada unidad sin salir de la plataforma interna."
        meta={<Badge variant="outline" className="rounded-full bg-background/80">Unidad activa: {ramaConfig[activeRama].titulo}</Badge>}
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

      <div className="rounded-[26px] border border-border/70 bg-card/85 p-4 shadow-[0_14px_40px_-28px_hsla(0,0%,0%,0.35)] sm:p-5">
        <DocumentsList rama={activeRama} />
      </div>
    </section>
  );
}
