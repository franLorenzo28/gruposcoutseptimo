import type { MiembroRama } from "@/lib/member-auth";
import {
  getRamaFromProfile,
  type RamaKey,
  type RamaProfileFields,
} from "@/lib/rama";

const MIEMBRO_TO_RAMA_KEY: Record<MiembroRama, RamaKey> = {
  lobatos: "manada",
  tropa: "tropa",
  pioneros: "pioneros",
  rover: "rovers",
};

export function getEducatorRamaKeys(allowedRamas: MiembroRama[]): Set<RamaKey> {
  return new Set(allowedRamas.map((rama) => MIEMBRO_TO_RAMA_KEY[rama]));
}

export function getRamaContactUserIds(
  profiles: Array<{ user_id: string } & RamaProfileFields>,
  currentUserId: string,
  allowedRamaKeys: Set<RamaKey>,
): Set<string> {
  const ids = new Set<string>();
  if (allowedRamaKeys.size === 0) return ids;

  for (const profile of profiles) {
    if (profile.user_id === currentUserId) continue;
    const rama = getRamaFromProfile(profile);
    if (allowedRamaKeys.has(rama)) {
      ids.add(profile.user_id);
    }
  }

  return ids;
}
