import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { authMiddleware } from "../auth";

export const notificationsRouter = Router();

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  data: string | null;
  read_at: string | null;
  created_at: string;
};

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const insertSchema = z.object({
  recipientId: z.string().uuid(),
  actorId: z.string().uuid().optional(),
  type: z.string().min(1).max(64),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(255).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
});

function safeParseData(raw: string | null) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

notificationsRouter.get("/", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parsed = listQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { limit, offset } = parsed.data;
  const rows = db
    .prepare(
      `
      SELECT n.id, n.recipient_id, n.actor_id, n.type, n.entity_type, n.entity_id, n.data, n.read_at, n.created_at,
             p.nombre_completo AS actor_nombre_completo,
             p.username AS actor_username,
             p.avatar_url AS actor_avatar_url
      FROM notifications n
      LEFT JOIN profiles p ON p.user_id = n.actor_id
      WHERE n.recipient_id = ?
      ORDER BY datetime(n.created_at) DESC
      LIMIT ? OFFSET ?
    `,
    )
    .all(me, limit, offset) as Array<
    NotificationRow & {
      actor_nombre_completo: string | null;
      actor_username: string | null;
      actor_avatar_url: string | null;
    }
  >;

  const out = rows.map((r) => {
    const data = safeParseData(r.data);
    const display =
      (data as Record<string, unknown>).display ||
      r.actor_nombre_completo ||
      r.actor_username ||
      null;
    const avatar_url =
      (data as Record<string, unknown>).avatar_url ||
      r.actor_avatar_url ||
      null;

    return {
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      read_at: r.read_at,
      data: {
        ...data,
        ...(display ? { display } : {}),
        ...(avatar_url ? { avatar_url } : {}),
      },
    };
  });

  return res.json(out);
});

notificationsRouter.post("/", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parsed = insertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const payload = parsed.data;
  if (payload.recipientId !== me) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const id = randomUUID();
  db.prepare(
    `
      INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    payload.recipientId,
    payload.actorId || null,
    payload.type,
    payload.entityType || null,
    payload.entityId || null,
    JSON.stringify(payload.data || {}),
    payload.createdAt || new Date().toISOString(),
  );

  return res.status(201).json({ ok: true, id });
});

notificationsRouter.post("/:id/read", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const id = req.params.id as string;
  db.prepare(
    `
      UPDATE notifications
      SET read_at = ?
      WHERE id = ? AND recipient_id = ?
    `,
  ).run(new Date().toISOString(), id, me);
  return res.json({ ok: true });
});

notificationsRouter.post("/mark-all-read", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  db.prepare(
    `
      UPDATE notifications
      SET read_at = ?
      WHERE recipient_id = ? AND read_at IS NULL
    `,
  ).run(new Date().toISOString(), me);
  return res.json({ ok: true });
});

notificationsRouter.delete("/:id", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const id = req.params.id as string;
  db.prepare("DELETE FROM notifications WHERE id = ? AND recipient_id = ?").run(
    id,
    me,
  );
  return res.json({ ok: true });
});
