begin;

-- Existing approved accounts keep their current internal access. New accounts
-- are public until an administrator explicitly grants access.
alter table public.profiles add column if not exists internal_access boolean not null default false;
alter table public.profiles add column if not exists internal_unit text;
alter table public.profiles add constraint profiles_internal_unit_check
  check (internal_unit is null or internal_unit in ('lobatos', 'tropa', 'pioneros', 'rover'));
update public.profiles set internal_access = true
where account_status = 'activo' and coalesce(account_classification, '') <> 'publico';

create or replace function private.is_active_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.account_status = 'activo' and p.internal_access = true
  );
$$;
revoke all on function private.is_active_member() from public, anon;
grant execute on function private.is_active_member() to authenticated, service_role;

-- Older read policies allowed every authenticated account to see unit content.
do $$
begin
  if to_regclass('public.rama_broadcast_messages') is not null then
    execute 'drop policy if exists rama_broadcast_select_internal on public.rama_broadcast_messages';
    execute 'create policy rama_broadcast_select_internal on public.rama_broadcast_messages
      as restrictive for select to authenticated using (private.is_active_member())';
  end if;
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists rama_storage_select_internal on storage.objects';
    execute 'create policy rama_storage_select_internal on storage.objects
      as restrictive for select to authenticated
      using (bucket_id <> ''rama-documentos'' or private.is_active_member())';
  end if;
end
$$;

-- Group and social data belong to the internal platform even when an older
-- permissive policy would otherwise admit any authenticated account.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'groups', 'group_members', 'follows', 'conversations',
    'conversation_participants', 'messages', 'notifications'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', table_name || '_internal_only', table_name);
      execute format('create policy %I on public.%I as restrictive for all to authenticated
        using (private.is_active_member()) with check (private.is_active_member())',
        table_name || '_internal_only', table_name);
    end if;
  end loop;
end
$$;

create or replace function public.create_or_get_conversation(other_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  my_id uuid := auth.uid();
  conv_id uuid;
begin
  if other_user_id is null or my_id is null or other_user_id = my_id
    or not private.is_active_member()
    or not exists (
      select 1 from public.profiles p where p.user_id = other_user_id
        and p.account_status = 'activo' and p.internal_access = true
    ) then
    raise exception 'internal_member_required';
  end if;

  select c.id into conv_id from public.conversations c
  where exists (select 1 from public.conversation_participants p1
    where p1.conversation_id = c.id and p1.user_id = my_id)
    and exists (select 1 from public.conversation_participants p2
    where p2.conversation_id = c.id and p2.user_id = other_user_id)
  limit 1;
  if conv_id is not null then return conv_id; end if;

  insert into public.conversations default values returning id into conv_id;
  insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, my_id) on conflict do nothing;
  insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, other_user_id) on conflict do nothing;
  return conv_id;
end;
$$;
revoke all on function public.create_or_get_conversation(uuid) from public, anon;
grant execute on function public.create_or_get_conversation(uuid) to authenticated, service_role;

-- The public sign-up path deliberately creates no registration request.
create or replace function public.create_local_public_registration(
  p_email text, p_password_hash text, p_name text, p_token_hash text
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  user_id_value uuid := gen_random_uuid();
  email_value text := lower(trim(p_email));
begin
  perform pg_advisory_xact_lock(hashtextextended(email_value, 0));
  if exists (select 1 from public.app_users where lower(email) = email_value)
    or exists (select 1 from public.registration_requests where lower(email) = email_value) then
    return jsonb_build_object('created', false);
  end if;

  insert into public.app_users (id, email, password_hash, password_reset_required,
    account_status, app_metadata, user_metadata,
    email_verification_token_hash, email_verification_expires_at)
  values (user_id_value, email_value, p_password_hash, false, 'pendiente_email',
    jsonb_build_object('provider', 'email', 'role', 'user', 'account_status', 'pendiente_email'),
    jsonb_build_object('nombre_completo', trim(p_name), 'profile_complete', true),
    p_token_hash, now() + interval '24 hours');

  insert into public.profiles (user_id, email, nombre_completo, username,
    account_status, account_classification, email_verified, internal_access)
  values (user_id_value, email_value, trim(p_name),
    'scout_' || left(replace(user_id_value::text, '-', ''), 24),
    'pendiente_email', 'publico', false, false);

  return jsonb_build_object('created', true, 'user_id', user_id_value);
end;
$$;
revoke all on function public.create_local_public_registration(text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_local_public_registration(text, text, text, text) to service_role;

create or replace function public.verify_local_email(p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target public.app_users%rowtype;
declare next_status text;
begin
  select * into target from public.app_users
  where email_verification_token_hash = p_token_hash for update;
  if not found or target.email_verification_expires_at <= now() then
    raise exception 'verification_token_invalid';
  end if;
  select case when account_classification = 'publico' then 'activo'
    else 'pendiente_aprobacion' end into next_status
  from public.profiles where user_id = target.id;
  if next_status is null then raise exception 'profile_not_found'; end if;
  update public.app_users set email_verified_at = coalesce(email_verified_at, now()),
    email_verification_token_hash = null, email_verification_expires_at = null,
    account_status = case when account_status = 'pendiente_email' then next_status else account_status end,
    app_metadata = app_metadata || jsonb_build_object('account_status',
      case when account_status = 'pendiente_email' then next_status else account_status end),
    updated_at = now()
  where id = target.id returning * into target;
  update public.profiles set email_verified = true, account_status = target.account_status, updated_at = now()
  where user_id = target.id;
  return jsonb_build_object('success', true, 'userId', target.id, 'nextStatus', target.account_status);
end;
$$;
revoke all on function public.verify_local_email(text) from public, anon, authenticated;
grant execute on function public.verify_local_email(text) to service_role;

-- Supabase Auth creates the public profile on sign-up. Only the server-side
-- metadata marker can make it public; it never grants internal access.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  display_name text;
  classification text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nombre_completo', '')), '');
  if display_name is null then display_name := split_part(coalesce(new.email, 'Visitante'), '@', 1); end if;
  classification := case when new.raw_user_meta_data ->> 'account_kind' = 'publico'
    then 'publico' else nullif(new.raw_user_meta_data ->> 'tipo_relacion', '') end;
  insert into public.profiles (user_id, email, nombre_completo, username,
    account_status, account_classification, email_verified, internal_access)
  values (new.id, new.email, display_name,
    'scout_' || left(replace(new.id::text, '-', ''), 24),
    case when new.email_confirmed_at is not null and classification = 'publico'
      then 'activo' when new.email_confirmed_at is not null then 'pendiente_aprobacion'
      else 'pendiente_email' end,
    classification, new.email_confirmed_at is not null, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.sync_profile_status_on_email_confirm()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set
      account_status = case when account_status in ('', 'pendiente_email') or account_status is null
        then case when account_classification = 'publico' then 'activo' else 'pendiente_aprobacion' end
        else account_status end,
      email_verified = true, updated_at = now()
    where user_id = new.id;
  end if;
  return new;
end;
$$;

-- Public registrations are ordinary accounts, not requests for internal access.
create or replace function public.notify_admins_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  display_name text;
  signup_status text;
begin
  if new.raw_user_meta_data ->> 'account_kind' = 'publico' then return new; end if;
  display_name := trim(concat_ws(' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));
  if display_name = '' then display_name := coalesce(new.email, 'Nuevo usuario'); end if;
  signup_status := case when new.email_confirmed_at is null then 'pendiente_email' else 'pending' end;
  insert into public.notifications (
    recipient_id, actor_id, type, entity_type, entity_id, data, created_at
  )
  select reviewer.id, new.id, 'message', 'admin_request', new.id,
    jsonb_build_object(
      'kind', 'user_registration_request', 'user_id', new.id,
      'display', display_name, 'email', new.email,
      'tipo_relacion', nullif(new.raw_user_meta_data ->> 'tipo_relacion', ''),
      'rama', nullif(new.raw_user_meta_data ->> 'rama', ''),
      'nombre_scout_relacionado', nullif(new.raw_user_meta_data ->> 'nombre_scout_relacionado', ''),
      'status', signup_status
    ), now()
  from auth.users reviewer
  where lower(coalesce(reviewer.raw_app_meta_data ->> 'role', '')) in ('admin', 'mod');
  return new;
end;
$$;
revoke all on function public.notify_admins_on_signup() from public, anon, authenticated;
grant execute on function public.notify_admins_on_signup() to service_role;

commit;
