import { Router } from "express";
import { db } from "../db";
import { authMiddleware } from "../auth";
import { requireLocalAdmin } from "../middleware/require-admin";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const eventsRouter = Router();

// Listar todos los eventos ordenados por fecha_inicio asc
eventsRouter.get("/", authMiddleware, (_req: any, res: any) => {
  const rows = db
    .prepare(`SELECT * FROM events ORDER BY datetime(fecha_inicio) ASC`)
    .all();
  res.json(rows);
});

const upsertSchema = z.object({
  title: z.string().min(3).max(200),
  fecha_inicio: z.string(), // ISO date string o similar
  location: z.string().optional(),
  participants: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  color: z.string().optional(),
});

// Crear evento
eventsRouter.post("/", requireLocalAdmin, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parse = upsertSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const id = randomUUID();
  const { title, fecha_inicio, location, participants, type, status, color } =
    parse.data;
  db.prepare(
    `INSERT INTO events (id, title, fecha_inicio, location, participants, type, status, color, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    title.trim(),
    fecha_inicio,
    location ?? null,
    participants ?? null,
    type ?? null,
    status ?? null,
    color ?? null,
    me,
  );
  const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
  res.status(201).json(row);
});

// Actualizar evento
eventsRouter.put("/:id", requireLocalAdmin, (req: any, res: any) => {
  const id = String(req.params.id);
  const parse = upsertSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const { title, fecha_inicio, location, participants, type, status, color } =
    parse.data;
  db.prepare(
    `UPDATE events SET title = ?, fecha_inicio = ?, location = ?, participants = ?, type = ?, status = ?, color = ? WHERE id = ?`,
  ).run(
    title.trim(),
    fecha_inicio,
    location ?? null,
    participants ?? null,
    type ?? null,
    status ?? null,
    color ?? null,
    id,
  );
  const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
  res.json(row);
});

// Eliminar evento
eventsRouter.delete("/:id", requireLocalAdmin, (req: any, res: any) => {
  const id = String(req.params.id);
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
  res.json({ ok: true });
});
