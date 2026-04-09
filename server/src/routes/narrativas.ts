import { Router } from "express";
import { db } from "../db";
import { authMiddleware } from "../auth";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const narrativasRouter = Router();

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Obtener narrativas ordenadas por año (descendente)
 * GET /api/narrativas?year_section=1964
 */
narrativasRouter.get("/", (req: any, res: any) => {
  try {
    const yearSection = req.query.year_section as string | undefined;
    let query = `
      SELECT 
        n.id, n.titulo, n.year_section, n.bloques, n.autor_id, 
        n.fecha_publicacion, n.created_at, n.updated_at,
        p.nombre_completo, p.avatar_url, u.username
      FROM narrativas n
      LEFT JOIN profiles p ON n.autor_id = p.user_id
      LEFT JOIN users u ON n.autor_id = u.id
    `;

    const params: any[] = [];
    if (yearSection) {
      query += ` WHERE n.year_section LIKE ?`;
      params.push(`%${yearSection}%`);
    }

    query += ` ORDER BY n.year_section DESC, n.created_at DESC`;

    const rows = db.prepare(query).all(...params);
    
    // Parsear bloques JSON
    const narrativas = rows.map((row: any) => ({
      ...row,
      bloques: JSON.parse(row.bloques || "[]"),
      autor: {
        id: row.autor_id,
        nombre_completo: row.nombre_completo,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    }));

    res.json(narrativas);
  } catch (err) {
    console.error("Error al obtener narrativas:", err);
    res.status(500).json({ error: "Error al obtener narrativas" });
  }
});

/**
 * Obtener una narrativa por ID
 * GET /api/narrativas/:id
 */
narrativasRouter.get("/:id", (req: any, res: any) => {
  try {
    const { id } = req.params;
    const row = db
      .prepare(
        `
      SELECT 
        n.id, n.titulo, n.year_section, n.bloques, n.autor_id, 
        n.fecha_publicacion, n.created_at, n.updated_at,
        p.nombre_completo, p.avatar_url, u.username
      FROM narrativas n
      LEFT JOIN profiles p ON n.autor_id = p.user_id
      LEFT JOIN users u ON n.autor_id = u.id
      WHERE n.id = ?
    `,
      )
      .get(id);

    if (!row) {
      return res.status(404).json({ error: "Narrativa no encontrada" });
    }

    const narrativa = {
      ...row,
      bloques: JSON.parse(row.bloques || "[]"),
      autor: {
        id: row.autor_id,
        nombre_completo: row.nombre_completo,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    };

    res.json(narrativa);
  } catch (err) {
    console.error("Error al obtener narrativa:", err);
    res.status(500).json({ error: "Error al obtener narrativa" });
  }
});

/**
 * Crear narrativa (solo admins)
 * POST /api/narrativas
 */
const createNarrativaSchema = z.object({
  titulo: z.string().min(5).max(200),
  year_section: z.string().min(4).max(20),
  bloques: z
    .array(
      z.object({
        id: z.string().optional(),
        tipo: z.enum(["texto", "imagen"]),
        contenido: z.string().min(1),
        autor: z.string().max(200).optional().nullable(),
        fecha: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

narrativasRouter.post("/", authMiddleware, (req: any, res: any) => {
  try {
    const userId = req.user.id;

    // Verificar permisos de admin
    const user = db
      .prepare(`SELECT email FROM users WHERE id = ?`)
      .get(userId) as { email: string } | undefined;

    if (!user || !isAdmin(user.email)) {
      return res
        .status(403)
        .json({ error: "Solo administradores pueden crear narrativas" });
    }

    const parsed = createNarrativaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { titulo, year_section, bloques } = parsed.data;
    const id = randomUUID();

    db.prepare(
      `
      INSERT INTO narrativas 
      (id, titulo, year_section, bloques, autor_id, fecha_publicacion, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `,
    ).run(id, titulo, year_section, JSON.stringify(bloques), userId);

    const row = db
      .prepare(
        `
      SELECT 
        n.id, n.titulo, n.year_section, n.bloques, n.autor_id, 
        n.fecha_publicacion, n.created_at, n.updated_at,
        p.nombre_completo, p.avatar_url, u.username
      FROM narrativas n
      LEFT JOIN profiles p ON n.autor_id = p.user_id
      LEFT JOIN users u ON n.autor_id = u.id
      WHERE n.id = ?
    `,
      )
      .get(id);

    const narrativa = {
      ...row,
      bloques: JSON.parse(row.bloques),
      autor: {
        id: row.autor_id,
        nombre_completo: row.nombre_completo,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    };

    res.status(201).json(narrativa);
  } catch (err) {
    console.error("Error al crear narrativa:", err);
    res.status(500).json({ error: "Error al crear narrativa" });
  }
});

/**
 * Actualizar narrativa (solo author/admin)
 * PUT /api/narrativas/:id
 */
const updateNarrativaSchema = z.object({
  titulo: z.string().min(5).max(200).optional(),
  year_section: z.string().min(4).max(20).optional(),
  bloques: z
    .array(
      z.object({
        id: z.string().optional(),
        tipo: z.enum(["texto", "imagen"]),
        contenido: z.string().min(1),
        autor: z.string().max(200).optional().nullable(),
        fecha: z.string().optional().nullable(),
      }),
    )
    .min(1)
    .optional(),
});

narrativasRouter.put("/:id", authMiddleware, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verificar que la narrativa existe y obtener autor
    const narrativa = db
      .prepare(`SELECT autor_id FROM narrativas WHERE id = ?`)
      .get(id) as { autor_id: string } | undefined;

    if (!narrativa) {
      return res.status(404).json({ error: "Narrativa no encontrada" });
    }

    // Verificar permisos (author o admin)
    const user = db
      .prepare(`SELECT email FROM users WHERE id = ?`)
      .get(userId) as { email: string } | undefined;

    const isAuthor = narrativa.autor_id === userId;
    const isAdminUser = user && isAdmin(user.email);

    if (!isAuthor && !isAdminUser) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar esta narrativa" });
    }

    const parsed = updateNarrativaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { titulo, year_section, bloques } = parsed.data;

    // Construir UPDATE dinámico
    const updates: string[] = [];
    const values: any[] = [];

    if (titulo !== undefined) {
      updates.push("titulo = ?");
      values.push(titulo);
    }
    if (year_section !== undefined) {
      updates.push("year_section = ?");
      values.push(year_section);
    }
    if (bloques !== undefined) {
      updates.push("bloques = ?");
      values.push(JSON.stringify(bloques));
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    if (updates.length > 1) {
      const query = `UPDATE narrativas SET ${updates.join(", ")} WHERE id = ?`;
      db.prepare(query).run(...values);
    }

    // Retornar narrativa actualizada
    const updated = db
      .prepare(
        `
      SELECT 
        n.id, n.titulo, n.year_section, n.bloques, n.autor_id, 
        n.fecha_publicacion, n.created_at, n.updated_at,
        p.nombre_completo, p.avatar_url, u.username
      FROM narrativas n
      LEFT JOIN profiles p ON n.autor_id = p.user_id
      LEFT JOIN users u ON n.autor_id = u.id
      WHERE n.id = ?
    `,
      )
      .get(id);

    const result = {
      ...updated,
      bloques: JSON.parse(updated.bloques),
      autor: {
        id: updated.autor_id,
        nombre_completo: updated.nombre_completo,
        username: updated.username,
        avatar_url: updated.avatar_url,
      },
    };

    res.json(result);
  } catch (err) {
    console.error("Error al actualizar narrativa:", err);
    res.status(500).json({ error: "Error al actualizar narrativa" });
  }
});

/**
 * Eliminar narrativa (solo author/admin)
 * DELETE /api/narrativas/:id
 */
narrativasRouter.delete("/:id", authMiddleware, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verificar que la narrativa existe y obtener autor
    const narrativa = db
      .prepare(`SELECT autor_id FROM narrativas WHERE id = ?`)
      .get(id) as { autor_id: string } | undefined;

    if (!narrativa) {
      return res.status(404).json({ error: "Narrativa no encontrada" });
    }

    // Verificar permisos
    const user = db
      .prepare(`SELECT email FROM users WHERE id = ?`)
      .get(userId) as { email: string } | undefined;

    const isAuthor = narrativa.autor_id === userId;
    const isAdminUser = user && isAdmin(user.email);

    if (!isAuthor && !isAdminUser) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta narrativa" });
    }

    db.prepare(`DELETE FROM narrativas WHERE id = ?`).run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al eliminar narrativa:", err);
    res.status(500).json({ error: "Error al eliminar narrativa" });
  }
});
