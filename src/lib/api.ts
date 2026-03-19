import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { isLocalBackend, apiFetch } from "@/lib/backend";

// Tipo para el perfil
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Calcular edad desde fecha de nacimiento
function calculateAge(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  try {
    // Evitar desfases de zona horaria: parsear como YYYY-MM-DD a componentes locales
    const [y, m, d] = String(fechaNacimiento).split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return null;
    const birth = new Date(y, m - 1, d);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const mm = now.getMonth() - birth.getMonth();
    if (mm < 0 || (mm === 0 && now.getDate() < birth.getDate())) years--;
    return years;
  } catch {
    return null;
  }
}

// Obtener un perfil
export async function getProfile(userId: string) {
  if (isLocalBackend()) {
    // En backend local, si el userId coincide con el autenticado, obtener /profiles/me
    // Si no, intentar obtener desde localDB directamente (para perfiles públicos)
    const auth = (await apiFetch("/profiles/me").catch(() => null)) as any;
    if (auth && auth.id === userId) {
      const me = (await apiFetch("/profiles/me")) as any;
      // Calcular edad desde fecha_nacimiento
      if (me && me.fecha_nacimiento) {
        me.edad = calculateAge(me.fecha_nacimiento);
      }
      return me as Profile;
    } else {
      // Obtener de localDB para otros usuarios
      const { localDB } = await import("@/lib/local-db");
      const profile = localDB.getProfile(userId);
      if (profile && profile.fecha_nacimiento) {
        (profile as any).edad = calculateAge(profile.fecha_nacimiento);
      }
      return profile as Profile;
    }
  }
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

// Actualizar un perfil
export async function updateProfile(
  profile: Partial<Profile> & { user_id: string },
) {
  if (isLocalBackend()) {
    // Mapea campos relevantes al backend local
    const body: any = {};
    if (profile.nombre_completo !== undefined)
      body.nombre_completo = profile.nombre_completo;
    if (profile.telefono !== undefined) body.telefono = profile.telefono;
    if ((profile as any).is_public !== undefined)
      body.is_public = (profile as any).is_public;
    if ((profile as any).avatar_url !== undefined)
      body.avatar_url = (profile as any).avatar_url;
    if ((profile as any).fecha_nacimiento !== undefined)
      body.fecha_nacimiento = (profile as any).fecha_nacimiento;
    if ((profile as any).rol_adulto !== undefined)
      body.rol_adulto = (profile as any).rol_adulto;
    if ((profile as any).rama_que_educa !== undefined)
      body.rama_que_educa = (profile as any).rama_que_educa;
    if ((profile as any).seisena !== undefined)
      body.seisena = (profile as any).seisena;
    if ((profile as any).patrulla !== undefined)
      body.patrulla = (profile as any).patrulla;
    if ((profile as any).equipo_pioneros !== undefined)
      body.equipo_pioneros = (profile as any).equipo_pioneros;
    if ((profile as any).comunidad_rovers !== undefined)
      body.comunidad_rovers = (profile as any).comunidad_rovers;
    if ((profile as any).username !== undefined)
      body.username = (profile as any).username;
    const updated = (await apiFetch("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(body),
    })) as any;
    return updated as Profile;
  }
  // Evitar duplicados por unique(user_id): usar update basado en filtro
  const { error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("user_id", profile.user_id);

  if (error) throw error;
  // En modo Supabase, devolver el perfil actualizado
  const { data } = await supabase
    .from("profiles")
    .select()
    .eq("user_id", profile.user_id)
    .single();
  return data as Profile;
}

// Obtener eventos
export async function getEventos() {
  if (isLocalBackend()) {
    const rows = await apiFetch("/events");
    return rows as Array<any>;
  }
  const { data, error } = await supabase
    .from("eventos")
    .select()
    .order("fecha_inicio", { ascending: true });

  if (error) throw error;
  return data;
}

// Crear un evento
export async function createEvento(evento: Record<string, any>) {
  if (isLocalBackend()) {
    await apiFetch("/events", { method: "POST", body: JSON.stringify(evento) });
    return;
  }
  const { error } = await supabase.from("eventos").insert(evento);

  if (error) throw error;
}

// Marcar perfil como público/privado
export async function setProfilePublic(userId: string, isPublic: boolean) {
  if (isLocalBackend()) {
    await apiFetch("/profiles/me", {
      method: "PUT",
      body: JSON.stringify({ is_public: isPublic }),
    });
    return;
  }
  // Primero intentamos actualizar; si no hay filas afectadas, insertamos esqueleto
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_public: isPublic })
    .eq("user_id", userId)
    .select("user_id");

  if (error) throw error;

  if (!data || data.length === 0) {
    let existingProfile: Profile | null = null;
    try {
      existingProfile = await getProfile(userId);
    } catch {
      existingProfile = null;
    }

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;

    const nombreFallback =
      existingProfile?.nombre_completo ||
      authUser?.user_metadata?.nombre ||
      authUser?.email ||
      "Perfil sin nombre";
    const telefonoFallback =
      existingProfile?.telefono || authUser?.user_metadata?.telefono || "";

    const insertPayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      user_id: userId,
      nombre_completo: nombreFallback,
      telefono: telefonoFallback,
      edad: existingProfile?.edad ?? null,
      seisena: existingProfile?.seisena ?? null,
      patrulla: existingProfile?.patrulla ?? null,
      equipo_pioneros: existingProfile?.equipo_pioneros ?? null,
      comunidad_rovers: existingProfile?.comunidad_rovers ?? null,
      fecha_nacimiento: existingProfile?.fecha_nacimiento ?? null,
      rol_adulto: existingProfile?.rol_adulto ?? null,
      is_public: isPublic,
      username: existingProfile?.username ?? null,
      username_updated_at: existingProfile?.username_updated_at ?? null,
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .insert(insertPayload);

    if (insertError) throw insertError;
  }
}

// Eliminar la cuenta del usuario autenticado
export async function deleteMyAccount(): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch("/users/me", { method: "DELETE" });
    return;
  }
  // En modo Supabase puro, borrar cuenta no está implementado aquí para evitar inconsistencias
  // Se podría implementar un RPC o flujo admin específico si fuera necesario.
  throw new Error("Eliminar cuenta no disponible en este modo");
}
