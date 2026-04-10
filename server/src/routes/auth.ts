import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import bcrypt from "bcryptjs";
import { signToken, authMiddleware } from "../auth";
import { randomUUID } from "node:crypto";
import { sendVerificationEmail } from "../email-service";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
});

authRouter.post("/register", async (req: any, res: any) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: parse.error.flatten() });
    const { email, password, username } = parse.data;

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(email, username);
    if (existing)
      return res.status(409).json({ error: "Email o usuario ya existe" });

    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);
    
    // Insert user
    db.prepare(
      "INSERT INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)",
    ).run(id, email, password_hash, username);
    
    // Insert profile (nombre_completo should be a proper name, not username)
    db.prepare(
      `INSERT INTO profiles (user_id, nombre_completo, is_public) 
      VALUES (?, ?, ?)`,
    ).run(id, username, 0);

    // Generar token de verificación
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
    db.prepare(
      "INSERT INTO verification_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
    ).run(randomUUID(), id, verificationToken, expiresAt);

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error("Error al enviar email de verificación:", error);
      // No bloquear el registro si falla el email
    }

    const token = signToken({ userId: id });
    res.json({ token, user: { id, email, username } });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({
      error: error.message || "Error al registrar usuario. Intenta de nuevo."
    });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post("/login", (req: any, res: any) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;
  const row = db
    .prepare("SELECT id, password_hash, username, email_verified_at FROM users WHERE email = ?")
    .get(email) as any;
  if (!row) return res.status(400).json({ error: "Credenciales inválidas" });
  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) return res.status(400).json({ error: "Credenciales inválidas" });
  const token = signToken({ userId: row.id });
  res.json({ 
    token, 
    user: { 
      id: row.id, 
      email, 
      username: row.username,
      email_verified: !!row.email_verified_at 
    } 
  });
});

// GET /auth/verify?token=xxx - Verificar email
authRouter.get("/verify", (req: any, res: any) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token requerido" });

  const vToken = db
    .prepare(
      "SELECT id, user_id, expires_at, used_at FROM verification_tokens WHERE token = ?",
    )
    .get(token) as any;

  if (!vToken) {
    return res.status(400).json({ error: "Token inválido" });
  }

  if (vToken.used_at) {
    return res.status(400).json({ error: "Token ya usado" });
  }

  const now = new Date();
  const expiresAt = new Date(vToken.expires_at);
  if (now > expiresAt) {
    return res.status(400).json({ error: "Token expirado" });
  }

  // Marcar token como usado y verificar email
  const verifiedAt = now.toISOString();
  db.prepare("UPDATE users SET email_verified_at = ? WHERE id = ?").run(
    verifiedAt,
    vToken.user_id,
  );
  db.prepare("UPDATE verification_tokens SET used_at = ? WHERE id = ?").run(
    verifiedAt,
    vToken.id,
  );

  res.json({ success: true, message: "Email verificado correctamente" });
});

// POST /auth/resend-verification - Reenviar email de verificación
authRouter.post("/resend-verification", authMiddleware, async (req: any, res: any) => {
  const userId = req.user.id;

  const user = db.prepare("SELECT email, email_verified_at FROM users WHERE id = ?").get(userId) as any;
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  if (user.email_verified_at) {
    return res.status(400).json({ error: "Email ya verificado" });
  }

  // Invalidar tokens anteriores
  db.prepare("UPDATE verification_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL")
    .run(new Date().toISOString(), userId);

  // Generar nuevo token
  const verificationToken = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO verification_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
  ).run(randomUUID(), userId, verificationToken, expiresAt);

  // Enviar email
  try {
    await sendVerificationEmail(user.email, verificationToken);
    res.json({ success: true, message: "Email de verificación reenviado" });
  } catch (error) {
    console.error("Error al reenviar email:", error);
    res.status(500).json({ error: "No se pudo enviar el email" });
  }
});
