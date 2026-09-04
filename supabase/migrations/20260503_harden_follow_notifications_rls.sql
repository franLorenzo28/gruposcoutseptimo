-- Harden follow + notification flow for cross-device reliability.
-- Goal: ensure pending follow requests are visible and notification rows can be read/updated by recipients.

alter table if exists public.follows enable row level security;
alter table if exists public.notifications enable row level security;

-- Follows policies (idempotent reset to expected behavior)
drop policy if exists read_own_follows on public.follows;
create policy read_own_follows
on public.follows for select
to authenticated
using (follower_id = auth.uid() or followed_id = auth.uid());

drop policy if exists create_follow_request on public.follows;
create policy create_follow_request
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists update_follow_status_by_followed on public.follows;
create policy update_follow_status_by_followed
on public.follows for update
to authenticated
using (followed_id = auth.uid())
with check (followed_id = auth.uid());

drop policy if exists delete_follow_by_involved on public.follows;
create policy delete_follow_by_involved
on public.follows for delete
to authenticated
using (follower_id = auth.uid() or followed_id = auth.uid());

-- Notifications policies
-- Read/update only your own inbox rows.
-- Insert allowed by actor OR recipient because some app flows persist rows client-side for recipients.
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());

drop policy if exists notifications_insert_actor_or_recipient on public.notifications;
create policy notifications_insert_actor_or_recipient
on public.notifications for insert
to authenticated
with check (actor_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- Ensure realtime can emit row changes for follows/notifications.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'follows'
    ) then
      execute 'alter publication supabase_realtime add table public.follows';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;
  end if;
end
$$;