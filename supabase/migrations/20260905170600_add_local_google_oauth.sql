-- Local password maintenance and Google OAuth state. This migration stays
-- additive so installations that already applied local registration can move on.
begin;

alter table public.app_users add column google_subject text;
create unique index app_users_google_subject_key
  on public.app_users(google_subject) where google_subject is not null;

create table public.app_oauth_states (
  state_hash text primary key,
  browser_hash text not null,
  nonce text not null,
  intent text not null check (intent in ('login', 'signup')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index app_oauth_states_expiry_idx on public.app_oauth_states(expires_at);

create table public.app_oauth_tickets (
  token_hash text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  intent text not null check (intent in ('login', 'signup')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index app_oauth_tickets_expiry_idx on public.app_oauth_tickets(expires_at);

alter table public.app_oauth_states enable row level security;
alter table public.app_oauth_tickets enable row level security;
revoke all on table public.app_oauth_states, public.app_oauth_tickets from public, anon, authenticated;
grant all on table public.app_oauth_states, public.app_oauth_tickets to service_role;

create or replace function public.change_local_password(p_user_id uuid, p_password_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.app_users where id = p_user_id for update;
  if not found then raise exception 'user_not_found'; end if;
  update public.app_users set password_hash = p_password_hash, password_reset_required = false,
    password_reset_token_hash = null, password_reset_expires_at = null, updated_at = now()
  where id = p_user_id;
  update public.app_sessions set revoked_at = now() where user_id = p_user_id and revoked_at is null;
  return true;
end;
$$;
revoke all on function public.change_local_password(uuid, text) from public, anon, authenticated;
grant execute on function public.change_local_password(uuid, text) to service_role;

create or replace function public.upsert_local_google_identity(
  p_email text, p_google_subject text, p_user_metadata jsonb, p_intent text
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  target public.app_users%rowtype;
  user_id_value uuid := gen_random_uuid();
  email_value text := lower(trim(p_email));
  display_value text := trim(coalesce(p_user_metadata ->> 'name', ''));
begin
  if p_intent not in ('login', 'signup') then raise exception 'invalid_oauth_intent'; end if;
  perform pg_advisory_xact_lock(hashtextextended(email_value, 0));
  select * into target from public.app_users where lower(email) = email_value for update;
  if found then
    if target.google_subject is not null and target.google_subject <> p_google_subject then
      raise exception 'google_identity_conflict';
    end if;
    update public.app_users set google_subject = p_google_subject,
      email_verified_at = coalesce(email_verified_at, now()),
      account_status = case when account_status = 'pendiente_email' then 'pendiente_aprobacion' else account_status end,
      app_metadata = app_metadata || jsonb_build_object('provider', 'google', 'providers', jsonb_build_array('google'),
        'account_status', case when account_status = 'pendiente_email' then 'pendiente_aprobacion' else account_status end),
      user_metadata = user_metadata || p_user_metadata, updated_at = now()
    where id = target.id returning * into target;
    update public.profiles set email_verified = true, account_status = target.account_status, updated_at = now()
    where user_id = target.id;
    return jsonb_build_object('user_id', target.id, 'status', target.account_status, 'is_new', false);
  end if;

  if p_intent = 'login' then return jsonb_build_object('account_missing', true); end if;
  if display_value = '' then display_value := split_part(email_value, '@', 1); end if;
  insert into public.app_users (id, email, password_reset_required, email_verified_at, account_status,
    google_subject, app_metadata, user_metadata)
  values (user_id_value, email_value, false, now(), 'pendiente_aprobacion', p_google_subject,
    jsonb_build_object('provider', 'google', 'providers', jsonb_build_array('google'),
      'role', 'user', 'account_status', 'pendiente_aprobacion'), p_user_metadata)
  returning * into target;
  insert into public.profiles (user_id, email, nombre_completo, username, account_status,
    account_classification, email_verified)
  values (target.id, email_value, display_value, 'scout_' || replace(target.id::text, '-', ''),
    'pendiente_aprobacion', 'scout', true);
  return jsonb_build_object('user_id', target.id, 'status', target.account_status, 'is_new', true);
end;
$$;
revoke all on function public.upsert_local_google_identity(text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.upsert_local_google_identity(text, text, jsonb, text) to service_role;

create or replace function public.complete_local_google_registration(p_ticket_hash text, p_profile jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  ticket public.app_oauth_tickets%rowtype;
  target public.app_users%rowtype;
  request_row public.registration_requests%rowtype;
  display_value text := trim(concat_ws(' ', p_profile ->> 'nombre', p_profile ->> 'apellido'));
begin
  delete from public.app_oauth_tickets where token_hash = p_ticket_hash
    and intent = 'signup' and expires_at > now() returning * into ticket;
  if not found then raise exception 'oauth_ticket_invalid'; end if;
  select * into target from public.app_users where id = ticket.user_id for update;
  if not found then raise exception 'oauth_user_not_found'; end if;

  update public.app_users set user_metadata = user_metadata || jsonb_build_object(
    'nombre', p_profile ->> 'nombre', 'apellido', p_profile ->> 'apellido',
    'nombre_completo', display_value, 'profile_complete', true), updated_at = now()
  where id = target.id;
  update public.profiles set nombre_completo = display_value, account_classification = 'scout', updated_at = now()
  where user_id = target.id;

  select * into request_row from public.registration_requests
  where auth_user_id = target.id or lower(email) = lower(target.email) for update;
  if found and request_row.status = 'pending' then
    update public.registration_requests set auth_user_id = target.id, nombre = p_profile ->> 'nombre',
      apellido = p_profile ->> 'apellido', grupo_scout = p_profile ->> 'grupo_scout',
      rama = p_profile ->> 'rama', nombre_scout_relacionado = p_profile ->> 'nombre_scout_relacionado',
      provider = 'google', provider_id = target.google_subject, requested_at = now()
    where id = request_row.id returning * into request_row;
  elsif not found then
    insert into public.registration_requests (auth_user_id, email, nombre, apellido, grupo_scout,
      rama, nombre_scout_relacionado, tipo_relacion, provider, provider_id, status, requested_at, metadata)
    values (target.id, target.email, p_profile ->> 'nombre', p_profile ->> 'apellido', p_profile ->> 'grupo_scout',
      p_profile ->> 'rama', p_profile ->> 'nombre_scout_relacionado', 'scout', 'google', target.google_subject,
      'pending', now(), '{}'::jsonb) returning * into request_row;
  end if;
  return jsonb_build_object('accepted', true, 'status', request_row.status, 'user_id', target.id);
end;
$$;
revoke all on function public.complete_local_google_registration(text, jsonb) from public, anon, authenticated;
grant execute on function public.complete_local_google_registration(text, jsonb) to service_role;

commit;
