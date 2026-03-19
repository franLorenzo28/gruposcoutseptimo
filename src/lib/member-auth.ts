export type MiembroRama = "rover" | "pioneros" | "caminantes" | "lobatos";

export type RamaEducador = "manada" | "tropa" | "pioneros" | "rovers";

export type MemberAccessType = "beneficiario" | "educador";

export interface MemberSession {
  nombre: string;
  rama: MiembroRama;
  isRamaAdmin: boolean;
  accessType: MemberAccessType;
  loggedAt: string;
}

export interface MemberAccessDecision {
  allowed: boolean;
  rama: MiembroRama | null;
  isRamaAdmin: boolean;
  accessType: MemberAccessType | null;
  reason?: string;
}

export function deriveRamaFromEdad(edad: number | null | undefined): MiembroRama | null {
  if (typeof edad !== "number" || Number.isNaN(edad)) return null;
  if (edad >= 18) return "rover";
  if (edad >= 15) return "pioneros";
  if (edad >= 11) return "caminantes";
  if (edad >= 7) return "lobatos";
  return null;
}

export function mapEducatorRamaToMiembroRama(
  ramaEducador: string | null | undefined,
): MiembroRama | null {
  if (!ramaEducador) return null;
  const normalized = String(ramaEducador).trim().toLowerCase();
  if (normalized === "manada") return "lobatos";
  if (normalized === "tropa") return "caminantes";
  if (normalized === "pioneros") return "pioneros";
  if (normalized === "rovers") return "rover";
  if (normalized === "lobatos") return "lobatos";
  if (normalized === "caminantes") return "caminantes";
  if (normalized === "rover") return "rover";
  return null;
}

export function inferEducatorRama(profile: {
  rama_que_educa?: string | null;
  seisena?: string | null;
  patrulla?: string | null;
  equipo_pioneros?: string | null;
  comunidad_rovers?: string | null;
}): RamaEducador | null {
  const explicit = String(profile.rama_que_educa || "").trim().toLowerCase();
  if (
    explicit === "manada" ||
    explicit === "tropa" ||
    explicit === "pioneros" ||
    explicit === "rovers"
  ) {
    return explicit;
  }

  if (String(profile.seisena || "").trim()) return "manada";
  if (String(profile.patrulla || "").trim()) return "tropa";
  if (String(profile.equipo_pioneros || "").trim()) return "pioneros";
  if (String(profile.comunidad_rovers || "").trim()) return "rovers";
  return null;
}

export function resolveMemberAccessFromProfile(profile: {
  edad?: number | null;
  rol_adulto?: string | null;
  rama_que_educa?: string | null;
  seisena?: string | null;
  patrulla?: string | null;
  equipo_pioneros?: string | null;
  comunidad_rovers?: string | null;
}): MemberAccessDecision {
  const edad = profile.edad;
  const ramaPorEdad = deriveRamaFromEdad(edad);

  if (!ramaPorEdad) {
    return {
      allowed: false,
      rama: null,
      isRamaAdmin: false,
      accessType: null,
      reason: "No se pudo determinar tu rama por edad. Revisa tu fecha de nacimiento en el perfil.",
    };
  }

  if ((edad ?? 0) < 21) {
    return {
      allowed: true,
      rama: ramaPorEdad,
      isRamaAdmin: false,
      accessType: "beneficiario",
    };
  }

  const rolAdulto = String(profile.rol_adulto || "").trim();
  if (!rolAdulto) {
    return {
      allowed: false,
      rama: null,
      isRamaAdmin: false,
      accessType: null,
      reason:
        "Si tienes 21 años o más, debes indicar tu rol en el perfil para ingresar al área de miembros.",
    };
  }

  if (rolAdulto !== "Educador/a") {
    return {
      allowed: false,
      rama: null,
      isRamaAdmin: false,
      accessType: null,
      reason:
        "El área de miembros es exclusiva para beneficiarios y educadores. Si no eres educador/a, no tienes acceso interno.",
    };
  }

  const ramaEducador = inferEducatorRama(profile);
  const ramaMiembro = mapEducatorRamaToMiembroRama(ramaEducador);
  if (!ramaMiembro) {
    return {
      allowed: false,
      rama: null,
      isRamaAdmin: false,
      accessType: null,
      reason:
        "Como educador/a adulto, debes definir la rama que diriges en tu perfil para habilitar tu dashboard de rama.",
    };
  }

  return {
    allowed: true,
    rama: ramaMiembro,
    isRamaAdmin: true,
    accessType: "educador",
  };
}

const MEMBER_SESSION_KEY = "grupo7_member_session";

export function getStoredMemberSession(): MemberSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MEMBER_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MemberSession>;
    if (!parsed?.nombre || !parsed?.rama || !parsed?.loggedAt) return null;
    if (!["rover", "pioneros", "caminantes", "lobatos"].includes(parsed.rama)) {
      return null;
    }
    const rawAccessType = parsed.accessType;
    const accessType: MemberAccessType =
      rawAccessType === "educador" || rawAccessType === "beneficiario"
        ? rawAccessType
        : "beneficiario";

    return {
      nombre: parsed.nombre,
      rama: parsed.rama as MiembroRama,
      loggedAt: parsed.loggedAt,
      isRamaAdmin: !!parsed.isRamaAdmin,
      accessType,
    };
  } catch {
    return null;
  }
}

export function saveMemberSession(session: MemberSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(session));
}

export function clearMemberSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MEMBER_SESSION_KEY);
}
