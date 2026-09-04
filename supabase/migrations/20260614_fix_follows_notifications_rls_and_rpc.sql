-- Fix follows + notifications reliability after legacy RLS regressions.
-- Goals:
-- 1) Remove policies that reference auth.users directly (causing permission errors).
-- 2) Restore consistent read/write behavior for follow requests + notifications.
-- 3) Provide SECURITY DEFINER RPCs for stable counters and pending requests.

begin;

alter table if exists public.follows enable row level security;
alter table if exists public.notifications enable row level security;

-- Admin helper based on public.profiles.role to avoid direct reads on auth.users in RLS expressions.
create or replace function public.is_admin_from_profile()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'mod')
  );
$$;

revoke all on function public.is_admin_from_profile() from public;
grant execute on function public.is_admin_from_profile() to authenticated;

-- Reset follows policies to a coherent, idempotent set.
drop policy if exists "Admin can view all follows" on public.follows;
drop policy if exists read_own_follows on public.follows;
drop policy if exists create_follow_request on public.follows;
drop policy if exists update_follow_status_by_followed on public.follows;
drop policy if exists delete_follow_by_involved on public.follows;

drop policy if exists follows_select_safe on public.follows;
create policy follows_select_safe
on public.follows for select
to authenticated
using (
  follower_id = auth.uid()
  or followed_id = auth.uid()
  or (
    status = 'accepted'
    and exists (
      select 1
      from public.profiles p
      where p.user_id = follows.followed_id
        and coalesce(p.is_public, false) = true
    )
  )
  or public.is_admin_from_profile()
);

drop policy if exists follows_insert_safe on public.follows;
create policy follows_insert_safe
on public.follows for insert
to authenticated
with check (
  follower_id = auth.uid()
  and follower_id <> followed_id
);

drop policy if exists follows_update_safe on public.follows;
create policy follows_update_safe
on public.follows for update
to authenticated
using (
  followed_id = auth.uid()
  or public.is_admin_from_profile()
)
with check (
  followed_id = auth.uid()
  or public.is_admin_from_profile()
);

drop policy if exists follows_delete_safe on public.follows;
create policy follows_delete_safe
on public.follows for delete
to authenticated
using (
  follower_id = auth.uid()
  or followed_id = auth.uid()
  or public.is_admin_from_profile()
);

-- Reset notifications policies.
drop policy if exists "Admin can view all notifications" on public.notifications;
drop policy if exists notifications_read_own on public.notifications;
drop policy if exists notifications_insert_actor_or_recipient on public.notifications;
drop policy if exists notifications_update_own on public.notifications;

drop policy if exists notifications_select_safe on public.notifications;
create policy notifications_select_safe
on public.notifications for select
to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin_from_profile()
);

drop policy if exists notifications_insert_safe on public.notifications;
create policy notifications_insert_safe
on public.notifications for insert
to authenticated
with check (
  actor_id = auth.uid()
  or recipient_id = auth.uid()
  or public.is_admin_from_profile()
);

drop policy if exists notifications_update_safe on public.notifications;
create policy notifications_update_safe
on public.notifications for update
to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin_from_profile()
)
with check (
  recipient_id = auth.uid()
  or public.is_admin_from_profile()
);

drop policy if exists notifications_delete_safe on public.notifications;
create policy notifications_delete_safe
on public.notifications for delete
to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin_from_profile()
);

-- Stable counters regardless of policy churn.
create or replace function public.get_follow_counts(p_user_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_followers integer := 0;
  v_following integer := 0;
  v_is_public boolean := false;
  v_can_view boolean := false;
begin
  if auth.uid() is null then
    return jsonb_build_object('followers_count', 0, 'following_count', 0);
  end if;

  select coalesce(p.is_public, false)
  into v_is_public
  from public.profiles p
  where p.user_id = p_user_id;

  v_can_view :=
    auth.uid() = p_user_id
    or v_is_public
    or public.is_admin_from_profile()
    or exists (
      select 1
      from public.follows f
      where f.follower_id = auth.uid()
        and f.followed_id = p_user_id
        and f.status = 'accepted'
    );

  if not v_can_view then
    return jsonb_build_object('followers_count', 0, 'following_count', 0);
  end if;

  select count(*)::integer
  into v_followers
  from public.follows f
  where f.followed_id = p_user_id
    and f.status = 'accepted';

  select count(*)::integer
  into v_following
  from public.follows f
  where f.follower_id = p_user_id
    and f.status = 'accepted';

  return jsonb_build_object(
    'followers_count', coalesce(v_followers, 0),
    'following_count', coalesce(v_following, 0)
  );
end;
$$;

revoke all on function public.get_follow_counts(uuid) from public;
grant execute on function public.get_follow_counts(uuid) to authenticated;

-- Stable pending list for profile + bell fallback.
create or replace function public.list_pending_follow_requests(
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  follower_id uuid,
  created_at timestamptz,
  nombre_completo text,
  username text,
  avatar_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    f.follower_id,
    f.created_at,
    p.nombre_completo,
    p.username,
    p.avatar_url
  from public.follows f
  left join public.profiles p on p.user_id = f.follower_id
  where f.followed_id = p_user_id
    and f.status = 'pending'
    and (
      auth.uid() = p_user_id
      or public.is_admin_from_profile()
    )
  order by f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

revoke all on function public.list_pending_follow_requests(uuid, integer) from public;
grant execute on function public.list_pending_follow_requests(uuid, integer) to authenticated;

commit;
