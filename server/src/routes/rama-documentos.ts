import { Router, Request, Response } from "express";
import { db } from "../db";
import { authMiddleware, UserRequest } from "../auth";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const ramaDocumentosRouter = Router();

// Types
interface DocumentRow {
  id: string;
  rama: string;
  nombre: string;
  original_filename: string;
  mime_type: string;
  tamaño: number;
  storage_path: string;
  subido_por: string;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/zip",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const uploadSchema = z.object({
  rama: z.enum(["lobatos", "caminantes", "pioneros", "rover"]),
});

// Configure upload storage
const uploadsDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ramaDir = path.join(uploadsDir, (req as UserRequest).body.rama);
    if (!fs.existsSync(ramaDir)) {
      fs.mkdirSync(ramaDir, { recursive: true });
    }
    cb(null, ramaDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Helper: Check if user is rama admin
function isRamaAdmin(userId: string, rama: string): boolean {
  try {
    const result = db
      .prepare(
        `SELECT id FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND p.rol_adulto = 'true' AND p.rama_que_educa = ?`
      )
      .get(userId, rama);
    return !!result;
  } catch {
    return false;
  }
}

// Helper: Check if user is member of rama
function isRamaMember(userId: string, rama: string): boolean {
  try {
    const result = db
      .prepare(
        `SELECT id FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND (p.seisena = ? OR p.patrulla = ? OR p.equipo_pioneros = ? OR p.comunidad_rovers = ?)`
      )
      .get(userId, rama, rama, rama, rama);
    return !!result;
  } catch {
    return false;
  }
}

// List documents of a rama (accessible to members)
ramaDocumentosRouter.get(
  "/:rama/documentos",
  authMiddleware,
  (req: UserRequest, res: Response) => {
    try {
      const { rama } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Check if user is member of rama
      if (!isRamaMember(userId, rama)) {
        return res
          .status(403)
          .json({ error: "No tienes acceso a los documentos de esta rama" });
      }

      // List documents
      const documentos = db
        .prepare(
          `SELECT * FROM rama_documentos WHERE rama = ? ORDER BY created_at DESC`
        )
        .all(rama) as DocumentRow[];

      res.json(documentos);
    } catch (error) {
      console.error("Error listing documents:", error);
      res.status(500).json({ error: "Error al listar documentos" });
    }
  }
);

// Upload document (only rama admins)
ramaDocumentosRouter.post(
  "/:rama/documentos",
  authMiddleware,
  upload.single("file"),
  (req: UserRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const { rama } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Check if user is rama admin
      if (!isRamaAdmin(userId, rama)) {
        return res
          .status(403)
          .json({ error: "Solo administradores de rama pueden subir archivos" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No se seleccionó archivo" });
      }

      // Generate ID and validate filename
      const docId = uuidv4();
      const storagePath = `ramas/${rama}/${req.file.filename}`;

      // Insert into database
      const stmt = db.prepare(`
        INSERT INTO rama_documentos (
          id, rama, nombre, original_filename, mime_type, tamaño, storage_path, subido_por, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      stmt.run(
        docId,
        rama,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        storagePath,
        userId
      );

      // Return created document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ?`)
        .get(docId) as DocumentRow;

      res.status(201).json(documento);
    } catch (error) {
      console.error("Error uploading document:", error);
      // Clean up file if it exists
      if ((req as any).file) {
        try {
          fs.unlinkSync((req as any).file.path);
        } catch {}
      }
      res.status(500).json({ error: "Error al subir archivo" });
    }
  }
);

// Delete document (only rama admin or uploader)
ramaDocumentosRouter.delete(
  "/:rama/documentos/:docId",
  authMiddleware,
  (req: UserRequest, res: Response) => {
    try {
      const { rama, docId } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Get document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ? AND rama = ?`)
        .get(docId, rama) as DocumentRow | undefined;

      if (!documento) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      // Check permissions (uploader or rama admin)
      const isUploader = documento.subido_por === userId;
      const isAdmin = isRamaAdmin(userId, rama);

      if (!isUploader && !isAdmin) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para eliminar este documento" });
      }

      // Delete file from storage
      if (documento.storage_path) {
        try {
          const filePath = path.join(
            uploadsDir,
            rama,
            path.basename(documento.storage_path)
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }

      // Delete from database
      db.prepare(`DELETE FROM rama_documentos WHERE id = ?`).run(docId);

      res.json({ success: true, message: "Documento eliminado" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Error al eliminar documento" });
    }
  }
);

// Download/serve document (accessible to rama members)
ramaDocumentosRouter.get(
  "/:rama/documentos/:docId/download",
  authMiddleware,
  (req: UserRequest, res: Response) => {
    try {
      const { rama, docId } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Check if user is member
      if (!isRamaMember(userId, rama)) {
        return res
          .status(403)
          .json({ error: "No tienes acceso a los documentos de esta rama" });
      }

      // Get document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ? AND rama = ?`)
        .get(docId, rama) as DocumentRow | undefined;

      if (!documento) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      // Build file path
      const filePath = path.join(uploadsDir, rama, documento.original_filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Archivo no encontrado en servidor" });
      }

      // Set proper headers and send file
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${documento.nombre}"`
      );
      res.setHeader("Content-Type", documento.mime_type);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Error al descargar documento" });
    }
  }
);

// Serve document inline (for preview, accessible to rama members)
ramaDocumentosRouter.get(
  "/:rama/documentos/:docId/view",
  authMiddleware,
  (req: UserRequest, res: Response) => {
    try {
      const { rama, docId } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Check if user is member
      if (!isRamaMember(userId, rama)) {
        return res
          .status(403)
          .json({ error: "No tienes acceso a los documentos de esta rama" });
      }

      // Get document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ? AND rama = ?`)
        .get(docId, rama) as DocumentRow | undefined;

      if (!documento) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      // Build file path
      const filePath = path.join(uploadsDir, rama, documento.original_filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Archivo no encontrado en servidor" });
      }

      // Set proper headers for inline view
      res.setHeader("Content-Type", documento.mime_type);
      res.setHeader("Content-Disposition", `inline; filename="${documento.nombre}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ error: "Error al ver documento" });
    }
  }
);
