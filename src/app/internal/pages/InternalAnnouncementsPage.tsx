import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InternalPageHeader } from "@/app/internal/components/InternalPageHeader";
import { RamaBroadcastChannel } from "@/components/miembros/RamaBroadcastChannel";
import { useMemberAuth } from "@/context/MemberAuthContext";
import { ramaConfig } from "@/app/internal/rama-storage";
import type { MiembroRama } from "@/lib/member-auth";

export default function InternalAnnouncementsPage() {
  const { session } = useMemberAuth();
  const initialRama = session?.rama ?? "lobatos";
  const allowedRamas = session?.allowedRamas?.length ? session.allowedRamas : [initialRama];
  const [activeRama, setActiveRama] = useState<MiembroRama>(initialRama);
  const canAdminActiveRama = !!session?.isRamaAdmin && allowedRamas.includes(activeRama);

  if (!session) return null;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Canal interno"
        title="Anuncios y difusión"
        description="Consulta avisos oficiales de tu unidad y, si eres educador/a, publica comunicaciones operativas desde un solo lugar."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full bg-background/80">
              Rama activa: {ramaConfig[activeRama].titulo}
            </Badge>
            <Badge variant="outline" className="rounded-full bg-background/80">
              Modo: {canAdminActiveRama ? "publicación" : "lectura"}
            </Badge>
          </div>
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

      <RamaBroadcastChannel rama={activeRama} isRamaAdmin={canAdminActiveRama} />
    </section>
  );
}
