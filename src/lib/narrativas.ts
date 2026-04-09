/**
 * Features/Changelog - Auto-detected features for the app
 * Add new features here when you add pages, features, or functionality
 */

export const FEATURES_CHANGELOG = {
  lastSeen: "2026-04-08",
  features: [
    {
      id: "narrativas-feature",
      name: "Narrativas",
      date: "2026-04-08",
      description:
        "Nueva sección para relatos históricos del movimiento scout, organizados por años. Solo admins pueden crear, todos pueden ver.",
      type: "feature" as const,
      icon: "BookOpen",
      status: "new" as const,
    },
  ],
};

/**
 * API layer for Narrativas - Abstract dual backend support
 * Uses local Express backend or Supabase depending on VITE_BACKEND
 */

import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { NarrativaConAutor, CreateNarrativaInput, UpdateNarrativaInput } from "@/types/narrativa";

/**
 * Get all narrativas, optionally filtered by year_section
 */
export async function getNarrativas(yearSection?: string): Promise<NarrativaConAutor[]> {
  if (isLocalBackend()) {
    const url = yearSection
      ? `/narrativas?year_section=${encodeURIComponent(yearSection)}`
      : "/narrativas";
    return (await apiFetch(url)) as NarrativaConAutor[];
  }

  let query = supabase
    .from("narrativas")
    .select(`
      id, titulo, year_section, bloques, autor_id,
      fecha_publicacion, created_at, updated_at
    `);

  if (yearSection) {
    query = query.like("year_section", `%${yearSection}%`);
  }

  const { data, error } = await query.order("year_section", {
    ascending: false,
  });

  if (error) throw error;

  // Map Supabase response to NarrativaConAutor format
  return (data || []).map((row: any) => ({
    ...row,
    autor: {
      id: row.autor_id,
      nombre_completo: null,
      username: null,
      avatar_url: null,
    },
  }));
}

/**
 * Get single narrativa by id
 */
export async function getNarrativa(id: string): Promise<NarrativaConAutor> {
  if (isLocalBackend()) {
    return (await apiFetch(`/narrativas/${id}`)) as NarrativaConAutor;
  }

  const { data, error } = await supabase
    .from("narrativas")
    .select(`
      id, titulo, year_section, bloques, autor_id,
      fecha_publicacion, created_at, updated_at
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    autor: {
      id: data.autor_id,
      nombre_completo: null,
      username: null,
      avatar_url: null,
    },
  } as NarrativaConAutor;
}

/**
 * Create narrativa (admin only)
 */
export async function createNarrativa(
  input: CreateNarrativaInput,
): Promise<NarrativaConAutor> {
  if (isLocalBackend()) {
    return (await apiFetch("/narrativas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })) as NarrativaConAutor;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const payload = {
    titulo: input.titulo,
    year_section: input.year_section,
    bloques: input.bloques,
    autor_id: user.id,
    fecha_publicacion: input.fecha_publicacion ? new Date(input.fecha_publicacion).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("narrativas")
    .insert(payload)
    .select(`
      id, titulo, year_section, bloques, autor_id,
      fecha_publicacion, created_at, updated_at
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    autor: {
      id: data.autor_id,
      nombre_completo: null,
      username: null,
      avatar_url: null,
    },
  } as NarrativaConAutor;
}

/**
 * Update narrativa (author/admin only)
 */
export async function updateNarrativa(
  id: string,
  input: Partial<UpdateNarrativaInput>,
): Promise<NarrativaConAutor> {
  if (isLocalBackend()) {
    return (await apiFetch(`/narrativas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })) as NarrativaConAutor;
  }

  const payload: any = {};
  if (input.titulo !== undefined) payload.titulo = input.titulo;
  if (input.year_section !== undefined) payload.year_section = input.year_section;
  if (input.bloques !== undefined) payload.bloques = input.bloques;
  if (input.fecha_publicacion !== undefined) payload.fecha_publicacion = new Date(input.fecha_publicacion).toISOString();
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("narrativas")
    .update(payload)
    .eq("id", id)
    .select(`
      id, titulo, year_section, bloques, autor_id,
      fecha_publicacion, created_at, updated_at
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    autor: {
      id: data.autor_id,
      nombre_completo: null,
      username: null,
      avatar_url: null,
    },
  } as NarrativaConAutor;
}

/**
 * Delete narrativa (author/admin only)
 */
export async function deleteNarrativa(id: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/narrativas/${id}`, { method: "DELETE" });
    return;
  }

  const { error } = await supabase
    .from("narrativas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
