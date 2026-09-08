import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { apiFetch, getAuthUser, isLocalBackend } from "@/lib/backend";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Partial<Profile> & { user_id: string };

const writableProfileFields = [
  "nombre_completo",
  "username",
  "telefono",
  "descripcion_personal",
  "profesion_ocupacion",
  "fecha_nacimiento",
  "avatar_url",
  "is_public",
  "privacy_preferences",
  "notification_preferences",
  "patrulla",
  "seisena",
  "adelanto",
  "equipo_pioneros",
  "comunidad_rovers",
  "promesa",
  "ppp_url",
] as const satisfies readonly (keyof Profile)[];

function withCalculatedAge(profile: Profile): Profile {
  if (!profile.fecha_nacimiento) return profile;
  const [year, month, day] = profile.fecha_nacimiento.split("-").map(Number);
  if (!year || !month || !day) return profile;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return { ...profile, edad: age };
}

async function authenticatedUserId(): Promise<string> {
  if (isLocalBackend()) {
    const user = await getAuthUser();
    if (!user) throw new Error("No autenticado");
    return user.id;
  }

  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("No autenticado");
  return id;
}

/** Reads the own profile from its backend; other profiles use the public API DTO. */
export async function getProfile(userId: string): Promise<Profile> {
  const currentUserId = await authenticatedUserId();
  if (!isLocalBackend()) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return withCalculatedAge(data as Profile);
  }
  const profile = await apiFetch<Profile>(
    currentUserId === userId ? "/v1/me/profile" : `/v1/profiles/${userId}`,
  );
  return withCalculatedAge(profile);
}

/** The server derives the target user from the signed access token. */
export async function updateProfile(profile: ProfileUpdate): Promise<Profile> {
  const currentUserId = await authenticatedUserId();
  if (profile.user_id !== currentUserId) {
    throw new Error("No puedes modificar el perfil de otro usuario");
  }
  const body: Record<string, unknown> = {};
  for (const field of writableProfileFields) {
    if (profile[field] !== undefined) body[field] = profile[field];
  }
  if (!isLocalBackend()) {
    const { data, error } = await supabase
      .from("profiles")
      .update(body)
      .eq("user_id", currentUserId)
      .select()
      .single();
    if (error) throw error;
    return withCalculatedAge(data as Profile);
  }
  return apiFetch<Profile>("/v1/me/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getEventos() {
  if (!isLocalBackend()) {
    const { data, error } = await supabase
      .from("eventos")
      .select()
      .order("fecha_inicio", { ascending: true });
    if (error) throw error;
    return data as Array<Database["public"]["Tables"]["eventos"]["Row"]>;
  }
  return apiFetch<Array<Database["public"]["Tables"]["eventos"]["Row"]>>(
    "/v1/events",
    { auth: "optional" },
  );
}

export async function createEvento(
  evento: Database["public"]["Tables"]["eventos"]["Insert"],
): Promise<void> {
  if (!isLocalBackend()) {
    const { error } = await supabase.from("eventos").insert(evento);
    if (error) throw error;
    return;
  }
  await apiFetch("/v1/events", {
    method: "POST",
    body: JSON.stringify(evento),
  });
}

export async function setProfilePublic(userId: string, isPublic: boolean): Promise<void> {
  const currentUserId = await authenticatedUserId();
  if (currentUserId !== userId) throw new Error("No puedes modificar el perfil de otro usuario");
  if (!isLocalBackend()) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_public: isPublic })
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }
  await apiFetch("/v1/me/profile", {
    method: "PATCH",
    body: JSON.stringify({ is_public: isPublic }),
  });
}

export async function deleteMyAccount(): Promise<void> {
  await apiFetch("/v1/me", { method: "DELETE" });
}
