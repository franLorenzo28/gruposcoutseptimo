import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";

type ProfileResult = { data: Profile | null; error: unknown };
const pending = new Map<string, Promise<ProfileResult>>();

export function withCalculatedAge(profile: Profile): Profile {
  if (!profile.fecha_nacimiento) return profile;
  const [year, month, day] = profile.fecha_nacimiento.split("-").map(Number);
  if (!year || !month || !day) return profile;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return { ...profile, edad: age };
}

/** In-flight deduplication only: settled profiles are never authorization caches. */
export async function readOwnProfile(userId: string): Promise<ProfileResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.id !== userId) return { data: null, error: null };
  const scope = `${userId}:${session.access_token}`;
  const existing = pending.get(scope);
  if (existing) return existing;
  const request = Promise.resolve(supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle())
    .then(({ data, error }) => ({ data: data ? withCalculatedAge(data as Profile) : null, error }))
    .finally(() => { if (pending.get(scope) === request) pending.delete(scope); });
  pending.set(scope, request);
  return request;
}

export function invalidateProfileReads() { pending.clear(); }
