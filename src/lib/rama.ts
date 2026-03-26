export type RamaKey =
  | "manada"
  | "tropa"
  | "pioneros"
  | "rovers"
  | "adulto"
  | "sin-rama";

export const RAMA_LABEL: Record<RamaKey, string> = {
  manada: "Manada",
  tropa: "Tropa",
  pioneros: "Pioneros",
  rovers: "Rovers",
  adulto: "Adulto",
  "sin-rama": "Sin rama",
};

export type RamaProfileFields = {
  edad: number | null;
  rol_adulto?: string | null;
  rama_que_educa?: string | null;
  seisena?: string | null;
  patrulla?: string | null;
  equipo_pioneros?: string | null;
  comunidad_rovers?: string | null;
};

const normalizeText = (value: string | null | undefined) =>
  (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getRamaFromProfile = (profile: RamaProfileFields): RamaKey => {
  // Para beneficiarios, la edad define la rama actual aunque existan campos legacy.
  if (profile.edad !== null && profile.edad < 21) {
    if (profile.edad >= 18) return "rovers";
    if (profile.edad >= 15) return "pioneros";
    if (profile.edad >= 11) return "tropa";
    if (profile.edad >= 7) return "manada";
  }

  const ramaEducador = normalizeText(profile.rama_que_educa);

  if (ramaEducador) {
    if (ramaEducador.includes("manada") || ramaEducador.includes("lobat")) {
      return "manada";
    }
    if (ramaEducador.includes("tropa") || ramaEducador.includes("camin")) {
      return "tropa";
    }
    if (ramaEducador.includes("pioner")) {
      return "pioneros";
    }
    if (ramaEducador.includes("rover")) {
      return "rovers";
    }
  }

  if (profile.rol_adulto && profile.edad !== null && profile.edad >= 21) {
    return "adulto";
  }

  if (profile.seisena) return "manada";
  if (profile.patrulla) return "tropa";
  if (profile.equipo_pioneros) return "pioneros";
  if (profile.comunidad_rovers) return "rovers";

  if (profile.edad === null) return "sin-rama";
  if (profile.edad >= 21) return "adulto";
  if (profile.edad >= 18) return "rovers";
  if (profile.edad >= 15) return "pioneros";
  if (profile.edad >= 11) return "tropa";
  if (profile.edad >= 7) return "manada";
  return "sin-rama";
};

export const getRamaLabel = (profile: RamaProfileFields) =>
  RAMA_LABEL[getRamaFromProfile(profile)];
