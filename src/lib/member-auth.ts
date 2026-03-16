export type MiembroRama = "rover" | "pioneros" | "caminantes" | "lobatos";

export interface MemberSession {
  nombre: string;
  rama: MiembroRama;
  loggedAt: string;
}

export function deriveRamaFromEdad(edad: number | null | undefined): MiembroRama | null {
  if (typeof edad !== "number" || Number.isNaN(edad)) return null;
  if (edad >= 18) return "rover";
  if (edad >= 15) return "pioneros";
  if (edad >= 11) return "caminantes";
  if (edad >= 7) return "lobatos";
  return null;
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
    return parsed as MemberSession;
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
