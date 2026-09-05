-- Transitional server-only commands. Fastify authorizes callers; service_role
-- executes these transactions until the repositories move to direct pg access.
begin;

alter table public.app_users
  add column email_verification_token_hash text,
  add column email_verification_expires_at timestamptz,
  add constraint app_users_verification_pair check (
    (email_verification_token_hash is null) = (email_verification_expires_at is null)
  );
create unique index app_users_verification_token_key
  on public.app_users(email_verification_token_hash)
  where email_verification_token_hash is not null;

-- Catch up identities created since the initial backfill without overwriting
-- any established local credential, verification or administrative decision.
insert into public.app_users (id, email, email_verified_at, app_metadata, user_metadata, account_status)
select u.id, u.email, u.email_confirmed_at, coalesce(u.raw_app_meta_data, '{}'::jsonb),
  coalesce(u.raw_user_meta_data, '{}'::jsonb), p.account_status
from auth.users u left join public.profiles p on p.user_id = u.id
on conflict (id) do nothing;

-- Supabase rollback can still create identities: the BEFORE trigger runs before
-- existing profile/notification triggers, whose FKs now target app_users.
create schema if not exists private;
create or replace function private.mirror_supabase_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_users (id, email, email_verified_at, app_metadata, user_metadata, account_status)
  values (new.id, new.email, new.email_confirmed_at, coalesce(new.raw_app_meta_data, '{}'::jsonb),
    coalesce(new.raw_user_meta_data, '{}'::jsonb),
    case when new.email_confirmed_at is null then 'pendiente_email' else 'pendiente_aprobacion' end)
  on conflict (id) do update set
    email_verified_at = coalesce(public.app_users.email_verified_at, excluded.email_verified_at),
    account_status = case when public.app_users.account_status = 'pendiente_email' and excluded.email_verified_at is not null
      then 'pendiente_aprobacion' else public.app_users.account_status end;
  return new;
end;
$$;
revoke all on function private.mirror_supabase_identity() from public, anon, authenticated;
create trigger before_local_identity_mirror
  before insert or update of email_confirmed_at on auth.users
  for each row execute function private.mirror_supabase_identity();

-- Only the registration path changes in this cut. Preserve each FK's delete,
-- update and deferrability behavior, and let validation fail on orphaned data.
do $$
declare fk record;
begin
  for fk in
    select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where contype = 'f' and confrelid = 'auth.users'::regclass
      and conrelid in ('public.profiles'::regclass, 'public.registration_requests'::regclass, 'public.notifications'::regclass)
  loop
    execute format('alter table %s drop constraint %I', fk.table_name, fk.conname);
    execute format('alter table %s add constraint %I %s', fk.table_name, fk.conname,
      replace(fk.definition, 'REFERENCES auth.users(', 'REFERENCES public.app_users('));
  end loop;
end;
$$;

create or replace function public.create_local_registration(
  p_email text, p_password_hash text, p_profile jsonb, p_token_hash text
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  user_id_value uuid := gen_random_uuid();
  request_id_value uuid;
  email_value text := lower(trim(p_email));
  display_value text := trim(concat_ws(' ', p_profile ->> 'nombre', p_profile ->> 'apellido'));
begin
  -- Serialize duplicate emails, including requests left by the legacy workflow.
  perform pg_advisory_xact_lock(hashtextextended(email_value, 0));
  if exists (select 1 from public.app_users where lower(email) = email_value)
    or exists (select 1 from public.registration_requests where lower(email) = email_value) then
    return jsonb_build_object('created', false);
  end if;

  insert into public.app_users (id, email, password_hash, password_reset_required, account_status,
    app_metadata, user_metadata, email_verification_token_hash, email_verification_expires_at)
  values (user_id_value, email_value, p_password_hash, false, 'pendiente_email',
    jsonb_build_object('provider', 'email', 'role', 'user', 'account_status', 'pendiente_email'),
    jsonb_build_object('nombre', p_profile ->> 'nombre', 'apellido', p_profile ->> 'apellido',
      'nombre_completo', display_value, 'profile_complete', true),
    p_token_hash, now() + interval '24 hours');

  insert into public.profiles (user_id, email, nombre_completo, username, account_status,
    account_classification, email_verified)
  values (user_id_value, email_value, display_value,
    'scout_' || replace(user_id_value::text, '-', ''), 'pendiente_email', 'scout', false);

  insert into public.registration_requests (auth_user_id, email, nombre, apellido, grupo_scout,
    rama, nombre_scout_relacionado, tipo_relacion, provider, provider_id, status, requested_at, metadata)
  values (user_id_value, email_value, p_profile ->> 'nombre', p_profile ->> 'apellido', p_profile ->> 'grupo_scout',
    p_profile ->> 'rama', p_profile ->> 'nombre_scout_relacionado', 'scout', 'email', user_id_value::text,
    'pending', now(), '{}'::jsonb)
  returning id into request_id_value;

  return jsonb_build_object('created', true, 'user_id', user_id_value, 'request_id', request_id_value);
end;
$$;
revoke all on function public.create_local_registration(text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_local_registration(text, text, jsonb, text) to service_role;

create or replace function public.verify_local_email(p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target public.app_users%rowtype;
begin
  select * into target from public.app_users
  where email_verification_token_hash = p_token_hash for update;
  if not found or target.email_verification_expires_at <= now() then
    raise exception 'verification_token_invalid';
  end if;
  update public.app_users set email_verified_at = coalesce(email_verified_at, now()),
    email_verification_token_hash = null, email_verification_expires_at = null,
    account_status = case when account_status = 'pendiente_email' then 'pendiente_aprobacion' else account_status end,
    app_metadata = app_metadata || jsonb_build_object('account_status',
      case when account_status = 'pendiente_email' then 'pendiente_aprobacion' else account_status end),
    updated_at = now()
  where id = target.id returning * into target;
  update public.profiles set email_verified = true, account_status = target.account_status, updated_at = now()
  where user_id = target.id;
  return jsonb_build_object('success', true, 'userId', target.id, 'nextStatus', target.account_status);
end;
$$;
revoke all on function public.verify_local_email(text) from public, anon, authenticated;
grant execute on function public.verify_local_email(text) to service_role;

create or replace function public.review_local_registration(
  p_request_id uuid, p_action text, p_reviewer_id uuid, p_admin_notes text default null
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  target public.registration_requests%rowtype;
  next_status text := case when p_action = 'approve' then 'approved' else 'rejected' end;
  account_status_value text := case when p_action = 'approve' then 'activo' else 'rechazado' end;
begin
  if p_action is null or p_action not in ('approve', 'reject') then raise exception 'invalid_action'; end if;
  if not exists (select 1 from public.app_users where id = p_reviewer_id) then raise exception 'invalid_reviewer'; end if;
  select * into target from public.registration_requests where id = p_request_id for update;
  if not found then raise exception 'registration_not_found'; end if;
  if target.status = next_status then
    return jsonb_build_object('id', target.id, 'user_id', target.auth_user_id, 'status', target.status, 'idempotent', true);
  end if;
  if target.status <> 'pending' then raise exception 'already_reviewed'; end if;
  perform 1 from public.app_users where id = target.auth_user_id for update;
  if not found then raise exception 'registration_has_no_auth_user'; end if;
  if p_action = 'approve' and not exists (
    select 1 from public.app_users where id = target.auth_user_id and email_verified_at is not null
  ) then raise exception 'email_not_verified'; end if;

  update public.app_users set account_status = account_status_value,
    app_metadata = app_metadata || jsonb_build_object('account_status', account_status_value), updated_at = now()
  where id = target.auth_user_id;
  -- Backfilled legacy registrations may not have a profile yet.
  insert into public.profiles (user_id, email, nombre_completo, username, account_status, account_classification,
    email_verified, account_review_reason)
  select u.id, u.email, trim(concat_ws(' ', target.nombre, target.apellido)),
    'scout_' || replace(u.id::text, '-', ''), account_status_value, target.tipo_relacion,
    u.email_verified_at is not null, nullif(trim(p_admin_notes), '')
  from public.app_users u where u.id = target.auth_user_id
  on conflict (user_id) do update set account_status = excluded.account_status,
    email_verified = excluded.email_verified, account_review_reason = excluded.account_review_reason, updated_at = now();
  update public.registration_requests set status = next_status, reviewed_by = p_reviewer_id,
    reviewed_at = now(), admin_notes = nullif(trim(p_admin_notes), '') where id = target.id;
  if p_action = 'reject' then
    update public.app_sessions set revoked_at = now() where user_id = target.auth_user_id and revoked_at is null;
  end if;
  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
  values (target.auth_user_id, p_reviewer_id, 'message', 'registration_response', target.id,
    jsonb_build_object('kind', 'registration_response', 'approved', p_action = 'approve',
      'status', next_status, 'note', nullif(trim(p_admin_notes), '')), now());
  return jsonb_build_object('id', target.id, 'user_id', target.auth_user_id, 'status', next_status, 'idempotent', false);
end;
$$;
revoke all on function public.review_local_registration(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.review_local_registration(uuid, text, uuid, text) to service_role;

-- Consume the token and revoke sessions in the same transaction. Row locking
-- makes concurrent attempts single-use and rolls everything back on failure.
create or replace function public.reset_local_password(p_token_hash text, p_password_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare target public.app_users%rowtype;
begin
  select * into target from public.app_users where password_reset_token_hash = p_token_hash for update;
  if not found or target.password_reset_expires_at <= now() then raise exception 'password_reset_token_invalid'; end if;
  update public.app_users set password_hash = p_password_hash, password_reset_required = false,
    password_reset_token_hash = null, password_reset_expires_at = null, updated_at = now() where id = target.id;
  update public.app_sessions set revoked_at = now() where user_id = target.id and revoked_at is null;
  return true;
end;
$$;
revoke all on function public.reset_local_password(text, text) from public, anon, authenticated;
grant execute on function public.reset_local_password(text, text) to service_role;

commit;
