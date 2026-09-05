-- Strict auth migration boundary.
-- This migration is additive: auth.users remains the source of historical
-- identity and is never deleted or altered. Existing users need a local
-- password reset because Supabase Auth password hashes are not portable.

begin;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text,
  password_hash text,
  password_reset_required boolean not null default true,
  password_reset_token_hash text,
  password_reset_expires_at timestamptz,
  email_verified_at timestamptz,
  account_status text,
  app_metadata jsonb not null default '{}'::jsonb,
  user_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_not_blank check (email is null or length(trim(email)) > 0),
  constraint app_users_password_reset_pair check (
    (password_reset_token_hash is null and password_reset_expires_at is null)
    or (password_reset_token_hash is not null and password_reset_expires_at is not null)
  )
);

create unique index if not exists app_users_email_lower_key
  on public.app_users (lower(email))
  where email is not null;
create unique index if not exists app_users_password_reset_token_hash_key
  on public.app_users (password_reset_token_hash)
  where password_reset_token_hash is not null;

create table if not exists public.app_sessions (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  user_agent text,
  ip_address text
);

create index if not exists app_sessions_user_active_idx
  on public.app_sessions (user_id, expires_at)
  where revoked_at is null;
create index if not exists app_sessions_expiry_idx
  on public.app_sessions (expires_at)
  where revoked_at is null;

-- Backfill only when Supabase Auth exists. Dynamic SQL keeps this migration
-- auditable and installable in environments where auth.users is absent.
do $$
begin
  if to_regclass('auth.users') is not null then
    execute $sql$
      insert into public.app_users (
        id, email, password_reset_required, email_verified_at,
        app_metadata, user_metadata, created_at, updated_at
      )
      select
        u.id,
        u.email,
        true,
        u.email_confirmed_at,
        coalesce(u.raw_app_meta_data, '{}'::jsonb),
        coalesce(u.raw_user_meta_data, '{}'::jsonb),
        coalesce(u.created_at, now()),
        now()
      from auth.users u
      on conflict (id) do update set
        email = excluded.email,
        email_verified_at = excluded.email_verified_at,
        app_metadata = excluded.app_metadata,
        user_metadata = excluded.user_metadata,
        updated_at = now(),
        password_reset_required = case
          when public.app_users.password_hash is null then true
          else public.app_users.password_reset_required
        end
    $sql$;

    if to_regclass('public.profiles') is not null then
      execute $sql$
        update public.app_users au
        set account_status = p.account_status,
            updated_at = now()
        from public.profiles p
        where p.user_id = au.id
      $sql$;
    end if;
  end if;
end
$$;

-- These tables are backend-owned. The browser must never read or mutate them.
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
revoke all on table public.app_users, public.app_sessions from public, anon, authenticated;
grant all on table public.app_users, public.app_sessions to service_role;

comment on table public.app_users is
  'Local auth identities. UUIDs are backfilled from auth.users; no auth.users row is deleted.';
comment on column public.app_users.password_reset_required is
  'Existing Supabase accounts are true until the user establishes a local bcrypt password.';
comment on table public.app_sessions is
  'Opaque bearer token hashes and revocation state for local JWT sessions.';

commit;
