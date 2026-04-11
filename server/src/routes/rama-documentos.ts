import { Router, Request, Response } from "express";
import { db } from "../db";
import { authMiddleware, UserRequest } from "../auth";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

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
  "text/plain",
  "text/csv",
  "application/zip",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    } else {
      cb(null, true);
    }
  },
});

// Helper: Check if user is rama educator
function isRamaEducator(userId: string, rama: string): boolean {
  try {
    const result = db
      .prepare(
        `SELECT id FROM profiles WHERE user_id = ? AND (rama_que_educa = ? OR rol_adulto = 1)`
      )
      .get(userId, rama);
    return !!result;
  } catch {
    return false;
  }
}

// Helper: Check if user is rama member
function isRamaMember(userId: string, rama: string): boolean {
  try {
    const result = db
      .prepare(
        `SELECT id FROM profiles WHERE user_id = ? AND (seisena = ? OR patrulla = ? OR equipo_pioneros = ? OR comunidad_rovers = ?)`
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

// Upload document (only rama educators)
ramaDocumentosRouter.post(
  "/:rama/documentos",
  authMiddleware,
  upload.single("file"),
  async (req: UserRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const { rama } = req.params;
      const userId = req.userId!;

      // Validate rama
      if (!["lobatos", "caminantes", "pioneros", "rover"].includes(rama)) {
        return res.status(400).json({ error: "Rama inválida" });
      }

      // Check if user is rama educator
      if (!isRamaEducator(userId, rama)) {
        return res
          .status(403)
          .json({ error: "Solo educadores pueden subir archivos" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No se seleccionó archivo" });
      }

      // Generate path and ID
      const docId = uuidv4();
      const fileName = `${rama}/${docId}-${req.file.originalname}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("rama-documentos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({ error: "Error al subir a Supabase Storage" });
      }

      // Save metadata to local database
      const stmt = db.prepare(`
        INSERT INTO rama_documentos (
          id, rama, nombre, original_filename, mime_type, tamaño, storage_path, subido_por, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      stmt.run(
        docId,
        rama,
        req.file.originalname,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        fileName, // Store the Supabase path
        userId
      );

      // Return created document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ?`)
        .get(docId) as DocumentRow;

      res.status(201).json(documento);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  }
);

// Delete document (only rama educator or admin)
ramaDocumentosRouter.delete(
  "/:rama/documentos/:docId",
  authMiddleware,
  async (req: UserRequest, res: Response) => {
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

      // Check permissions (educator or admin)
      const isEducator = isRamaEducator(userId, rama);
      if (!isEducator) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para eliminar documentos" });
      }

      // Delete from Supabase Storage
      if (documento.storage_path) {
        const { error: deleteError } = await supabase.storage
          .from("rama-documentos")
          .remove([documento.storage_path]);

        if (deleteError) {
          console.error("Error deleting from Supabase:", deleteError);
          // Continue anyway - delete from DB
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

// Get signed download URL for document
ramaDocumentosRouter.get(
  "/:rama/documentos/:docId/download-url",
  authMiddleware,
  async (req: UserRequest, res: Response) => {
    try {
      const { rama, docId } = req.params;
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

      // Get document
      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ? AND rama = ?`)
        .get(docId, rama) as DocumentRow | undefined;

      if (!documento) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      // Generate signed URL (expires in 1 hour)
      const { data, error } = await supabase.storage
        .from("rama-documentos")
        .createSignedUrl(documento.storage_path, 3600);

      if (error) {
        console.error("Error generating signed URL:", error);
        return res.status(500).json({ error: "Error al generar URL de descarga" });
      }

      res.json({ url: data?.signedUrl });
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Error al generar URL" });
    }
  }
);
