-- Followers system: table, trigger and RLS policies

-- 1) Create enum follow_status if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'follow_status') then
    create type follow_status as enum ('pending', 'accepted', 'blocked');
  end if;
end $$;

-- 2) Create follows table (composite PK avoids uuid extension requirements)
create table if not exists follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  status follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (follower_id, followed_id)
);

create index if not exists idx_follows_followed_status on follows (followed_id, status);
create index if not exists idx_follows_follower on follows (follower_id);

-- 3) Trigger: prevent self-follow and auto-accept if followed profile is public
create or replace function auto_accept_public_follow()
returns trigger as $$
begin
  if new.follower_id = new.followed_id then
    raise exception 'No puedes seguirte a ti mismo';
  end if;

  if exists (
    select 1 from profiles p
    where p.user_id = new.followed_id and coalesce(p.is_public, false) = true
  ) then
    new.status := 'accepted';
    new.accepted_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_accept_public_follow on follows;
create trigger trg_auto_accept_public_follow
before insert on follows
for each row execute function auto_accept_public_follow();

-- 4) Enable RLS and policies on follows
alter table follows enable row level security;

-- Read: follower or followed can read the relationship
drop policy if exists read_own_follows on follows;
create policy read_own_follows
on public.follows for select
to authenticated
using ( follower_id = auth.uid() or followed_id = auth.uid() );

-- Insert: only the follower can create the request; cannot follow self (enforced by trigger)
drop policy if exists create_follow_request on follows;
create policy create_follow_request
on public.follows for insert
to authenticated
with check ( follower_id = auth.uid() );

-- Update: only the followed user can update (accept/reject)
drop policy if exists update_follow_status_by_followed on follows;
create policy update_follow_status_by_followed
on public.follows for update
to authenticated
using ( followed_id = auth.uid() )
with check ( followed_id = auth.uid() );

-- Delete: either side can delete (unfollow or cancel request)
drop policy if exists delete_follow_by_involved on follows;
create policy delete_follow_by_involved
on public.follows for delete
to authenticated
using ( follower_id = auth.uid() or followed_id = auth.uid() );

-- 5) Profiles read policy to protect private profiles
-- Ensure RLS is enabled on profiles
alter table profiles enable row level security;

-- Allow read if: owner, public profile, or accepted follower
drop policy if exists read_profiles_public_or_self_or_accepted_follower on profiles;
create policy read_profiles_public_or_self_or_accepted_follower
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or coalesce(is_public, false) = true
  or exists (
    select 1 from public.follows f
    where f.followed_id = profiles.user_id
      and f.follower_id = auth.uid()
      and f.status = 'accepted'
  )
);

-- Optional: allow minimal public read if desired (commented out)
-- create policy if not exists read_profiles_public_anonymous
-- on profiles for select
-- to anon
-- using ( coalesce(is_public, false) = true );
