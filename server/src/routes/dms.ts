import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { authMiddleware } from "../auth";
import { randomUUID } from "node:crypto";
import { canStartConversation } from "../rama-access";

export const dmsRouter = Router();

// Create or get conversation with other user
const convoSchema = z.object({ otherId: z.string().uuid() });
dmsRouter.post("/conversations", authMiddleware, (req: any, res: any) => {
  const me = (req as any).user.id as string;
  const parse = convoSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const other = parse.data.otherId;
  if (me === other)
    return res
      .status(400)
      .json({ error: "No puedes abrir chat contigo mismo" });
  // sort pair
  const [a, b] = [me, other].sort();
  let convo = db
    .prepare("SELECT * FROM conversations WHERE user_a = ? AND user_b = ?")
    .get(a, b);
  if (!convo) {
    if (!canStartConversation(me, other)) {
      return res.status(403).json({
        error:
          "Solo puedes iniciar chat con seguimiento mutuo o siendo educador/a de la misma unidad.",
      });
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO conversations (id, user_a, user_b) VALUES (?, ?, ?)",
    ).run(id, a, b);
    convo = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id);
  }
  res.json(convo);
});

// List messages of a conversation (must be participant)
dmsRouter.get(
  "/conversations/:id/messages",
  authMiddleware,
  (req: any, res: any) => {
    const me = (req as any).user.id as string;
    const convoId = req.params.id;
    const c = db
      .prepare("SELECT user_a, user_b FROM conversations WHERE id = ?")
      .get(convoId) as { user_a?: string; user_b?: string } | undefined;
    if (!c)
      return res.status(404).json({ error: "Conversación no encontrada" });
    if (c.user_a !== me && c.user_b !== me)
      return res.status(403).json({ error: "No eres participante" });
    const since = req.query.since as string | undefined;
    let rows;
    if (since) {
      rows = db
        .prepare(
          "SELECT * FROM dm_messages WHERE conversation_id = ? AND datetime(created_at) > datetime(?) ORDER BY created_at ASC",
        )
        .all(convoId, since);
    } else {
      rows = db
        .prepare(
          "SELECT * FROM dm_messages WHERE conversation_id = ? ORDER BY created_at ASC",
        )
        .all(convoId);
    }
    res.json(rows);
  },
);

// Send a message
const msgSchema = z.object({ content: z.string().min(1).max(4000) });
dmsRouter.post(
  "/conversations/:id/messages",
  authMiddleware,
  (req: any, res: any) => {
    const me = (req as any).user.id as string;
    const convoId = req.params.id;
    const c = db
      .prepare("SELECT user_a, user_b FROM conversations WHERE id = ?")
      .get(convoId) as { user_a?: string; user_b?: string } | undefined;
    if (!c)
      return res.status(404).json({ error: "Conversación no encontrada" });
    if (c.user_a !== me && c.user_b !== me)
      return res.status(403).json({ error: "No eres participante" });
    const parse = msgSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: parse.error.flatten() });
    const { content } = parse.data;
    const id = randomUUID();
    db.prepare(
      "INSERT INTO dm_messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)",
    ).run(id, convoId, me, content);
    const row = db.prepare("SELECT * FROM dm_messages WHERE id = ?").get(id);

    // Persistir notificación para el otro participante para que aparezca en la campana.
    const recipientId = c.user_a === me ? c.user_b : c.user_a;
    if (recipientId) {
      try {
        const actorProfile = db
          .prepare(
            "SELECT nombre_completo, username, avatar_url FROM profiles WHERE user_id = ?",
          )
          .get(me) as
          | {
              nombre_completo?: string | null;
              username?: string | null;
              avatar_url?: string | null;
            }
          | undefined;

        const display =
          actorProfile?.nombre_completo ||
          actorProfile?.username ||
          me.slice(0, 8);

        db.prepare(
          `
            INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
        ).run(
          randomUUID(),
          recipientId,
          me,
          "message",
          "conversation",
          convoId,
          JSON.stringify({
            conversation_id: convoId,
            sender_id: me,
            content,
            display,
            username: actorProfile?.username || null,
            avatar_url: actorProfile?.avatar_url || null,
          }),
          new Date().toISOString(),
        );
      } catch {
        // No bloquear envío del mensaje si falla la notificación.
      }
    }

    const io = req.app.get("io") as any;
    io?.to(`dm:${convoId}`).emit("dm:message", row);
    res.status(201).json(row);
  },
);
