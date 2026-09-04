begin;

create table if not exists public.rama_broadcast_messages (
  id uuid primary key default gen_random_uuid(),
  rama text not null check (rama in ('lobatos', 'tropa', 'pioneros', 'rover')),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_rama_broadcast_messages_rama_created_at
  on public.rama_broadcast_messages (rama, created_at desc);

alter table public.rama_broadcast_messages enable row level security;

drop policy if exists "rama broadcast select authenticated" on public.rama_broadcast_messages;
create policy "rama broadcast select authenticated"
  on public.rama_broadcast_messages
  for select
  to authenticated
  using (true);

drop policy if exists "rama broadcast insert own author" on public.rama_broadcast_messages;
create policy "rama broadcast insert own author"
  on public.rama_broadcast_messages
  for insert
  to authenticated
  with check (auth.uid() = author_id);

commit;
