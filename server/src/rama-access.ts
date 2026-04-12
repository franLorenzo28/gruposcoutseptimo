import { db } from "./db";

export const RAMAS = ["lobatos", "caminantes", "pioneros", "rover"] as const;

export type RamaKey = (typeof RAMAS)[number];

type ProfileRow = {
  user_id: string;
  fecha_nacimiento: string | null;
  rol_adulto: string | null;
  rama_que_educa: string | null;
  seisena: string | null;
  patrulla: string | null;
  equipo_pioneros: string | null;
  comunidad_rovers: string | null;
};

export type RamaContact = {
  user_id: string;
  nombre_completo: string | null;
  username: string | null;
  avatar_url: string | null;
  access_type: "beneficiario" | "educador";
};

export type UserRamaAccess = {
  userId: string;
  age: number | null;
  beneficiaryRama: RamaKey | null;
  educatorRamas: RamaKey[];
  educatorRama: RamaKey | null;
  isEducator: boolean;
};

function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function calculateAge(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  const [y, m, d] = String(fechaNacimiento)
    .split("-")
    .map((part) => parseInt(part, 10));

  if (!y || !m || !d) return null;

  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }

  return years;
}

function deriveBeneficiaryRama(age: number | null): RamaKey | null {
  if (typeof age !== "number" || Number.isNaN(age)) return null;
  if (age >= 18) return "rover";
  if (age >= 15) return "pioneros";
  if (age >= 11) return "caminantes";
  if (age >= 7) return "lobatos";
  return null;
}

function mapEducatorRama(rawRama: string | null | undefined): RamaKey | null {
  const normalized = normalizeText(rawRama);
  if (!normalized) return null;

  if (normalized === "manada" || normalized === "lobatos") return "lobatos";
  if (normalized === "tropa" || normalized === "caminantes") return "caminantes";
  if (normalized === "pioneros") return "pioneros";
  if (normalized === "rovers" || normalized === "rover") return "rover";

  return null;
}

function parseEducatorRamas(rawRamas: string | null | undefined): RamaKey[] {
  if (!rawRamas) return [];

  const splitTokens = String(rawRamas)
    .split(/[;,|]/g)
    .map((token) => token.trim())
    .filter(Boolean);

  const mapped = splitTokens
    .map((token) => mapEducatorRama(token))
    .filter((rama): rama is RamaKey => !!rama);

  return Array.from(new Set(mapped));
}

function inferEducatorRamas(profile: ProfileRow): RamaKey[] {
  const explicit = parseEducatorRamas(profile.rama_que_educa);
  if (explicit.length > 0) return explicit;

  const inferred: RamaKey[] = [];

  if (normalizeText(profile.seisena)) inferred.push("lobatos");
  if (normalizeText(profile.patrulla)) inferred.push("caminantes");
  if (normalizeText(profile.equipo_pioneros)) inferred.push("pioneros");
  if (normalizeText(profile.comunidad_rovers)) inferred.push("rover");

  return Array.from(new Set(inferred));
}

function isEducatorRole(rolAdulto: string | null | undefined): boolean {
  const normalized = normalizeText(rolAdulto);
  return normalized === "educador/a" || normalized === "educador" || normalized === "educadora";
}

function getProfileRow(userId: string): ProfileRow | null {
  const row = db
    .prepare(
      `
      SELECT user_id, fecha_nacimiento, rol_adulto, rama_que_educa,
             seisena, patrulla, equipo_pioneros, comunidad_rovers
      FROM profiles
      WHERE user_id = ?
      `,
    )
    .get(userId) as ProfileRow | undefined;

  return row || null;
}

function getUserAccessFromProfile(profile: ProfileRow): UserRamaAccess {
  const age = calculateAge(profile.fecha_nacimiento);
  const beneficiaryRama = age !== null && age < 21 ? deriveBeneficiaryRama(age) : null;

  const hasEducatorRole = age !== null && age >= 21 && isEducatorRole(profile.rol_adulto);
  const educatorRamas = hasEducatorRole ? inferEducatorRamas(profile) : [];
  const educatorRama = educatorRamas.length > 0 ? educatorRamas[0] : null;

  return {
    userId: profile.user_id,
    age,
    beneficiaryRama,
    educatorRamas,
    educatorRama,
    isEducator: educatorRamas.length > 0,
  };
}

export function isValidRama(value: string): value is RamaKey {
  return (RAMAS as readonly string[]).includes(value);
}

export function getUserRamaAccess(userId: string): UserRamaAccess | null {
  const row = getProfileRow(userId);
  if (!row) return null;
  return getUserAccessFromProfile(row);
}

export function canReadRama(userId: string, rama: RamaKey): boolean {
  const access = getUserRamaAccess(userId);
  if (!access) return false;
  return access.beneficiaryRama === rama || access.educatorRamas.includes(rama);
}

export function canModerateRama(userId: string, rama: RamaKey): boolean {
  const access = getUserRamaAccess(userId);
  if (!access) return false;
  return access.educatorRamas.includes(rama);
}

function areMutualFollowers(userA: string, userB: string): boolean {
  const followsAB = db
    .prepare(
      `
      SELECT 1
      FROM follows
      WHERE follower_id = ?
        AND following_id = ?
        AND status = 'accepted'
      LIMIT 1
      `,
    )
    .get(userA, userB);

  if (!followsAB) return false;

  const followsBA = db
    .prepare(
      `
      SELECT 1
      FROM follows
      WHERE follower_id = ?
        AND following_id = ?
        AND status = 'accepted'
      LIMIT 1
      `,
    )
    .get(userB, userA);

  return !!followsBA;
}

function canEducatorStartConversation(educatorId: string, targetId: string): boolean {
  const educatorAccess = getUserRamaAccess(educatorId);
  if (!educatorAccess || educatorAccess.educatorRamas.length === 0) return false;

  const targetAccess = getUserRamaAccess(targetId);
  if (!targetAccess) return false;

  const ramasObjetivo = new Set<RamaKey>();
  if (targetAccess.beneficiaryRama) ramasObjetivo.add(targetAccess.beneficiaryRama);
  for (const rama of targetAccess.educatorRamas) ramasObjetivo.add(rama);

  return educatorAccess.educatorRamas.some((rama) => ramasObjetivo.has(rama));
}

export function canStartConversation(initiatorId: string, otherId: string): boolean {
  if (areMutualFollowers(initiatorId, otherId)) return true;
  if (canEducatorStartConversation(initiatorId, otherId)) return true;
  return false;
}

export function listRamaContacts(rama: RamaKey): RamaContact[] {
  const rows = db
    .prepare(
      `
      SELECT p.user_id, p.nombre_completo, p.avatar_url, p.fecha_nacimiento,
             p.rol_adulto, p.rama_que_educa, p.seisena, p.patrulla,
             p.equipo_pioneros, p.comunidad_rovers, u.username
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      ORDER BY datetime(u.created_at) DESC
      `,
    )
    .all() as Array<
      ProfileRow & {
        nombre_completo: string | null;
        avatar_url: string | null;
        username: string | null;
      }
    >;

  const contacts: RamaContact[] = [];

  for (const row of rows) {
    const access = getUserAccessFromProfile(row);
    if (access.educatorRamas.includes(rama)) {
      contacts.push({
        user_id: row.user_id,
        nombre_completo: row.nombre_completo,
        username: row.username,
        avatar_url: row.avatar_url,
        access_type: "educador",
      });
      continue;
    }

    if (access.beneficiaryRama === rama) {
      contacts.push({
        user_id: row.user_id,
        nombre_completo: row.nombre_completo,
        username: row.username,
        avatar_url: row.avatar_url,
        access_type: "beneficiario",
      });
    }
  }

  return contacts;
}
