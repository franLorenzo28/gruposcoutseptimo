import express, { Router } from "express";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

// Obtener novedades activas (público)
router.get("/", (req, res) => {
  try {
    const novedades = db
      .prepare(
        `
        SELECT id, titulo, descripcion, href, etiqueta, tipo, created_at 
        FROM novedades 
        WHERE activa = 1 
        ORDER BY created_at DESC 
        LIMIT 10
      `
      )
      .all();

    res.json({
      success: true,
      novedades: novedades.map((n: any) => ({
        ...n,
        fecha: new Date(n.created_at).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      })),
    });
  } catch (error) {
    console.error("[novedades] Error GET:", error);
    res.status(500).json({ error: "Error al obtener novedades" });
  }
});

// Crear novedad (solo admin)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Verificar que sea admin
    const user = await db
      .prepare("SELECT * FROM profiles WHERE user_id = ?")
      .get(req.user?.id);

    if (!user || user.rol_adulto !== "Director" || user.rol_adulto !== "Responsable general") {
      return res.status(403).json({ error: "No tienes permiso para crear novedades" });
    }

    const schema = z.object({
      titulo: z.string().min(3).max(100),
      descripcion: z.string().min(10).max(500),
      href: z.string(),
      etiqueta: z.string().max(20),
      tipo: z.enum(["manual", "auto"]).optional(),
      referencia_id: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const { titulo, descripcion, href, etiqueta, tipo = "manual", referencia_id } = parsed.data;
    const id = crypto.randomUUID();

    db.prepare(
      `
      INSERT INTO novedades (id, titulo, descripcion, href, etiqueta, tipo, referencia_id, creada_por, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `
    ).run(id, titulo, descripcion, href, etiqueta, tipo, referencia_id || null, req.user?.id);

    res.json({
      success: true,
      novedad: { id, titulo, descripcion, href, etiqueta, tipo },
    });
  } catch (error) {
    console.error("[novedades] Error POST:", error);
    res.status(500).json({ error: "Error al crear novedad" });
  }
});

// Actualizar novedad (solo creator o admin)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const novedad = db.prepare("SELECT * FROM novedades WHERE id = ?").get(id);

    if (!novedad) {
      return res.status(404).json({ error: "Novedad no encontrada" });
    }

    // Solo el creador o admin pueden editar
    if (novedad.creada_por !== req.user?.id) {
      return res.status(403).json({ error: "No tienes permiso para editar esta novedad" });
    }

    const schema = z.object({
      titulo: z.string().min(3).max(100).optional(),
      descripcion: z.string().min(10).max(500).optional(),
      href: z.string().optional(),
      etiqueta: z.string().max(20).optional(),
      activa: z.number().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const updates = Object.entries(parsed.data)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => `${k} = ?`)
      .join(", ");

    const values = Object.entries(parsed.data)
      .filter(([, v]) => v !== undefined)
      .map(([, v]) => v);

    if (updates) {
      db.prepare(`UPDATE novedades SET ${updates}, updated_at = datetime('now') WHERE id = ?`).run(
        ...values,
        id
      );
    }

    res.json({ success: true, message: "Novedad actualizada" });
  } catch (error) {
    console.error("[novedades] Error PUT:", error);
    res.status(500).json({ error: "Error al actualizar novedad" });
  }
});

// Desactivar novedad
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const novedad = db.prepare("SELECT * FROM novedades WHERE id = ?").get(id);

    if (!novedad) {
      return res.status(404).json({ error: "Novedad no encontrada" });
    }

    if (novedad.creada_por !== req.user?.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta novedad" });
    }

    db.prepare("UPDATE novedades SET activa = 0, updated_at = datetime('now') WHERE id = ?").run(
      id
    );

    res.json({ success: true, message: "Novedad desactivada" });
  } catch (error) {
    console.error("[novedades] Error DELETE:", error);
    res.status(500).json({ error: "Error al desactivar novedad" });
  }
});

export default router;
