import { supabase } from "@/integrations/supabase/client";
import { apiFetch, ensureLocalToken, isLocalBackend } from "@/lib/backend";

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

function normalizeRole(value: string | null | undefined): AppPowerRole {
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

function normalizeEducatorRole(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isEducatorRole(value: string | null | undefined): boolean {
  const normalized = normalizeEducatorRole(value);
  return (
    normalized === "educador/a" ||
    normalized === "educador" ||
    normalized === "educadora"
  );
}

function configuredAdminEmails(): Set<string> {
  return new Set(
    String(import.meta.env.VITE_GALLERY_ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return configuredAdminEmails().has(String(email).toLowerCase());
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
  const fromEmail = isSuperAdminEmail(args.email);
  const isSuperAdmin = role === "admin" || fromEmail;
  const isMod = role === "mod";

  return {
    userId: args.userId,
    email: args.email,
    role: isSuperAdmin ? "admin" : isMod ? "mod" : "user",
    isSuperAdmin,
    isMod,
    canOpenAdminPanel: isSuperAdmin || isMod,
    canManageEducators: isSuperAdmin || isMod,
    canManageRoles: isSuperAdmin,
    canDeleteUsers: isSuperAdmin,
  };
}

async function sendNotificationToUser(args: {
  recipientId: string;
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
}) {
  const { error: rpcError } = await supabase.rpc("create_notification", {
    p_recipient: args.recipientId,
    p_actor: args.actorId,
    p_type: args.type,
    p_entity_type: args.entityType,
    p_entity_id: args.entityId,
    p_data: args.data,
  });

  if (!rpcError) return;

  const { error: insertError } = await supabase.from("notifications").insert({
    recipient_id: args.recipientId,
    actor_id: args.actorId,
    type: args.type,
    entity_type: args.entityType,
    entity_id: args.entityId,
    data: args.data,
  });

  if (insertError) {
    throw insertError;
  }
}

export async function getCurrentUserAdminAccess(): Promise<AdminAccess> {
  if (isLocalBackend()) {
    try {
      await ensureLocalToken();
      const me = (await apiFetch("/profiles/me")) as {
        id?: string;
        email?: string | null;
        role?: string | null;
      };

      return buildAccess({
        userId: me?.id || null,
        email: me?.email || null,
        roleValue: me?.role,
      });
    } catch {
      return buildAccess({ userId: null, email: null, roleValue: null });
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildAccess({ userId: null, email: null, roleValue: null });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();

  return buildAccess({
    userId: user.id,
    email: user.email || profile?.email || null,
    roleValue: profile?.role,
  });
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

  // Para backend local, usar endpoint Express
  if (isLocalBackend()) {
    const token = await ensureLocalToken();
    const response = await fetch("/admin/request-educator-permissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        units: normalizedUnits,
        note: args.note || "",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al solicitar permisos");
    }

    const result = await response.json();
    return { sentCount: result.notificationsCreated || 0 };
  }

  // Para Supabase, usar RPC
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Necesitas iniciar sesión para solicitar permisos.");
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from("profiles")
    .select("nombre_completo, username, rol_adulto")
    .eq("user_id", user.id)
    .maybeSingle();

  if (myProfileError) throw myProfileError;

  if (!isEducatorRole(myProfile?.rol_adulto)) {
    throw new Error("Solo perfiles con rol educador/a pueden pedir permisos de unidad.");
  }

  const { data: reviewerRows, error: reviewersError } = await supabase
    .from("profiles")
    .select("user_id, role, email")
    .neq("user_id", user.id);

  if (reviewersError) throw reviewersError;

  const reviewers = (reviewerRows || []).filter((row) => {
    const role = normalizeRole(row.role);
    return role === "admin" || role === "mod" || isSuperAdminEmail(row.email);
  });

  if (reviewers.length === 0) {
    throw new Error("No hay administradores o moderadores disponibles para revisar tu solicitud.");
  }

  const requesterName =
    myProfile?.nombre_completo?.trim() ||
    myProfile?.username?.trim() ||
    user.email ||
    user.id.slice(0, 8);
  const note = String(args.note || "").trim();
  const now = new Date().toISOString();
  const requestId = `${user.id}:${now}`;

  const payload = {
    kind: "educator_permission_request",
    request_id: requestId,
    requester_id: user.id,
    requester_name: requesterName,
    requester_username: myProfile?.username || null,
    requested_units: normalizedUnits,
    note: note || null,
    status: "pending",
    requested_at: now,
  };

  const results = await Promise.allSettled(
    reviewers.map((reviewer) =>
      sendNotificationToUser({
        recipientId: reviewer.user_id,
        actorId: user.id,
        type: "message",
        entityType: "educator_permission_request",
        entityId: user.id,
        data: payload,
      }),
    ),
  );

  const sentCount = results.filter((result) => result.status === "fulfilled").length;
  if (sentCount === 0) {
    throw new Error("No se pudo enviar la solicitud. Revisa permisos de notificaciones.");
  }

  return { sentCount };
}

export async function reviewEducatorPermissionRequest(args: {
  notificationId: string;
  requesterId: string;
  approve: boolean;
  units: EducatorUnit[];
  note?: string;
}): Promise<void> {
  if (isLocalBackend()) {
    throw new Error("Esta acción está disponible solo en Supabase.");
  }

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

  const note = String(args.note || "").trim();
  const { error } = await supabase.rpc("review_educator_permission_request", {
    p_notification_id: args.notificationId,
    p_requester_id: args.requesterId,
    p_approve: args.approve,
    p_units: units,
    p_note: note || null,
  });

  if (error) throw error;
}
