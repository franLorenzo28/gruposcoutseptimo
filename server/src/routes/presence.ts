import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../auth";
import { db } from "../db";

export const presenceRouter = Router();

const heartbeatSchema = z.object({
  status: z.enum(["active", "away"]).optional(),
});

const OFFLINE_AFTER_MS = 2 * 60 * 1000;

function resolveStatus(
  rawStatus: string | null | undefined,
  lastSeenAt: string | null | undefined,
): "active" | "away" | "offline" {
  if (!lastSeenAt) return "offline";

  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed > OFFLINE_AFTER_MS) {
    return "offline";
  }

  return rawStatus === "away" ? "away" : "active";
}

presenceRouter.post("/heartbeat", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parsed = heartbeatSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const now = new Date().toISOString();
  const status = parsed.data.status || "active";

  db.prepare(
    `
    INSERT INTO user_presence (user_id, status, last_seen_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      status = excluded.status,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at
  `,
  ).run(me, status, now, now);

  return res.json({ ok: true, user_id: me, status, last_seen_at: now });
});

presenceRouter.get("/", authMiddleware, (req: any, res: any) => {
  const idsParam = String(req.query.ids || "").trim();
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  if (ids.length === 0) {
    return res.json([]);
  }

  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `
      SELECT user_id, status, last_seen_at
      FROM user_presence
      WHERE user_id IN (${placeholders})
    `,
    )
    .all(...ids) as Array<{
    user_id: string;
    status: string;
    last_seen_at: string | null;
  }>;

  const byUser = new Map(rows.map((r) => [r.user_id, r] as const));

  const result = ids.map((id) => {
    const row = byUser.get(id);
    return {
      user_id: id,
      status: resolveStatus(row?.status, row?.last_seen_at),
      last_seen_at: row?.last_seen_at || null,
    };
  });

  return res.json(result);
});
