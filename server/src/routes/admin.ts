import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { authMiddleware } from "../auth";
import { isValidRama } from "../rama-access";
import { maybeSendNotificationEmail } from "../notification-email";

export const adminRouter = Router();

type DashboardUserRow = {
  user_id: string;
  email: string | null;
  nombre_completo: string | null;
  username: string | null;
  role: "admin" | "user";
  rol_adulto: string | null;
  rama_que_educa: string | null;
  is_public: boolean;
  created_at: string | null;
};

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

function isSecretValid(req: any): boolean {
  const header = (req.headers?.["x-admin-secret"] ||
    req.headers?.["X-Admin-Secret"]) as string | undefined;
  const secret = process.env.ADMIN_SECRET;
  return !!secret && header === secret;
}

// Middleware que permite acceso si hay SECRET válido, de lo contrario requiere auth
function adminGate(req: any, res: any, next: any) {
  if (isSecretValid(req)) return next();
  return authMiddleware(req, res, next);
}

const deleteSchema = z.object({ email: z.string().email() });
const grantEducatorSchema = z.object({
  enabled: z.boolean(),
  ramas: z.array(z.string()).optional(),
});

function normalizeEducatorRamaToken(raw: string): string | null {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (value === "manada" || value === "lobatos") return "manada";
  if (value === "tropa") return "tropa";
  if (value === "pioneros") return "pioneros";
  if (value === "rovers" || value === "rover") return "rovers";
  return null;
}

function canonicalToMiembroRama(canonicalRama: string): string {
  if (canonicalRama === "manada") return "lobatos";
  if (canonicalRama === "tropa") return "tropa";
  if (canonicalRama === "pioneros") return "pioneros";
  return "rover";
}

function validateAdminCaller(req: any): { ok: true } | { ok: false; status: number; error: string } {
  if (isSecretValid(req)) return { ok: true };

  const userId = (req as any)?.user?.id as string | undefined;
  if (!userId) {
    return { ok: false, status: 401, error: "No autorizado" };
  }

  const current = db
    .prepare("SELECT email FROM users WHERE id = ?")
    .get(userId) as { email?: string } | undefined;

  if (!current || !isAdminEmail(current.email)) {
    return { ok: false, status: 403, error: "No autorizado" };
  }

  return { ok: true };
}

adminRouter.get("/dashboard-data", adminGate, (req: any, res: any) => {
  const authCheck = validateAdminCaller(req);
  if (!authCheck.ok) {
    return res.status(authCheck.status).json({ error: authCheck.error });
  }

  const usersRaw = db
    .prepare(
      `
      SELECT
        u.id as user_id,
        u.email,
        u.username,
        u.created_at,
        p.nombre_completo,
        p.rol_adulto,
        p.rama_que_educa,
        COALESCE(p.is_public, 0) as is_public
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY datetime(u.created_at) DESC
      `,
    )
    .all() as Array<{
      user_id: string;
      email: string | null;
      nombre_completo: string | null;
      username: string | null;
      rol_adulto: string | null;
      rama_que_educa: string | null;
      is_public: number;
      created_at: string | null;
    }>;

  const users: DashboardUserRow[] = usersRaw.map((row) => ({
    user_id: row.user_id,
    email: row.email,
    nombre_completo: row.nombre_completo,
    username: row.username,
    role: isAdminEmail(row.email) ? "admin" : "user",
    rol_adulto: row.rol_adulto,
    rama_que_educa: row.rama_que_educa,
    is_public: row.is_public === 1,
    created_at: row.created_at,
  }));

  const groups = db
    .prepare("SELECT * FROM groups ORDER BY datetime(created_at) DESC LIMIT 200")
    .all();

  const events = db
    .prepare(
      `
      SELECT
        id,
        title as titulo,
        NULL as descripcion,
        fecha_inicio,
        NULL as fecha_fin,
        created_at
      FROM events
      ORDER BY datetime(fecha_inicio) DESC
      LIMIT 200
      `,
    )
    .all();

  const threads = db
    .prepare("SELECT * FROM threads ORDER BY datetime(created_at) DESC LIMIT 200")
    .all();

  const threadComments = db
    .prepare("SELECT * FROM thread_comments ORDER BY datetime(created_at) DESC LIMIT 200")
    .all();

  const messages = db
    .prepare("SELECT * FROM dm_messages ORDER BY datetime(created_at) DESC LIMIT 200")
    .all();

  const groupMessages = db
    .prepare("SELECT * FROM group_messages ORDER BY datetime(created_at) DESC LIMIT 200")
    .all();

  const follows = db
    .prepare("SELECT * FROM follows ORDER BY datetime(created_at) DESC LIMIT 500")
    .all();

  const notifications = db
    .prepare("SELECT * FROM notifications ORDER BY datetime(created_at) DESC LIMIT 500")
    .all();

  return res.json({
    users,
    groups,
    events,
    threads,
    threadComments,
    messages,
    groupMessages,
    pages: [],
    follows,
    notifications,
  });
});

adminRouter.post("/users/delete", adminGate, (req: any, res: any) => {
  const parse = deleteSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const emailToDelete = parse.data.email;

  // Si no se usa SECRET, verificar que el usuario autenticado sea admin por email
  if (!isSecretValid(req)) {
    const userId = (req as any)?.user?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const current = db
      .prepare("SELECT email FROM users WHERE id = ?")
      .get(userId) as { email?: string } | undefined;
    if (!current || !isAdminEmail(current.email))
      return res.status(403).json({ error: "No autorizado" });
  }

  const target = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(emailToDelete) as { id?: string } | undefined;
  if (!target?.id)
    return res.status(404).json({ error: "Usuario no encontrado" });

  const tx = db.transaction((email: string) => {
    db.prepare("DELETE FROM users WHERE email = ?").run(email);
  });
  tx(emailToDelete);
  return res.json({ ok: true, deletedEmail: emailToDelete });
});

adminRouter.put("/users/:userId/educator-permissions", adminGate, (req: any, res: any) => {
  const authCheck = validateAdminCaller(req);
  if (!authCheck.ok) {
    return res.status(authCheck.status).json({ error: authCheck.error });
  }

  const parse = grantEducatorSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  const { userId } = req.params;
  const target = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(userId) as { id?: string } | undefined;

  if (!target?.id) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { enabled, ramas = [] } = parse.data;

  if (!enabled) {
    db.prepare(
      `
      INSERT INTO profiles (user_id, rol_adulto, rama_que_educa, is_public)
      VALUES (?, NULL, NULL, 0)
      ON CONFLICT(user_id) DO UPDATE SET
        rol_adulto = NULL,
        rama_que_educa = NULL
      `,
    ).run(userId);

    return res.json({
      ok: true,
      user_id: userId,
      rol_adulto: null,
      rama_que_educa: null,
    });
  }

  const canonicalRamas = Array.from(
    new Set(
      ramas
        .map((rama) => normalizeEducatorRamaToken(rama))
        .filter((rama): rama is string => !!rama),
    ),
  );

  if (canonicalRamas.length === 0) {
    return res.status(400).json({
      error: "Debes indicar al menos una unidad válida para otorgar permisos de educador/a",
    });
  }

  const ramasMiembro = canonicalRamas.map((rama) => canonicalToMiembroRama(rama));
  const invalid = ramasMiembro.find((rama) => !isValidRama(rama));
  if (invalid) {
    return res.status(400).json({ error: `Unidad inválida: ${invalid}` });
  }

  db.prepare(
    `
    INSERT INTO profiles (user_id, rol_adulto, rama_que_educa, is_public)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(user_id) DO UPDATE SET
      rol_adulto = excluded.rol_adulto,
      rama_que_educa = excluded.rama_que_educa
    `,
  ).run(userId, "Educador/a", canonicalRamas.join(","));

  const updated = db
    .prepare("SELECT user_id, rol_adulto, rama_que_educa FROM profiles WHERE user_id = ?")
    .get(userId) as { user_id: string; rol_adulto: string | null; rama_que_educa: string | null };

  return res.json({ ok: true, ...updated });
});

const requestPermissionSchema = z.object({
  units: z.array(z.string()).min(1),
  note: z.string().optional(),
});

adminRouter.post("/request-educator-permissions", authMiddleware, (req: any, res: any) => {
  const userId = (req as any).user.id as string;
  const parse = requestPermissionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  const { units, note } = parse.data;

  const userProfile = db
    .prepare("SELECT rol_adulto, nombre_completo, username FROM profiles WHERE user_id = ?")
    .get(userId) as { rol_adulto: string | null; nombre_completo?: string | null; username?: string | null } | undefined;

  if (!userProfile?.rol_adulto?.includes("Educador")) {
    return res.status(403).json({
      error: "Solo usuarios con rol educador/a pueden solicitar permisos de unidad.",
    });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    return res.status(500).json({ error: "No hay administradores disponibles" });
  }

  const adminUsers = db
    .prepare("SELECT id FROM users WHERE LOWER(email) IN (" + adminEmails.map(() => "?").join(",") + ")")
    .all(...adminEmails) as Array<{ id: string }>;

  if (adminUsers.length === 0) {
    return res.status(500).json({ error: "No hay administradores registrados" });
  }

  const requesterName = userProfile.nombre_completo || userProfile.username || userId.slice(0, 8);
  const notificationData = {
    kind: "educator_permission_request",
    requester_id: userId,
    requester_name: requesterName,
    requested_units: units,
    note: note || null,
    requested_at: new Date().toISOString(),
  };

  let notificationCount = 0;
  for (const admin of adminUsers) {
    db.prepare(
      `
      INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      randomUUID(),
      admin.id,
      userId,
      "educator_permission_request",
      "admin_request",
      userId,
      JSON.stringify(notificationData),
      new Date().toISOString(),
    );

      void maybeSendNotificationEmail(
        admin.id,
        "Nueva solicitud de permisos",
        `${requesterName} solicito permisos para: ${units.join(", ")}.`,
      ).catch(() => {
        // Silencioso para no bloquear la solicitud por errores de correo.
      });
    notificationCount++;
  }

  res.json({
    ok: true,
    message: `Solicitud enviada a ${notificationCount} administrador(es)`,
    notificationsCreated: notificationCount,
  });
});

export default adminRouter;
