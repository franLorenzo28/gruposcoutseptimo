import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { authMiddleware } from "../auth";

export const followsRouter = Router();

// Helper to fetch my outgoing relation with other (me -> other)
followsRouter.get(
  "/relation/:otherId",
  authMiddleware,
  (req: any, res: any) => {
    const me = (req as any).user.id as string;
    const other = req.params.otherId;

    const row = db
      .prepare(
        `
    SELECT follower_id, following_id as followed_id, status, created_at
    FROM follows
    WHERE follower_id = ? AND following_id = ?
  `,
      )
      .get(me, other);

    if (!row) return res.json(null);
    return res.json(row);
  },
);

// Follow a user (creates pending by default if profile is private, but here accept directly)
const followSchema = z.object({ targetId: z.string().uuid() });
followsRouter.post("/follow", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parse = followSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const { targetId } = parse.data;
  if (me === targetId)
    return res.status(400).json({ error: "No puedes seguirte a ti mismo" });

  // If target profile is public, accept; otherwise pending
  const targetProfile = db
    .prepare("SELECT is_public FROM profiles WHERE user_id = ?")
    .get(targetId) as { is_public?: number } | undefined;
  const status =
    targetProfile && targetProfile.is_public ? "accepted" : "pending";
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO follows (follower_id, following_id, status) VALUES (?, ?, ?)",
  );
  const result = stmt.run(me, targetId, status);

  if (result.changes > 0) {
    const actorProfile = db
      .prepare(
        "SELECT nombre_completo, username, avatar_url FROM profiles WHERE user_id = ?",
      )
      .get(me) as
      | { nombre_completo?: string | null; username?: string | null; avatar_url?: string | null }
      | undefined;

    const display =
      actorProfile?.nombre_completo || actorProfile?.username || me.slice(0, 8);

    const notificationType = status === "pending" ? "follow_request" : "new_follower";
    db.prepare(
      `
      INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      randomUUID(),
      targetId,
      me,
      notificationType,
      "follow",
      `${me}:${targetId}`,
      JSON.stringify({ follower_id: me, display, avatar_url: actorProfile?.avatar_url || null }),
      new Date().toISOString(),
    );
  }

  res.json({ ok: true });
});

// Unfollow or cancel pending
followsRouter.delete("/:targetId", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const targetId = req.params.targetId;
  db.prepare(
    "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
  ).run(me, targetId);
  res.json({ ok: true });
});

// Accept a follower (when I am the followed)
followsRouter.post(
  "/:followerId/accept",
  authMiddleware,
  (req: any, res: any) => {
    const me = (req as any).user.id as string;
    const followerId = req.params.followerId;
    const result = db
      .prepare(
        "UPDATE follows SET status = ? WHERE following_id = ? AND follower_id = ? AND status = ?",
      )
      .run("accepted", me, followerId, "pending");

    if (result.changes > 0) {
      const actorProfile = db
        .prepare(
          "SELECT nombre_completo, username, avatar_url FROM profiles WHERE user_id = ?",
        )
        .get(me) as
        | { nombre_completo?: string | null; username?: string | null; avatar_url?: string | null }
        | undefined;

      const display =
        actorProfile?.nombre_completo || actorProfile?.username || me.slice(0, 8);

      db.prepare(
        `
      INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      ).run(
        randomUUID(),
        followerId,
        me,
        "follow_accepted",
        "follow",
        `${followerId}:${me}`,
        JSON.stringify({ followed_id: me, display, avatar_url: actorProfile?.avatar_url || null }),
        new Date().toISOString(),
      );
    }

    res.json({ ok: true });
  },
);

// Reject a follower request (delete pending)
followsRouter.delete(
  "/:followerId/reject",
  authMiddleware,
  (req: any, res: any) => {
    const me = (req as any).user.id as string;
    const followerId = req.params.followerId;
    db.prepare(
      "DELETE FROM follows WHERE following_id = ? AND follower_id = ?",
    ).run(me, followerId);
    res.json({ ok: true });
  },
);

// List followers of a user (accepted)
followsRouter.get("/followers", authMiddleware, (req: any, res: any) => {
  const userId =
    (req.query.userId as string) || ((req as any).user.id as string);
  const rows = db
    .prepare(
      `
    SELECT follower_id, created_at FROM follows
    WHERE following_id = ? AND status = 'accepted'
    ORDER BY datetime(created_at) DESC
  `,
    )
    .all(userId);
  res.json(rows);
});

// List following of a user (accepted)
followsRouter.get("/following", authMiddleware, (req: any, res: any) => {
  const userId =
    (req.query.userId as string) || ((req as any).user.id as string);
  const rows = db
    .prepare(
      `
    SELECT following_id, created_at FROM follows
    WHERE follower_id = ? AND status = 'accepted'
    ORDER BY datetime(created_at) DESC
  `,
    )
    .all(userId);
  res.json(rows);
});

// Pending follow requests to me
followsRouter.get("/pending", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const rows = db
    .prepare(
      `
    SELECT follower_id, created_at FROM follows
    WHERE following_id = ? AND status = 'pending'
    ORDER BY datetime(created_at) DESC
  `,
    )
    .all(me);
  res.json(rows);
});
