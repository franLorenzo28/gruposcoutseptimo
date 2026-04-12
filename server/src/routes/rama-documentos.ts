import { Router } from "express";
import { db } from "../db";
import { authMiddleware } from "../auth";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  canModerateRama,
  canReadRama,
  isValidRama,
  type RamaKey,
} from "../rama-access";

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

interface BroadcastRow {
  id: string;
  rama: string;
  author_id: string;
  content: string;
  created_at: string;
  nombre_completo: string | null;
  username: string | null;
  avatar_url: string | null;
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
const broadcastSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

function getRamaOrFail(rawRama: string, res: any): RamaKey | null {
  if (!isValidRama(rawRama)) {
    res.status(400).json({ error: "Unidad inválida" });
    return null;
  }
  return rawRama;
}

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    } else {
      cb(null, true);
    }
  },
});

// List documents of a unidad (solo miembros/educadores de la unidad)
ramaDocumentosRouter.get(
  "/:rama/documentos",
  authMiddleware,
  (req: any, res: any) => {
    try {
      const userId = (req as any).user.id as string;
      const rama = getRamaOrFail(req.params.rama, res);
      if (!rama) return;

      if (!canReadRama(userId, rama)) {
        return res.status(403).json({
          error: "No tienes permiso para ver documentos de esta unidad",
        });
      }

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

// Upload document (only unidad educators)
ramaDocumentosRouter.post(
  "/:rama/documentos",
  authMiddleware,
  upload.single("file"),
  async (req: any, res: any) => {
    try {
      const userId = (req as any).user.id as string;
      const rama = getRamaOrFail(req.params.rama, res);
      if (!rama) return;

      if (!canModerateRama(userId, rama)) {
        return res
          .status(403)
          .json({ error: "Solo educadores de esta unidad pueden subir archivos" });
      }

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

      // Save metadata to local database (for development)
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

      // Also save metadata to Supabase PostgreSQL (for production sync)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        try {
          await supabase.from("rama_documentos").insert({
            id: docId,
            rama,
            nombre: req.file.originalname,
            original_filename: req.file.originalname,
            mime_type: req.file.mimetype,
            tamaño: req.file.size,
            storage_path: fileName,
            subido_por: userId,
          });
        } catch (supabaseError) {
          console.error("Warning: Could not save metadata to Supabase PostgreSQL:", supabaseError);
          // Don't fail the upload if Supabase PostgreSQL fails, as SQLite already has it
        }
      }

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

// Delete document (only unidad educator or admin)
ramaDocumentosRouter.delete(
  "/:rama/documentos/:docId",
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const userId = (req as any).user.id as string;
      const rama = getRamaOrFail(req.params.rama, res);
      if (!rama) return;
      const { docId } = req.params;

      const documento = db
        .prepare(`SELECT * FROM rama_documentos WHERE id = ? AND rama = ?`)
        .get(docId, rama) as DocumentRow | undefined;

      if (!documento) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      if (!canModerateRama(userId, rama)) {
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
          console.error("Error deleting from Supabase Storage:", deleteError);
          // Continue anyway - delete from DB
        }
      }

      // Delete from local database
      db.prepare(`DELETE FROM rama_documentos WHERE id = ?`).run(docId);

      // Delete from Supabase PostgreSQL
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        try {
          await supabase.from("rama_documentos").delete().eq("id", docId);
        } catch (supabaseError) {
          console.error("Warning: Could not delete from Supabase PostgreSQL:", supabaseError);
          // Don't fail if Supabase PostgreSQL delete fails
        }
      }

      res.json({ success: true, message: "Documento eliminado" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Error al eliminar documento" });
    }
  }
);

// Get signed download URL for document (solo unidad habilitada)
ramaDocumentosRouter.get(
  "/:rama/documentos/:docId/download-url",
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const userId = (req as any).user.id as string;
      const rama = getRamaOrFail(req.params.rama, res);
      if (!rama) return;
      const { docId } = req.params;

      if (!canReadRama(userId, rama)) {
        return res.status(403).json({
          error: "No tienes permiso para abrir documentos de esta unidad",
        });
      }

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

// Listar mensajes del canal de difusión de una unidad
ramaDocumentosRouter.get("/:rama/difusion", authMiddleware, (req: any, res: any) => {
  try {
    const userId = (req as any).user.id as string;
    const rama = getRamaOrFail(req.params.rama, res);
    if (!rama) return;

    if (!canReadRama(userId, rama)) {
      return res.status(403).json({
        error: "No tienes permiso para ver difusión de esta unidad",
      });
    }

    const rows = db
      .prepare(
        `
        SELECT m.id, m.rama, m.author_id, m.content, m.created_at,
               p.nombre_completo, p.avatar_url, u.username
        FROM rama_broadcast_messages m
        LEFT JOIN profiles p ON p.user_id = m.author_id
        LEFT JOIN users u ON u.id = m.author_id
        WHERE m.rama = ?
        ORDER BY datetime(m.created_at) ASC
        `,
      )
      .all(rama) as BroadcastRow[];

    res.json(rows);
  } catch (error) {
    console.error("Error listing rama broadcast messages:", error);
    res.status(500).json({ error: "Error al cargar mensajes de difusión" });
  }
});

// Publicar mensaje en canal de difusión (solo educador de la unidad)
ramaDocumentosRouter.post("/:rama/difusion", authMiddleware, (req: any, res: any) => {
  try {
    const userId = (req as any).user.id as string;
    const rama = getRamaOrFail(req.params.rama, res);
    if (!rama) return;

    if (!canModerateRama(userId, rama)) {
      return res.status(403).json({
        error: "Solo educadores de la unidad pueden publicar difusión",
      });
    }

    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Mensaje inválido" });
    }

    const id = uuidv4();
    db.prepare(
      `
      INSERT INTO rama_broadcast_messages (id, rama, author_id, content)
      VALUES (?, ?, ?, ?)
      `,
    ).run(id, rama, userId, parsed.data.content);

    const created = db
      .prepare(
        `
        SELECT m.id, m.rama, m.author_id, m.content, m.created_at,
               p.nombre_completo, p.avatar_url, u.username
        FROM rama_broadcast_messages m
        LEFT JOIN profiles p ON p.user_id = m.author_id
        LEFT JOIN users u ON u.id = m.author_id
        WHERE m.id = ?
        `,
      )
      .get(id) as BroadcastRow | undefined;

    if (!created) {
      return res.status(500).json({ error: "No se pudo crear el mensaje" });
    }

    const io = req.app.get("io") as {
      to: (room: string) => { emit: (eventName: string, payload: BroadcastRow) => void };
    };
    io?.to(`rama:${rama}`).emit("rama:broadcast:new", created);

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating rama broadcast message:", error);
    res.status(500).json({ error: "Error al publicar mensaje de difusión" });
  }
});
