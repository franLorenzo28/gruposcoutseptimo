import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { authMiddleware } from "../auth";
import { rateLimit, rateLimitPresets } from "../middleware/rate-limit";
import { randomUUID } from "node:crypto";

const uploadDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Allowed MIME types for image uploads
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => {
    const extensionByMime: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const unique = randomUUID();
    const ext = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: ${ALLOWED_MIMES.join(', ')}`));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/image",
  authMiddleware,
  rateLimit(rateLimitPresets.upload),
  upload.single("file"),
  (req: any, res: any) => {
    const file = (req as any).file as any | undefined;
    if (!file) return res.status(400).json({ error: "Archivo faltante" });
    const publicUrl = `/uploads/${file.filename}`;
    res.status(201).json({ url: publicUrl });
  },
);

// Error handling for multer
uploadsRouter.use((err: any, _req: any, res: any, _next: any) => {
  if (err.message.includes('no permitido') || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Error en upload' });
});
