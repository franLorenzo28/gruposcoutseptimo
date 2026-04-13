import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";

export type FollowStatus = "pending" | "accepted" | "blocked";

export type FollowActionResult = {
  error: Error | null;
  followStatus?: FollowStatus;
  notificationPersisted?: boolean;
  notificationErrorMessage?: string;
};

export async function getMyUserId() {
  if (isLocalBackend()) {
    try {
      const me = (await apiFetch("/profiles/me")) as any;
      return me?.id || me?.user_id || null;
    } catch {
      return null;
    }
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

export async function getFollowRelation(withUserId: string) {
  if (isLocalBackend()) {
    try {
      const rel = await apiFetch(`/follows/relation/${withUserId}`);
      return { data: rel, error: null } as const;
    } catch (e: any) {
      return { data: null, error: e } as const;
    }
  }
  const me = await getMyUserId();
  if (!me) return { data: null, error: new Error("No autenticado") } as const;
  const result = await supabase
    .from("follows")
    .select("follower_id, followed_id, status, created_at, accepted_at")
    .eq("follower_id", me)
    .eq("followed_id", withUserId)
    .maybeSingle();

  // Some RLS setups evaluate policies against tables the current role cannot read.
  // In that case, degrade gracefully and let UI continue with unknown relation state.
  if (
    result.error &&
    String(result.error.message || "").toLowerCase().includes("permission denied for table users")
  ) {
    return { data: null, error: null } as const;
  }

  return result;
}

export async function followUser(targetUserId: string): Promise<FollowActionResult> {
  if (isLocalBackend()) {
    try {
      await apiFetch("/follows/follow", {
        method: "POST",
        body: JSON.stringify({ targetId: targetUserId }),
      });
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  }
  const me = await getMyUserId();
  if (!me) return { error: new Error("No autenticado") };
  if (me === targetUserId)
    return { error: new Error("No puedes seguirte a ti mismo") };

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("is_public")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const status: FollowStatus = targetProfile?.is_public ? "accepted" : "pending";

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: me, followed_id: targetUserId, status });

  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("duplicate key")) {
      return {
        error: new Error("Ya tienes una solicitud pendiente o ya sigues a este usuario"),
      };
    }
    return { error: error as unknown as Error };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("nombre_completo, username, avatar_url")
    .eq("user_id", me)
    .maybeSingle();

  const display =
    actorProfile?.nombre_completo || actorProfile?.username || me.slice(0, 8);
  const notificationType = status === "pending" ? "follow_request" : "follow_accepted";
  const notificationData = {
    follower_id: me,
    display,
    username: actorProfile?.username || null,
    avatar_url: actorProfile?.avatar_url || null,
  };

  const { error: rpcError } = await supabase.rpc("create_notification", {
    p_recipient: targetUserId,
    p_actor: me,
    p_type: notificationType,
    p_entity_type: "follow",
    p_entity_id: `${me}:${targetUserId}`,
    p_data: notificationData,
  });

  if (rpcError) {
    const { error: insertError } = await supabase.from("notifications").insert({
      recipient_id: targetUserId,
      actor_id: me,
      type: notificationType,
      entity_type: "follow",
      entity_id: `${me}:${targetUserId}`,
      data: notificationData,
    });

    if (insertError) {
      return {
        error: null,
        followStatus: status,
        notificationPersisted: false,
        notificationErrorMessage: String(insertError.message || rpcError.message || "Error de persistencia de notificación"),
      };
    }

    return {
      error: null,
      followStatus: status,
      notificationPersisted: true,
    };
  }

  return {
    error: null,
    followStatus: status,
    notificationPersisted: true,
  };
}

export async function unfollowUser(targetUserId: string) {
  if (isLocalBackend()) {
    try {
      await apiFetch(`/follows/${targetUserId}`, { method: "DELETE" });
      return { error: null } as const;
    } catch (e: any) {
      return { error: e } as const;
    }
  }
  const me = await getMyUserId();
  if (!me) return { error: new Error("No autenticado") } as const;
  return supabase
    .from("follows")
    .delete()
    .eq("follower_id", me)
    .eq("followed_id", targetUserId);
}

export async function cancelRequest(targetUserId: string) {
  // same as unfollow for pending
  return unfollowUser(targetUserId);
}

export async function acceptFollow(followerId: string) {
  if (isLocalBackend()) {
    try {
      await apiFetch(`/follows/${followerId}/accept`, { method: "POST" });
      return { error: null } as const;
    } catch (e: any) {
      return { error: e } as const;
    }
  }
  const me = await getMyUserId();
  if (!me) return { error: new Error("No autenticado") } as const;
  return supabase
    .from("follows")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("followed_id", me)
    .eq("follower_id", followerId)
    .eq("status", "pending");
}

export async function rejectFollow(followerId: string) {
  if (isLocalBackend()) {
    try {
      await apiFetch(`/follows/${followerId}/reject`, { method: "DELETE" });
      return { error: null } as const;
    } catch (e: any) {
      return { error: e } as const;
    }
  }
  const me = await getMyUserId();
  if (!me) return { error: new Error("No autenticado") } as const;
  return supabase
    .from("follows")
    .delete()
    .eq("followed_id", me)
    .eq("follower_id", followerId)
    .eq("status", "pending");
}

export async function getFollowers(userId: string) {
  if (isLocalBackend()) {
    try {
      const rows = await apiFetch(
        `/follows/followers?userId=${encodeURIComponent(userId)}`,
      );
      return { data: rows, error: null } as const;
    } catch (e: any) {
      return { data: null, error: e } as const;
    }
  }
  return supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("followed_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
}

export async function getFollowing(userId: string) {
  if (isLocalBackend()) {
    try {
      const rows = await apiFetch(
        `/follows/following?userId=${encodeURIComponent(userId)}`,
      );
      return { data: rows, error: null } as const;
    } catch (e: any) {
      return { data: null, error: e } as const;
    }
  }
  return supabase
    .from("follows")
    .select("followed_id, created_at")
    .eq("follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
}

export async function getPendingRequestsForMe() {
  if (isLocalBackend()) {
    try {
      const me = await getMyUserId();
      if (!me) return { data: [], error: new Error("No autenticado") } as const;
      const follows = (await apiFetch("/follows/pending")) as Array<{
        follower_id: string;
        created_at: string;
      }>;
      const ids = follows.map((f) => f.follower_id);
      if (ids.length === 0) return { data: [], error: null } as const;
      const profiles = (await apiFetch("/profiles/batch", {
        method: "POST",
        body: JSON.stringify({ ids }),
      })) as Array<any>;
      const result = follows.map((f) => ({
        follower_id: f.follower_id,
        created_at: f.created_at,
        follower:
          profiles.find((p: any) => p.user_id === f.follower_id) || null,
      }));
      return { data: result, error: null } as const;
    } catch (e: any) {
      return { data: [], error: e } as const;
    }
  }
  const me = await getMyUserId();
  if (!me) return { data: [], error: new Error("No autenticado") } as const;
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("followed_id", me)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (followsError || !follows)
    return { data: [], error: followsError } as const;
  const followerIds = follows.map((f) => f.follower_id);
  if (followerIds.length === 0) return { data: [], error: null } as const;
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, nombre_completo, avatar_url, username")
    .in("user_id", followerIds);
  if (profilesError) return { data: [], error: profilesError } as const;
  const result = follows.map((f) => ({
    follower_id: f.follower_id,
    created_at: f.created_at,
    follower: profiles?.find((p) => p.user_id === f.follower_id) || null,
  }));
  return { data: result, error: null } as const;
}

// Counts
export async function getFollowersCount(userId: string) {
  if (isLocalBackend()) {
    try {
      const rows = (await apiFetch(
        `/follows/followers?userId=${encodeURIComponent(userId)}`,
      )) as Array<any>;
      return { count: rows?.length || 0 } as any;
    } catch {
      return { count: 0 } as any;
    }
  }
  return supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("followed_id", userId)
    .eq("status", "accepted");
}

export async function getFollowingCount(userId: string) {
  if (isLocalBackend()) {
    try {
      const rows = (await apiFetch(
        `/follows/following?userId=${encodeURIComponent(userId)}`,
      )) as Array<any>;
      return { count: rows?.length || 0 } as any;
    } catch {
      return { count: 0 } as any;
    }
  }
  return supabase
    .from("follows")
    .select("followed_id", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("status", "accepted");
}

// Lists with optional joined profiles (subject to RLS; may be null)
export async function getFollowersWithProfiles(
  userId: string,
  from = 0,
  to = 49,
) {
  if (isLocalBackend()) {
    try {
      const rows = (await apiFetch(
        `/follows/followers?userId=${encodeURIComponent(userId)}`,
      )) as Array<{ follower_id: string; created_at: string }>;
      const sliced = rows.slice(from, to + 1);
      const ids = sliced.map((r) => r.follower_id);
      const profiles = ids.length
        ? ((await apiFetch("/profiles/batch", {
            method: "POST",
            body: JSON.stringify({ ids }),
          })) as Array<any>)
        : [];
      const result = sliced.map((f) => ({
        follower_id: f.follower_id,
        created_at: f.created_at,
        follower:
          profiles.find((p: any) => p.user_id === f.follower_id) || null,
      }));
      return { data: result, error: null } as const;
    } catch (e: any) {
      return { data: [], error: e } as const;
    }
  }
  // Supabase path
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("followed_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (followsError || !follows)
    return { data: [], error: followsError } as const;
  const followerIds = follows.map((f) => f.follower_id);
  if (followerIds.length === 0) return { data: [], error: null } as const;
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, nombre_completo, avatar_url, username")
    .in("user_id", followerIds);
  if (profilesError) return { data: [], error: profilesError } as const;
  const result = follows.map((f) => ({
    follower_id: f.follower_id,
    created_at: f.created_at,
    follower: profiles?.find((p) => p.user_id === f.follower_id) || null,
  }));
  return { data: result, error: null } as const;
}

export async function getFollowingWithProfiles(
  userId: string,
  from = 0,
  to = 49,
) {
  if (isLocalBackend()) {
    try {
      const rows = (await apiFetch(
        `/follows/following?userId=${encodeURIComponent(userId)}`,
      )) as Array<{
        following_id?: string;
        followed_id?: string;
        created_at: string;
      }>;
      // Local devuelve following_id; normalizamos a followed_id para consumidor
      const normalized = rows.map((r) => ({
        followed_id: (r as any).following_id || (r as any).followed_id,
        created_at: r.created_at,
      }));
      const sliced = normalized.slice(from, to + 1);
      const ids = sliced.map((r) => r.followed_id);
      const profiles = ids.length
        ? ((await apiFetch("/profiles/batch", {
            method: "POST",
            body: JSON.stringify({ ids }),
          })) as Array<any>)
        : [];
      const result = sliced.map((f) => ({
        followed_id: f.followed_id,
        created_at: f.created_at,
        followed:
          profiles.find((p: any) => p.user_id === f.followed_id) || null,
      }));
      return { data: result, error: null } as const;
    } catch (e: any) {
      return { data: [], error: e } as const;
    }
  }
  // Supabase path
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("followed_id, created_at")
    .eq("follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (followsError || !follows)
    return { data: [], error: followsError } as const;
  const followedIds = follows.map((f) => f.followed_id);
  if (followedIds.length === 0) return { data: [], error: null } as const;
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, nombre_completo, avatar_url, username")
    .in("user_id", followedIds);
  if (profilesError) return { data: [], error: profilesError } as const;
  const result = follows.map((f) => ({
    followed_id: f.followed_id,
    created_at: f.created_at,
    followed: profiles?.find((p) => p.user_id === f.followed_id) || null,
  }));
  return { data: result, error: null } as const;
}
