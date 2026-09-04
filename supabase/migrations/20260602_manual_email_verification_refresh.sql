-- Manual email verification refresh (button-driven flow)
-- This migration keeps email verification custom and independent from automatic Supabase Auth confirmation.

-- Ensure crypto helpers are available
create extension if not exists pgcrypto with schema extensions;

-- Tokens table
create table if not exists public.email_verification_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_tokens_user_created
  on public.email_verification_tokens(user_id, created_at desc);

create index if not exists idx_email_verification_tokens_expires
  on public.email_verification_tokens(expires_at)
  where verified_at is null;

alter table public.email_verification_tokens enable row level security;

-- No direct reads/writes from anon/authenticated. Use RPC only.
revoke all on table public.email_verification_tokens from anon, authenticated;

-- Profile verification flag used by feature guards
alter table public.profiles
  add column if not exists email_verified boolean;

update public.profiles
set email_verified = coalesce(email_verified, false)
where email_verified is null;

alter table public.profiles
  alter column email_verified set default false;

alter table public.profiles
  alter column email_verified set not null;

-- Drop previous function signatures to avoid return-type conflicts (42P13)
drop function if exists public.generate_verification_token(uuid);
drop function if exists public.resend_verification_email();
drop function if exists public.verify_email_token(text);
drop function if exists public.is_email_verified(uuid);
drop function if exists public.cleanup_expired_tokens();

-- Generate a one-time token for a specific user.
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

  -- Invalidate currently active tokens for this user.
  update public.email_verification_tokens
  set verified_at = now()
  where user_id = p_user_id
    and verified_at is null
    and expires_at > now();

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires := now() + interval '24 hours';

  insert into public.email_verification_tokens (user_id, token, expires_at)
  values (p_user_id, v_token, v_expires);

  return query
  select v_token, v_expires;
end;
$$;

-- Logged user requests a new verification token/email.
create or replace function public.resend_verification_email()
returns table(token text, expires_at timestamptz, user_email text, email text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email
  into v_user_email
  from auth.users u
  where u.id = v_user_id;

  if v_user_email is null then
    raise exception 'Authenticated user email not found';
  end if;

  return query
  select t.token, t.expires_at, v_user_email, v_user_email
  from public.generate_verification_token(v_user_id) t;
end;
$$;

-- Verifies token and unlocks email-gated features.
create or replace function public.verify_email_token(p_token text)
returns table(success boolean, message text, verified_user_id uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.email_verification_tokens%rowtype;
begin
  if p_token is null or btrim(p_token) = '' then
    return query select false, 'Token requerido', null::uuid;
    return;
  end if;

  select *
  into v_row
  from public.email_verification_tokens
  where token = p_token
  for update;

  if not found then
    return query select false, 'Token invalido', null::uuid;
    return;
  end if;

  if v_row.verified_at is not null then
    return query select false, 'Token ya usado', v_row.user_id;
    return;
  end if;

  if v_row.expires_at < now() then
    update public.email_verification_tokens
    set verified_at = now()
    where id = v_row.id;

    return query select false, 'Token expirado', v_row.user_id;
    return;
  end if;

  update public.email_verification_tokens
  set verified_at = now()
  where id = v_row.id;

  update public.profiles
  set email_verified = true
  where user_id = v_row.user_id;

  return query select true, 'Email verificado correctamente', v_row.user_id;
end;
$$;

create or replace function public.is_email_verified(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select coalesce((select p.email_verified from public.profiles p where p.user_id = p_user_id), false)
$$;

create or replace function public.cleanup_expired_tokens()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_deleted integer;
begin
  delete from public.email_verification_tokens
  where expires_at < now() - interval '30 days';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.generate_verification_token(uuid) from public;
revoke all on function public.resend_verification_email() from public;
revoke all on function public.verify_email_token(text) from public;
revoke all on function public.is_email_verified(uuid) from public;
revoke all on function public.cleanup_expired_tokens() from public;

grant execute on function public.resend_verification_email() to authenticated;
grant execute on function public.verify_email_token(text) to anon, authenticated;
grant execute on function public.is_email_verified(uuid) to authenticated;
