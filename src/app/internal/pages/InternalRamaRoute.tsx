import { useParams, Navigate } from "react-router-dom";
import RequireRamaAccess from "@/components/auth/RequireRamaAccess";
import PanelRama from "@/pages/miembros/PanelRama";
import type { MiembroRama } from "@/lib/member-auth";

const validRamas: Record<string, MiembroRama> = {
  rover: "rover",
  rovers: "rover",
  pioneros: "pioneros",
  pionero: "pioneros",
  tropa: "tropa",
  lobatos: "lobatos",
  manada: "lobatos",
};

export default function InternalRamaRoute() {
  const { rama } = useParams<{ rama?: string }>();
  const normalizedKey = (rama || "").toLowerCase().trim();
  const targetRama = validRamas[normalizedKey];

  if (!targetRama) {
    return <Navigate to="/interno/dashboard" replace />;
  }

  return (
    <RequireRamaAccess allowedRama={targetRama}>
      <PanelRama rama={targetRama} />
    </RequireRamaAccess>
  );
}
