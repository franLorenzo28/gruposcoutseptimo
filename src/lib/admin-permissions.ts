import { supabase } from "@/integrations/supabase/client";
import { apiFetch, isLocalBackend } from "@/lib/backend";

const ADMIN_UPLOAD_ERROR = "Solo los usuarios admin pueden subir archivos multimedia";

const EDUCATOR_UNIT_VALUES = ["manada", "tropa", "pioneros", "rovers"] as const;

export type EducatorUnit = (typeof EDUCATOR_UNIT_VALUES)[number];
export type AppPowerRole = "user" | "mod" | "admin";

export type AdminAccess = {
  userId: string | null;
  email: string | null;
  role: AppPowerRole;
  isSuperAdmin: boolean;
  isMod: boolean;
  canOpenAdminPanel: boolean;
  canManageEducators: boolean;
  canManageRoles: boolean;
  canDeleteUsers: boolean;
};

export function normalizeRole(value: string | null | undefined): AppPowerRole {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "admin") return "admin";
  if (normalized === "mod" || normalized === "moderador" || normalized === "moderadora") {
    return "mod";
  }
  return "user";
}

function normalizeUnits(units: string[]): EducatorUnit[] {
  const mapped = units
    .map((unit) => String(unit || "").trim().toLowerCase())
    .map((unit) => {
      if (unit === "manada" || unit === "lobatos") return "manada" as const;
      if (unit === "tropa") return "tropa" as const;
      if (unit === "pioneros") return "pioneros" as const;
      if (unit === "rovers" || unit === "rover") return "rovers" as const;
      return null;
    })
    .filter((unit): unit is EducatorUnit => !!unit);

  return Array.from(new Set(mapped));
}

export function parseEducatorUnits(raw: string | null | undefined): EducatorUnit[] {
  if (!raw) return [];
  return normalizeUnits(
    String(raw)
      .split(/[;,|]/g)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function buildAccess(args: {
  userId: string | null;
  email: string | null;
  roleValue: string | null | undefined;
}): AdminAccess {
  const role = normalizeRole(args.roleValue);
  const isSuperAdmin = role === "admin";
  const isMod = role === "mod";

  return {
    userId: args.userId,
    email: args.email,
    role: isSuperAdmin ? "admin" : isMod ? "mod" : "user",
    isSuperAdmin,
    isMod,
    canOpenAdminPanel: isSuperAdmin || isMod,
    canManageEducators: isSuperAdmin || isMod,
    canManageRoles: isSuperAdmin || isMod,
    canDeleteUsers: isSuperAdmin,
  };
}

export async function getCurrentUserAdminAccess(): Promise<AdminAccess> {
  if (isLocalBackend()) {
    try {
      return await apiFetch<AdminAccess>("/v1/me/access");
    } catch {
      return buildAccess({ userId: null, email: null, roleValue: null });
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return buildAccess({ userId: null, email: null, roleValue: null });
  }

  if (!isLocalBackend()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("user_id", session.user.id)
      .maybeSingle();

    return buildAccess({
      userId: session.user.id,
      email: session.user.email || profile?.email || null,
      roleValue: profile?.role,
    });
  }

  return buildAccess({ userId: session.user.id, email: session.user.email || null, roleValue: null });
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const access = await getCurrentUserAdminAccess();
  return access.isSuperAdmin;
}

export async function isCurrentUserAdminOrMod(): Promise<boolean> {
  const access = await getCurrentUserAdminAccess();
  return access.canOpenAdminPanel;
}

export async function ensureAdminForMediaUpload(): Promise<void> {
  const access = await getCurrentUserAdminAccess();
  if (!access.canOpenAdminPanel) {
    throw new Error(ADMIN_UPLOAD_ERROR);
  }
}

export async function requestEducatorPermissions(args: {
  units: EducatorUnit[];
  note?: string;
}): Promise<{ sentCount: number }> {
  const normalizedUnits = normalizeUnits(args.units);
  if (normalizedUnits.length === 0) {
    throw new Error("Selecciona al menos una unidad para solicitar permisos.");
  }
  return apiFetch<{ sentCount: number }>("/v1/me/educator-permission-requests", {
    method: "POST",
    body: JSON.stringify({ units: normalizedUnits, note: args.note || "" }),
  });
}

export async function reviewEducatorPermissionRequest(args: {
  notificationId: string;
  requesterId: string;
  approve: boolean;
  units: EducatorUnit[];
  note?: string;
}): Promise<void> {
  const access = await getCurrentUserAdminAccess();
  if (!access.canManageEducators) {
    throw new Error("No tienes permisos para revisar solicitudes de educador/a.");
  }

  if (!access.userId) {
    throw new Error("No hay sesión activa.");
  }

  const units = normalizeUnits(args.units);
  if (args.approve && units.length === 0) {
    throw new Error("Debes seleccionar al menos una unidad para aprobar.");
  }

  await apiFetch(`/v1/admin/educator-permission-requests/${args.notificationId}/decision`, {
    method: "POST",
    body: JSON.stringify({
      requesterId: args.requesterId,
      approve: args.approve,
      units,
      note: String(args.note || "").trim() || null,
    }),
  });
}

export async function reviewUserRegistrationRequest(args: {
  notificationId: string;
  requesterId: string;
  approve: boolean;
  note?: string;
}): Promise<void> {
  const access = await getCurrentUserAdminAccess();
  if (!access.canOpenAdminPanel) {
    throw new Error("No tienes permisos para revisar registros.");
  }

  if (!access.userId) {
    throw new Error("No hay sesion activa.");
  }

  const pending = await apiFetch<Array<{ id: string; auth_user_id: string | null }>>(
    "/v1/admin/registration-requests?status=pending&limit=100",
  );
  const request = pending.find((item) => item.auth_user_id === args.requesterId);
  if (!request) throw new Error("No se encontró una solicitud pendiente para ese usuario.");
  await apiFetch(`/v1/admin/registration-requests/${request.id}/decision`, {
    method: "POST",
    body: JSON.stringify({
      action: args.approve ? "approve" : "reject",
      admin_notes: String(args.note || "").trim() || null,
    }),
  });
}

export async function updateUserRole(args: {
  userId: string;
  newRole: "user" | "mod" | "admin";
}): Promise<void> {
  const access = await getCurrentUserAdminAccess();
  if (!access.canManageRoles) {
    throw new Error("No tienes permisos para cambiar roles.");
  }

  if (!access.isSuperAdmin && args.newRole === "admin") {
    throw new Error("Los moderadores no pueden asignar rol admin.");
  }

  await apiFetch(`/v1/admin/users/${args.userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role: args.newRole }),
  });
}
