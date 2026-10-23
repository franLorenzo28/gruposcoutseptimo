type InternalUnitProfile = {
  account_status?: string | null;
  internal_access?: boolean | null;
  internal_unit?: string | null;
  role?: string | null;
  rol_adulto?: string | null;
  rama_que_educa?: string | null;
  educador_aprobado?: boolean | null;
};

export function isSupportedInternalUnit(unit: string | null | undefined): boolean {
  return ["lobatos", "tropa", "pioneros", "rover"].includes(unit || "");
}

export function needsInternalUnitReview(profile: InternalUnitProfile): boolean {
  if (profile.account_status !== "activo" || profile.internal_access !== true) return false;
  if (["admin", "mod"].includes((profile.role || "").toLowerCase())) return false;
  if (isSupportedInternalUnit(profile.internal_unit)) return false;

  const adultRole = (profile.rol_adulto || "").trim().toLowerCase();
  const educatorUnits = (profile.rama_que_educa || "").toLowerCase().split(/[;,|]/).map((unit) => unit.trim());
  const isApprovedEducator = profile.educador_aprobado === true
    && ["educador", "educador/a", "educadora"].includes(adultRole)
    && educatorUnits.some((unit) => ["manada", "lobatos", "tropa", "pioneros", "rovers", "rover"].includes(unit));

  return !isApprovedEducator;
}
