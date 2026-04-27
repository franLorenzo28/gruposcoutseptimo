import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import bcrypt from "bcryptjs";
import { signToken, authMiddleware } from "../auth";
import { randomUUID } from "node:crypto";
import { sendVerificationEmail } from "../email-service";
import { rateLimit } from "../middleware/rate-limit";
import {
  classifyRegistration,
  isAdminIp,
  normalizeAccountStatus,
} from "../registration";
import { maybeSendNotificationEmail } from "../notification-email";

export const authRouter = Router();

const bridgeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(32).optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2).max(80),
  apellido: z.string().min(2).max(80),
  password: z.string().min(8),
  tipo_relacion: z.string().min(2).max(80),
  rama: z.string().trim().max(80).optional().nullable(),
  nombre_scout_relacionado: z.string().trim().max(120).optional().nullable(),
  captcha_id: z.string().uuid(),
  captcha_answer: z.coerce.number().int(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type CaptchaEntry = {
  answer: number;
  expiresAt: number;
  question: string;
};

const captchaChallenges = new Map<string, CaptchaEntry>();

function cleanupCaptchaChallenges() {
  const now = Date.now();
  for (const [key, challenge] of captchaChallenges.entries()) {
    if (challenge.expiresAt <= now) {
      captchaChallenges.delete(key);
    }
  }
}

function createCaptchaChallenge() {
  const id = randomUUID();
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 1;
  const shouldAdd = Math.random() > 0.4;
  const question = shouldAdd
    ? `${left} + ${right}`
    : `${left + right} - ${right}`;
  const answer = shouldAdd ? left + right : left;

  captchaChallenges.set(id, {
    answer,
    question,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return { id, question };
}

function getUserByEmail(email: string) {
  return db
    .prepare(
      "SELECT id, email, password_hash, username, email_verified_at, account_status, account_classification, account_review_reason FROM users WHERE email = ?",
    )
    .get(email) as
    | {
        id: string;
        email: string;
        password_hash: string;
        username: string | null;
        email_verified_at: string | null;
        account_status: string | null;
        account_classification: string | null;
        account_review_reason: string | null;
      }
    | undefined;
}

function normalizeUsernameSeed(input: string) {
  const base = String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (base.length >= 3) return base.slice(0, 24);
  return "scout";
}

function buildUniqueUsername(nombre: string, apellido: string, email: string) {
  const seed = normalizeUsernameSeed(`${nombre}_${apellido}`);
  const emailSeed = normalizeUsernameSeed(email.split("@")[0] || email);

  for (let index = 0; index < 8; index += 1) {
    const candidate = index === 0 ? `${seed}_${emailSeed}`.slice(0, 32) : `${seed}_${emailSeed}_${index}`.slice(0, 32);
    const existing = db.prepare("SELECT 1 FROM users WHERE username = ?").get(candidate);
    if (!existing) return candidate;
  }

  return `${seed}_${randomUUID().slice(0, 8)}`.slice(0, 32);
}

function createVerificationToken(userId: string) {
  const verificationToken = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO verification_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
  ).run(randomUUID(), userId, verificationToken, expiresAt);
  return { verificationToken, expiresAt };
}

authRouter.get("/captcha", (_req: any, res: any) => {
  cleanupCaptchaChallenges();
  const challenge = createCaptchaChallenge();
  res.json({
    challenge_id: challenge.id,
    question: challenge.question,
    expires_in_seconds: 10 * 60,
  });
});

authRouter.post("/local-bridge", async (req: any, res: any) => {
  const parse = bridgeSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  const { email, password } = parse.data;
  const username = parse.data.username || normalizeUsernameSeed(email.split("@")[0] || email);
  const existing = getUserByEmail(email);

  if (existing) {
    const valid = bcrypt.compareSync(password, existing.password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({ userId: existing.id });
    return res.json({
      token,
      user: {
        id: existing.id,
        email: existing.email,
        username: existing.username,
        email_verified: !!existing.email_verified_at,
        account_status: normalizeAccountStatus(existing.account_status),
      },
    });
  }

  const id = randomUUID();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, username, account_status, email_verified_at, account_classification, account_review_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    email,
    password_hash,
    username,
    "activo",
    new Date().toISOString(),
    "bridge_user",
    "Usuario local creado para puente de desarrollo",
  );
  db.prepare(
    "INSERT INTO profiles (user_id, nombre_completo, apellido, tipo_relacion, is_public) VALUES (?, ?, ?, ?, 0)",
  ).run(id, username, null, "bridge");

  const token = signToken({ userId: id });
  return res.json({
    token,
    user: {
      id,
      email,
      username,
      email_verified: true,
      account_status: "activo",
    },
  });
});

authRouter.post(
  "/register",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 4,
    message: "Demasiados intentos de registro. Intenta más tarde.",
    skip: (req: any) => isAdminIp(req.ip || req.socket?.remoteAddress),
  }),
  async (req: any, res: any) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }
    const { email, password, nombre, apellido, tipo_relacion, rama, nombre_scout_relacionado } = parse.data;

    cleanupCaptchaChallenges();
    const captcha = captchaChallenges.get(parse.data.captcha_id);
    if (!captcha || captcha.expiresAt <= Date.now()) {
      return res.status(400).json({ error: "Captcha expirado. Genera uno nuevo." });
    }
    if (captcha.answer !== parse.data.captcha_answer) {
      return res.status(400).json({ error: "Captcha incorrecto" });
    }
    captchaChallenges.delete(parse.data.captcha_id);

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(email, email.split("@")[0].toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "Email o usuario ya existe" });
    }

    const username = buildUniqueUsername(nombre, apellido, email);
    const registration = classifyRegistration({
      nombre,
      apellido,
      email,
      tipo_relacion,
      rama,
      nombre_scout_relacionado,
    });

    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);
    
    // Insert user
    db.prepare(
      "INSERT INTO users (id, email, password_hash, username, account_status, account_classification, account_review_reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      email,
      password_hash,
      username,
      "pendiente_email",
      registration.classification,
      registration.reason,
    );
    
    // Insert profile (nombre_completo should be a proper name, not username)
    db.prepare(
      `INSERT INTO profiles (user_id, nombre_completo, apellido, tipo_relacion, nombre_scout_relacionado, rama, is_public) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, nombre, apellido, tipo_relacion, nombre_scout_relacionado ?? null, rama ?? null, 0);

    // Generar token de verificación
    const { verificationToken } = createVerificationToken(id);

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error("Error al enviar email de verificación:", error);
      // No bloquear el registro si falla el email
    }

    // Notificar a administradores sobre nuevo registro
    try {
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      if (adminEmails.length > 0) {
        const adminUsers = db
          .prepare(
            "SELECT id, email FROM users WHERE LOWER(email) IN (" + adminEmails.map(() => "?").join(",") + ")",
          )
          .all(...adminEmails) as Array<{ id: string; email: string }>;

        if (adminUsers.length > 0) {
          const fullName = `${nombre} ${apellido}`.trim();
          const createdAt = new Date().toISOString();
          const notificationData = {
            kind: "user_registration_request",
            user_id: id,
            display: fullName,
            email,
            tipo_relacion,
            rama: rama ?? null,
            nombre_scout_relacionado: nombre_scout_relacionado ?? null,
            classification: registration.classification,
            status: "pendiente_email",
            content: `Nuevo registro: ${fullName} (${email}).`,
            created_at: createdAt,
          };

          for (const admin of adminUsers) {
            db.prepare(
              `
              INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            ).run(
              randomUUID(),
              admin.id,
              id,
              "message",
              "admin_request",
              id,
              JSON.stringify(notificationData),
              createdAt,
            );

            void maybeSendNotificationEmail(
              admin.id,
              "Nuevo registro pendiente",
              `${fullName} (${email}) se registro y requiere revision administrativa.`,
            ).catch(() => {
              // Silencioso para no bloquear el registro por errores de correo.
            });
          }
        }
      }
    } catch {
      // Silencioso para no bloquear el registro si falla la notificacion.
    }

    res.status(201).json({
      success: true,
      message:
        "Registro creado. Verifica tu email para continuar y luego espera aprobación administrativa.",
      user: {
        id,
        email,
        username,
        account_status: "pendiente_email",
        account_classification: registration.classification,
      },
      classification: registration.classification,
      nextStep: registration.nextStatus,
    });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({
      error: error.message || "Error al registrar usuario. Intenta de nuevo."
    });
  }
  },
);

authRouter.post("/login", (req: any, res: any) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;
  const row = getUserByEmail(email);
  if (!row) return res.status(400).json({ error: "Credenciales inválidas" });
  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) return res.status(400).json({ error: "Credenciales inválidas" });

  if (!row.email_verified_at) {
    return res.status(403).json({
      error: "Debes verificar tu email antes de iniciar sesión.",
      account_status: normalizeAccountStatus(row.account_status),
    });
  }

  const normalizedStatus = normalizeAccountStatus(row.account_status);
  if (normalizedStatus !== "activo") {
    return res.status(403).json({
      error:
        normalizedStatus === "pendiente_aprobacion"
          ? "Tu cuenta está pendiente de aprobación por administración."
          : normalizedStatus === "rechazado"
            ? "Tu cuenta fue rechazada por administración."
            : "Tu cuenta aún no está activa.",
      account_status: normalizedStatus,
      classification: row.account_classification,
      review_reason: row.account_review_reason,
    });
  }

  const token = signToken({ userId: row.id });
  res.json({ 
    token, 
    user: { 
      id: row.id, 
      email, 
      username: row.username,
      email_verified: !!row.email_verified_at,
      account_status: normalizedStatus,
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
  const currentUser = db
    .prepare("SELECT account_status, account_classification FROM users WHERE id = ?")
    .get(vToken.user_id) as { account_status?: string | null; account_classification?: string | null } | undefined;
  const nextStatus = normalizeAccountStatus(currentUser?.account_status) === "activo"
    ? "activo"
    : "pendiente_aprobacion";
  db.prepare("UPDATE users SET email_verified_at = ?, account_status = ? WHERE id = ?").run(
    verifiedAt,
    nextStatus,
    vToken.user_id,
  );
  db.prepare("UPDATE verification_tokens SET used_at = ? WHERE id = ?").run(
    verifiedAt,
    vToken.id,
  );

  res.json({
    success: true,
    message:
      nextStatus === "pendiente_aprobacion"
        ? "Email verificado correctamente. Tu cuenta quedó pendiente de aprobación admin."
        : "Email verificado correctamente.",
    next_status: nextStatus,
    classification: currentUser?.account_classification || null,
  });
});

// POST /auth/resend-verification - Reenviar email de verificación
authRouter.post("/resend-verification", authMiddleware, async (req: any, res: any) => {
  const userId = req.user.id;

  const user = db.prepare("SELECT email, email_verified_at, account_status FROM users WHERE id = ?").get(userId) as any;
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
