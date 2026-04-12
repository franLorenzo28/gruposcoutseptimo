import { Router } from "express";
import { db } from "../db";
import { z } from "zod";
import { authMiddleware } from "../auth";
import {
  canModerateRama,
  isValidRama,
  listRamaContacts,
} from "../rama-access";

export const profilesRouter = Router();

// Helper para calcular edad
function calculateAge(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  try {
    const [y, m, d] = String(fechaNacimiento).split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return null;
    const birth = new Date(y, m - 1, d);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const mm = now.getMonth() - birth.getMonth();
    if (mm < 0 || (mm === 0 && now.getDate() < birth.getDate())) years--;
    return years;
  } catch {
    return null;
  }
}

function normalizeRole(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isEducatorRoleValue(normalizedRole: string): boolean {
  return (
    normalizedRole === "educador/a" ||
    normalizedRole === "educador" ||
    normalizedRole === "educadora"
  );
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email).toLowerCase());
}

profilesRouter.get("/me", authMiddleware, (req: any, res: any) => {
  const userId = (req as any).user.id as string;
  const user = db
    .prepare("SELECT id, email, username, email_verified_at, created_at FROM users WHERE id = ?")
    .get(userId) as any;
  if (!user) {
    return res
      .status(401)
      .json({ error: "Usuario inválido. Vuelve a iniciar sesión." });
  }
  let profile = db
    .prepare("SELECT * FROM profiles WHERE user_id = ?")
    .get(userId) as any;
  // Si no existe perfil, crearlo con valores por defecto (sin borrar nada)
  if (!profile) {
    db.prepare(
      `INSERT INTO profiles (user_id, nombre_completo, is_public) VALUES (?, ?, 0)`,
    ).run(userId, user?.username || null);
    profile = db
      .prepare("SELECT * FROM profiles WHERE user_id = ?")
      .get(userId) as any;
  }
  const result = { 
    ...profile, 
    ...user,
    email_verified: !!user.email_verified_at 
  };
  if (result.fecha_nacimiento) {
    result.edad = calculateAge(result.fecha_nacimiento);
  }
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.json(result);
});

// Aceptar avatar_url como URL absoluta o ruta relativa de uploads
const avatarUrlSchema = z.string().url().or(z.string().startsWith("/uploads/"));

const updateSchema = z.object({
  nombre_completo: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  avatar_url: avatarUrlSchema.nullable().optional(),
  fecha_nacimiento: z.string().nullable().optional(),
  rol_adulto: z.string().nullable().optional(),
  rama_que_educa: z.string().nullable().optional(),
  seisena: z.string().nullable().optional(),
  patrulla: z.string().nullable().optional(),
  equipo_pioneros: z.string().nullable().optional(),
  comunidad_rovers: z.string().nullable().optional(),
  // username se guarda en tabla users y marca timestamp en profiles.username_updated_at
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/)
    .optional(),
});

profilesRouter.put("/me", authMiddleware, (req: any, res: any) => {
  const userId = (req as any).user.id as string;
  const existsUser = db.prepare("SELECT 1 FROM users WHERE id = ?").get(userId);
  if (!existsUser) {
    return res
      .status(401)
      .json({ error: "Usuario inválido. Vuelve a iniciar sesión." });
  }
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const {
    nombre_completo,
    telefono,
    is_public,
    avatar_url,
    fecha_nacimiento,
    rol_adulto,
    rama_que_educa,
    seisena,
    patrulla,
    equipo_pioneros,
    comunidad_rovers,
    username,
  } = parse.data;

  const currentProfile = db
    .prepare("SELECT rol_adulto FROM profiles WHERE user_id = ?")
    .get(userId) as { rol_adulto?: string | null } | undefined;

  const currentUserRow = db
    .prepare("SELECT email FROM users WHERE id = ?")
    .get(userId) as { email?: string | null } | undefined;
  const isGlobalAdmin = isAdminEmail(currentUserRow?.email || null);

  const currentRole = normalizeRole(currentProfile?.rol_adulto);
  const nextRole = rol_adulto !== undefined ? normalizeRole(rol_adulto) : currentRole;
  const currentIsEducator = isEducatorRoleValue(currentRole);
  const nextIsEducator = isEducatorRoleValue(nextRole);

  if (!isGlobalAdmin && rol_adulto !== undefined && nextIsEducator && !currentIsEducator) {
    return res.status(403).json({
      error:
        "No puedes autoasignarte como educador/a. Solicita validación a administración.",
    });
  }

  if (
    !isGlobalAdmin &&
    rama_que_educa !== undefined &&
    !nextIsEducator &&
    !currentIsEducator
  ) {
    return res.status(403).json({
      error:
        "Solo perfiles validados como educador/a pueden definir su unidad asignada.",
    });
  }

  const existing = db
    .prepare("SELECT user_id FROM profiles WHERE user_id = ?")
    .get(userId);
  if (!existing) {
    db.prepare(
      `INSERT INTO profiles (user_id, nombre_completo, telefono, is_public, avatar_url, fecha_nacimiento, rol_adulto, rama_que_educa, seisena, patrulla, equipo_pioneros, comunidad_rovers) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      nombre_completo ?? null,
      telefono ?? null,
      is_public ? 1 : 0,
      avatar_url ?? null,
      fecha_nacimiento ?? null,
      rol_adulto ?? null,
      rama_que_educa ?? null,
      seisena ?? null,
      patrulla ?? null,
      equipo_pioneros ?? null,
      comunidad_rovers ?? null,
    );
  } else {
    // Si se envía username, validar cooldown (7 días) y unicidad
    if (username !== undefined) {
      const nowIso = new Date().toISOString();
      const current = db
        .prepare(
          "SELECT u.username, p.username_updated_at FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?",
        )
        .get(userId) as any;
      const last = current?.username_updated_at
        ? new Date(current.username_updated_at)
        : null;
      const canChange = !last || Date.now() - last.getTime() >= 7 * 24 * 60 * 60 * 1000;
      if (!canChange && username !== current?.username) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario solo puede cambiarse cada 7 días" });
      }
      // Unicidad
      const taken = db
        .prepare("SELECT 1 FROM users WHERE username = ? AND id <> ?")
        .get(username, userId);
      if (taken) {
        return res.status(409).json({ error: "Nombre de usuario no disponible" });
      }
      // Actualizar username y timestamp
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(username, userId);
      db.prepare("UPDATE profiles SET username_updated_at = ? WHERE user_id = ?").run(
        nowIso,
        userId,
      );
    }

    // Construir UPDATE dinámico para distinguir "campo ausente" vs "campo presente con null"
    const sets: string[] = [];
    const values: any[] = [];

    if (nombre_completo !== undefined) {
      sets.push("nombre_completo = ?");
      values.push(nombre_completo ?? null);
    }
    if (telefono !== undefined) {
      sets.push("telefono = ?");
      values.push(telefono ?? null);
    }
    if (is_public !== undefined) {
      sets.push("is_public = ?");
      values.push(is_public ? 1 : 0);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "avatar_url")) {
      sets.push("avatar_url = ?");
      values.push(avatar_url ?? null);
    }
    if (fecha_nacimiento !== undefined) {
      sets.push("fecha_nacimiento = ?");
      values.push(fecha_nacimiento ?? null);
    }
    if (rol_adulto !== undefined) {
      sets.push("rol_adulto = ?");
      values.push(rol_adulto ?? null);
    }
    if (rama_que_educa !== undefined) {
      sets.push("rama_que_educa = ?");
      values.push(rama_que_educa ?? null);
    }
    if (seisena !== undefined) {
      sets.push("seisena = ?");
      values.push(seisena ?? null);
    }
    if (patrulla !== undefined) {
      sets.push("patrulla = ?");
      values.push(patrulla ?? null);
    }
    if (equipo_pioneros !== undefined) {
      sets.push("equipo_pioneros = ?");
      values.push(equipo_pioneros ?? null);
    }
    if (comunidad_rovers !== undefined) {
      sets.push("comunidad_rovers = ?");
      values.push(comunidad_rovers ?? null);
    }

    if (sets.length > 0) {
      const sql = `UPDATE profiles SET ${sets.join(", ")} WHERE user_id = ?`;
      db.prepare(sql).run(...values, userId);
    }
  }
  const profile = db
    .prepare("SELECT * FROM profiles WHERE user_id = ?")
    .get(userId) as any;
  const user = db
    .prepare("SELECT id, email, username, created_at FROM users WHERE id = ?")
    .get(userId) as any;
  const result = { ...profile, ...user };
  // Calcular edad si hay fecha de nacimiento
  if (result.fecha_nacimiento) {
    result.edad = calculateAge(result.fecha_nacimiento);
  }
  res.json(result);
});

profilesRouter.get("/rama-contacts/:rama", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const ramaRaw = req.params.rama as string;

  if (!isValidRama(ramaRaw)) {
    return res.status(400).json({ error: "Unidad inválida" });
  }

  if (!canModerateRama(me, ramaRaw)) {
    return res.status(403).json({
      error: "Solo educadores de esta unidad pueden ver este directorio interno",
    });
  }

  const contacts = listRamaContacts(ramaRaw).filter((contact) => contact.user_id !== me);
  res.json(contacts);
});

// Obtener un perfil por ID (si es público o es el propio)
profilesRouter.get("/:id", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const id = req.params.id as string;
  const profile = db
    .prepare(
      "SELECT p.*, u.username FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?",
    )
    .get(id) as any;
  if (!profile) return res.status(404).json({ error: "Perfil no encontrado" });
  if (id !== me && !profile.is_public)
    return res.status(403).json({ error: "Perfil privado" });
  res.json({
    user_id: profile.user_id,
    nombre_completo: profile.nombre_completo,
    avatar_url: profile.avatar_url,
    username: profile.username,
  });
});

// Obtener múltiples perfiles por IDs (batch)
profilesRouter.post("/batch", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []) as string[];
  if (!Array.isArray(ids) || ids.length === 0) return res.json([]);
  // Usamos un IN dinámico
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `
    SELECT p.user_id, p.nombre_completo, p.avatar_url, p.is_public, u.username
    FROM profiles p JOIN users u ON u.id = p.user_id
    WHERE p.user_id IN (${placeholders})
  `,
    )
    .all(...ids) as any[];
  // Filtramos los privados salvo que sea yo
  const out = rows
    .filter((r) => r.is_public || r.user_id === me)
    .map((r) => ({
      user_id: r.user_id,
      nombre_completo: r.nombre_completo,
      avatar_url: r.avatar_url,
      username: r.username,
    }));
  res.json(out);
});

// Directorio de perfiles (con búsqueda/paginación simples)
profilesRouter.get("/directory", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();
  const limit = Math.min(
    parseInt(String(req.query.limit || "100")) || 100,
    200,
  );
  const offset = parseInt(String(req.query.offset || "0")) || 0;

  // Traer perfiles + username y calcular edad si hay fecha_nacimiento
  let rows = db
    .prepare(
      `
    SELECT p.user_id, p.nombre_completo, p.avatar_url, p.fecha_nacimiento, p.is_public, u.username
    FROM profiles p JOIN users u ON u.id = p.user_id
    ORDER BY p.nombre_completo COLLATE NOCASE ASC
  `,
    )
    .all() as any[];

  if (q) {
    rows = rows.filter(
      (r) =>
        String(r.nombre_completo || "")
          .toLowerCase()
          .includes(q) ||
        String(r.username || "")
          .toLowerCase()
          .includes(q),
    );
  }

  // paginado
  rows = rows.slice(offset, offset + limit);

  const out = rows.map((r) => {
    let edad: number | null = null;
    if (r.fecha_nacimiento) {
      try {
        const birth = new Date(r.fecha_nacimiento);
        if (!isNaN(birth.getTime())) {
          const now = new Date();
          let years = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
          edad = years;
        }
      } catch (e) {
        // ignore invalid date
      }
    }
    return {
      user_id: r.user_id,
      nombre_completo: r.nombre_completo,
      avatar_url: r.avatar_url,
      edad,
      is_public: !!r.is_public,
      username: r.username,
    };
  });

  res.json(out);
});
