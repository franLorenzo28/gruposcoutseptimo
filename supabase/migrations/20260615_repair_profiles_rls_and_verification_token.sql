-- Hotfix: remove recursive profiles RLS and keep email token generation stable.

begin;

alter table if exists public.profiles enable row level security;

-- Fix ambiguous reference (output param expires_at vs table column expires_at).
create or replace function public.generate_verification_token(p_user_id uuid)
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_expires timestamptz;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'User not found';
  end if;

  update public.email_verification_tokens evt
  set verified_at = now()
  where evt.user_id = p_user_id
    and evt.verified_at is null
    and evt.expires_at > now();

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires := now() + interval '24 hours';

  insert into public.email_verification_tokens (user_id, token, expires_at)
  values (p_user_id, v_token, v_expires);

  return query
  select v_token, v_expires;
end;
$$;

revoke all on function public.generate_verification_token(uuid) from public;

-- Drop every current profiles policy to remove recursive expressions.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end;
$$;

-- Non-recursive, stable policies.
create policy profiles_select_authenticated
on public.profiles for select
to authenticated
using (true);

create policy profiles_select_public_anon
on public.profiles for select
to anon
using (coalesce(is_public, false) = true);

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy profiles_update_own
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy profiles_delete_own
on public.profiles for delete
to authenticated
using (user_id = auth.uid());

commit;
