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
 * API layer for Narrativas.
 * All business writes go through Fastify; Supabase remains the data store.
 */

import type { Database, Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch, isLocalBackend } from "@/lib/backend";
import {
  NarrativaConAutor,
  NarrativaBloque,
  CreateNarrativaInput,
  UpdateNarrativaInput,
} from "@/types/narrativa";

type NarrativaRow = Database["public"]["Tables"]["narrativas"]["Row"];

function normalizeBloques(value: Json): NarrativaBloque[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is { id: string; tipo: "texto" | "imagen"; contenido: string } =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "tipo" in item &&
        "contenido" in item &&
        typeof (item as { id: unknown }).id === "string" &&
        (((item as { tipo: unknown }).tipo === "texto") ||
          (item as { tipo: unknown }).tipo === "imagen") &&
        typeof (item as { contenido: unknown }).contenido === "string",
    )
    .map((item) => ({
      id: item.id,
      tipo: item.tipo,
      contenido: item.contenido,
    }));
}

function mapNarrativaRow(row: NarrativaRow): NarrativaConAutor {
  return {
    id: row.id,
    titulo: row.titulo,
    year_section: row.year_section,
    bloques: normalizeBloques(row.bloques),
    autor_id: row.autor_id,
    fecha_publicacion: row.fecha_publicacion,
    created_at: row.created_at,
    updated_at: row.updated_at,
    autor: {
      id: row.autor_id,
      nombre_completo: null,
      username: null,
      avatar_url: null,
    },
  };
}

/**
 * Get all narrativas, optionally filtered by year_section
 */
export async function getNarrativas(yearSection?: string): Promise<NarrativaConAutor[]> {
  if (!isLocalBackend()) {
    let query = supabase
      .from("narrativas")
      .select("*")
      .order("year_section", { ascending: false });
    if (yearSection) query = query.eq("year_section", yearSection);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapNarrativaRow);
  }
  const url = yearSection
    ? `/v1/narratives?year_section=${encodeURIComponent(yearSection)}`
    : "/v1/narratives";
  const rows = await apiFetch<NarrativaRow[]>(url, { auth: "optional" });
  return rows.map(mapNarrativaRow);
}

/**
 * Get single narrativa by id
 */
export async function getNarrativa(id: string): Promise<NarrativaConAutor> {
  if (!isLocalBackend()) {
    const { data, error } = await supabase
      .from("narrativas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Narrativa no encontrada");
    return mapNarrativaRow(data as NarrativaRow);
  }
  const row = await apiFetch<NarrativaRow>(`/v1/narratives/${id}`, {
    auth: "optional",
  });
  return mapNarrativaRow(row);
}

/**
 * Create narrativa (admin only)
 */
export async function createNarrativa(
  input: CreateNarrativaInput,
): Promise<NarrativaConAutor> {
  const payload = {
    titulo: input.titulo,
    year_section: input.year_section,
    bloques: input.bloques as unknown as Json,
    fecha_publicacion: input.fecha_publicacion ? new Date(input.fecha_publicacion).toISOString() : new Date().toISOString(),
  };
  if (!isLocalBackend()) {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("narrativas")
      .insert({ ...payload, autor_id: session?.user?.id })
      .select()
      .single();
    if (error) throw error;
    return mapNarrativaRow(data as NarrativaRow);
  }
  const row = await apiFetch<NarrativaRow>("/v1/narratives", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapNarrativaRow(row);
}

/**
 * Update narrativa (author/admin only)
 */
export async function updateNarrativa(
  id: string,
  input: Partial<UpdateNarrativaInput>,
): Promise<NarrativaConAutor> {
  const payload: Record<string, unknown> = {};
  if (input.titulo !== undefined) payload.titulo = input.titulo;
  if (input.year_section !== undefined) payload.year_section = input.year_section;
  if (input.bloques !== undefined) payload.bloques = input.bloques as unknown as Json;
  if (input.fecha_publicacion !== undefined) payload.fecha_publicacion = new Date(input.fecha_publicacion).toISOString();
  if (!isLocalBackend()) {
    const { data, error } = await supabase
      .from("narrativas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapNarrativaRow(data as NarrativaRow);
  }
  const row = await apiFetch<NarrativaRow>(`/v1/narratives/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapNarrativaRow(row);
}

/**
 * Delete narrativa (author/admin only)
 */
export async function deleteNarrativa(id: string): Promise<void> {
  if (!isLocalBackend()) {
    const { error } = await supabase.from("narrativas").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await apiFetch(`/v1/narratives/${id}`, { method: "DELETE" });
}
