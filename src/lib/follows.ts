import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";

export type FollowStatus = "pending" | "accepted" | "blocked";

export type FollowActionResult = {
  error: Error | null;
  followStatus?: FollowStatus;
  notificationPersisted?: boolean;
  notificationErrorMessage?: string;
};

const FOLLOW_RELATION_CACHE_KEY = "follow_relation_cache_v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getFollowCacheKey(followerId: string, followedId: string) {
  return `${followerId}:${followedId}`;
}

function readFollowRelationCache(followerId: string, followedId: string): FollowStatus | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(FOLLOW_RELATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, FollowStatus>;
    return parsed[getFollowCacheKey(followerId, followedId)] || null;
  } catch {
    return null;
  }
}

function writeFollowRelationCache(followerId: string, followedId: string, status: FollowStatus) {
  if (!canUseStorage()) return;
  try {
    const raw = window.localStorage.getItem(FOLLOW_RELATION_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, FollowStatus>) : {};
    parsed[getFollowCacheKey(followerId, followedId)] = status;
    window.localStorage.setItem(FOLLOW_RELATION_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Silencioso para no romper UX
  }
}

function clearFollowRelationCache(followerId: string, followedId: string) {
  if (!canUseStorage()) return;
  try {
    const raw = window.localStorage.getItem(FOLLOW_RELATION_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, FollowStatus>;
    delete parsed[getFollowCacheKey(followerId, followedId)];
    window.localStorage.setItem(FOLLOW_RELATION_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Silencioso para no romper UX
  }
}

function isUsersPermissionError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("permission denied for table users") || lower.includes("permission denied for table auth.users");
}

type FollowCountsRpcRow = {
  followers_count: number | string | null;
  following_count: number | string | null;
};

type PendingFollowRpcRow = {
  follower_id: string;
  created_at: string;
  nombre_completo: string | null;
  username: string | null;
  avatar_url: string | null;
};

async function getFollowCountsViaRpc(userId: string): Promise<{
  followers: number;
  following: number;
} | null> {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("get_follow_counts", {
    p_user_id: userId,
  });

  if (error || !data) return null;

  const row = data as FollowCountsRpcRow;
  const followers = Number(row.followers_count ?? 0);
  const following = Number(row.following_count ?? 0);

  return {
    followers: Number.isFinite(followers) ? followers : 0,
    following: Number.isFinite(following) ? following : 0,
  };
}

async function getPendingRequestsViaRpc(
  userId: string,
): Promise<
  Array<{
    follower_id: string;
    created_at: string;
    follower: {
      user_id: string;
      nombre_completo: string | null;
      avatar_url: string | null;
      username: string | null;
    };
  }> | null
> {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc(
    "list_pending_follow_requests",
    {
      p_user_id: userId,
      p_limit: 50,
    },
  );

  if (error || !Array.isArray(data)) return null;

  return (data as PendingFollowRpcRow[]).map((row) => ({
    follower_id: row.follower_id,
    created_at: row.created_at,
    follower: {
      user_id: row.follower_id,
      nombre_completo: row.nombre_completo,
      avatar_url: row.avatar_url,
      username: row.username,
    },
  }));
}

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
  const cachedStatus = readFollowRelationCache(me, withUserId);

  const result = await supabase
    .from("follows")
    .select("follower_id, followed_id, status, created_at, accepted_at")
    .eq("follower_id", me)
    .eq("followed_id", withUserId)
    .maybeSingle();

  if (!result.error && result.data?.status) {
    writeFollowRelationCache(me, withUserId, result.data.status as FollowStatus);
  }

  if (!result.error && !result.data) {
    clearFollowRelationCache(me, withUserId);
  }

  // Some RLS setups evaluate policies against tables the current role cannot read.
  // In that case, degrade gracefully and let UI continue with unknown relation state.
  if (result.error && isUsersPermissionError(String(result.error.message || ""))) {
    if (cachedStatus) {
      return {
        data: {
          follower_id: me,
          followed_id: withUserId,
          status: cachedStatus,
          created_at: new Date().toISOString(),
          accepted_at: cachedStatus === "accepted" ? new Date().toISOString() : null,
        },
        error: null,
      } as const;
    }
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
      const relationResult = await getFollowRelation(targetUserId);
      const resolvedStatus =
        (relationResult.data?.status as FollowStatus | undefined) ||
        readFollowRelationCache(me, targetUserId) ||
        "pending";
      writeFollowRelationCache(me, targetUserId, resolvedStatus);
      return {
        error: null,
        followStatus: resolvedStatus,
      };
    }
    return { error: error as unknown as Error };
  }

  writeFollowRelationCache(me, targetUserId, status);

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
  const result = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", me)
    .eq("followed_id", targetUserId);

  if (!result.error) {
    clearFollowRelationCache(me, targetUserId);
  }

  return result;
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

  const pendingFromRpc = await getPendingRequestsViaRpc(me);
  if (pendingFromRpc) {
    return { data: pendingFromRpc, error: null } as const;
  }

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

  const countsFromRpc = await getFollowCountsViaRpc(userId);
  if (countsFromRpc) {
    return { count: countsFromRpc.followers, error: null } as const;
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

  const countsFromRpc = await getFollowCountsViaRpc(userId);
  if (countsFromRpc) {
    return { count: countsFromRpc.following, error: null } as const;
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
