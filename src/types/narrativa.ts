/**
 * Tipos para Narrativas (relatos históricos)
 */

export interface NarrativaBloque {
  id: string;
  tipo: "texto" | "imagen";
  contenido: string; // Texto o URL de imagen
}

export interface Narrativa {
  id: string;
  titulo: string;
  year_section: string; // Ej: "JUN-1964", "1964"
  bloques: NarrativaBloque[];
  autor_id: string;
  fecha_publicacion: string;
  created_at: string;
  updated_at: string;
}

export interface NarrativaConAutor extends Narrativa {
  autor?: {
    id: string;
    nombre_completo?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
}

export interface CreateNarrativaInput {
  titulo: string;
  year_section: string;
  fecha_publicacion: string;
  bloques: NarrativaBloque[];
}

export interface UpdateNarrativaInput {
  titulo?: string;
  year_section?: string;
  fecha_publicacion?: string;
  bloques?: NarrativaBloque[];
}
