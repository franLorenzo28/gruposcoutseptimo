export type AccountStatus =
  | "pendiente_email"
  | "pendiente_aprobacion"
  | "activo"
  | "rechazado";

export type RegistrationClassification =
  | "aprobado_automatico"
  | "revision_manual"
  | "rechazado";

export interface RegistrationProfileInput {
  nombre: string;
  apellido: string;
  email: string;
  tipo_relacion: string;
  rama?: string | null;
  nombre_scout_relacionado?: string | null;
}

function normalize(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasValue(value: string | null | undefined): boolean {
  return normalize(value).length > 0;
}

export function classifyRegistration(
  input: RegistrationProfileInput,
): {
  classification: RegistrationClassification;
  reason: string;
  nextStatus: AccountStatus;
} {
  const relationType = normalize(input.tipo_relacion);
  const hasCoreIdentity =
    hasValue(input.nombre) && hasValue(input.apellido) && hasValue(input.email);
  const hasRelatedScout = hasValue(input.nombre_scout_relacionado);
  const hasRama = hasValue(input.rama);

  if (!hasCoreIdentity || !hasValue(input.tipo_relacion)) {
    return {
      classification: "revision_manual",
      reason: "Faltan datos básicos para validar el alta.",
      nextStatus: "pendiente_aprobacion",
    };
  }

  if (relationType === "scout" && hasRama) {
    return {
      classification: "aprobado_automatico",
      reason: hasRelatedScout
        ? "Alta automática por perfil completo de scout con unidad y referencia asociada."
        : "Alta automática por perfil completo de scout con unidad informada.",
      nextStatus: "activo",
    };
  }

  return {
    classification: "revision_manual",
    reason: hasRama
      ? "Requiere revisión manual porque no cumple la regla de alta automática."
      : "Requiere revisión manual hasta que administración valide la unidad o relación declarada.",
    nextStatus: "pendiente_aprobacion",
  };
}

export function isAdminIp(requestIp: string | null | undefined): boolean {
  const allowed = (process.env.ADMIN_IPS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowed.length === 0) return false;

  const ip = String(requestIp || "")
    .trim()
    .replace(/^::ffff:/, "");
  return allowed.some((value) => {
    const normalized = value.replace(/^::ffff:/, "");
    return normalized === ip;
  });
}

export function normalizeAccountStatus(value: unknown): AccountStatus {
  const status = normalize(String(value || ""));
  if (status === "pendiente_email") return "pendiente_email";
  if (status === "pendiente_aprobacion") return "pendiente_aprobacion";
  if (status === "activo") return "activo";
  if (status === "rechazado") return "rechazado";
  return "pendiente_email";
}

export function isActiveAccountStatus(value: unknown): boolean {
  return normalizeAccountStatus(value) === "activo";
}
