-- Security boundary for the Fastify cut-over.
-- IMPORTANT: password_hash used to contain clear-text passwords. Values are
-- scrubbed before the column is removed. Rotate/reset any exposed credentials
-- as an operational incident-response step after deploying this migration.

begin;

do $$
begin
  if to_regclass('public.registration_requests') is null then
    raise exception 'Preflight failed: public.registration_requests is missing';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception 'Preflight failed: public.profiles is missing';
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in ('admin', 'mod')
    or exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)
      ) as role_name
      where lower(role_name) in ('admin', 'mod')
    );
$$;

create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.account_status = 'activo'
  );
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_active_member() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_active_member() to authenticated, service_role;

-- Registration requests are server-owned. No password or reusable
-- verification secret is stored in this table anymore.
revoke all on table public.registration_requests from public, anon, authenticated;
grant all on table public.registration_requests to service_role;
alter table public.registration_requests enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'registration_requests'
  loop
    execute format(
      'drop policy if exists %I on public.registration_requests',
      policy_record.policyname
    );
  end loop;
end
$$;

alter table public.registration_requests
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists grupo_scout text;

update public.registration_requests r
set auth_user_id = u.id
from auth.users u
where r.auth_user_id is null
  and lower(u.email) = lower(r.email);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registration_requests'
      and column_name = 'password_hash'
  ) then
    update public.registration_requests set password_hash = null where password_hash is not null;
  end if;
end
$$;
alter table public.registration_requests
  drop column if exists password_hash,
  drop column if exists verification_token;

alter table public.registration_requests
  drop constraint if exists registration_requests_status_check;
alter table public.registration_requests
  add constraint registration_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create unique index if not exists registration_requests_auth_user_id_key
  on public.registration_requests(auth_user_id)
  where auth_user_id is not null;
create index if not exists registration_requests_status_requested_at_idx
  on public.registration_requests(status, requested_at desc);

-- A user can still read/update their own profile, but cannot change identity,
-- approval or authorization fields. Those mutations belong to Fastify.
alter table public.profiles enable row level security;
revoke insert, update, delete on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (
  nombre_completo,
  username,
  telefono,
  descripcion_personal,
  profesion_ocupacion,
  fecha_nacimiento,
  avatar_url,
  is_public,
  privacy_preferences,
  notification_preferences,
  patrulla,
  seisena,
  adelanto,
  equipo_pioneros,
  comunidad_rovers,
  promesa,
  ppp_url,
  username_updated_at,
  updated_at
) on public.profiles to authenticated;
grant all on table public.profiles to service_role;

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own_safe
on public.profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Replace profile/email-pattern based administration with signed app_metadata.
create or replace function public.is_admin_from_profile()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;
revoke all on function public.is_admin_from_profile() from public, anon;
grant execute on function public.is_admin_from_profile() to authenticated, service_role;

-- Follow requests cannot be forged as accepted, and UPDATE cannot rewrite the
-- relationship identifiers.
alter table if exists public.follows enable row level security;
drop policy if exists follows_insert_safe on public.follows;
create policy follows_insert_safe
on public.follows for insert
to authenticated
with check (
  follower_id = (select auth.uid())
  and follower_id <> followed_id
  and (
    status = 'pending'
    or (
      status = 'accepted'
      and exists (
        select 1 from public.profiles p
        where p.user_id = followed_id and coalesce(p.is_public, false)
      )
    )
  )
);
revoke update on table public.follows from authenticated;
grant update(status, accepted_at) on public.follows to authenticated;

-- Conversation membership is created only by the reviewed RPC. Knowing a
-- conversation UUID is no longer enough to join it.
drop policy if exists participants_insert_self on public.conversation_participants;
drop policy if exists conversations_insert_auth on public.conversations;
revoke insert, update, delete on public.conversation_participants from authenticated;
revoke insert, update, delete on public.conversations from authenticated;
grant select on public.conversation_participants, public.conversations to authenticated;
revoke all on function public.create_or_get_conversation(uuid) from public, anon;
grant execute on function public.create_or_get_conversation(uuid) to authenticated, service_role;

-- Clients may mark notifications/messages as read, never impersonate actors or
-- move records between owners/conversations.
drop policy if exists notifications_insert_safe on public.notifications;
revoke insert, update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
grant select, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists notifications_update_safe on public.notifications;
create policy notifications_update_safe
on public.notifications for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

revoke update on public.messages from authenticated;
grant update(read_at) on public.messages to authenticated;
drop policy if exists messages_update_sender on public.messages;
create policy messages_mark_read_participant
on public.messages for update
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = (select auth.uid())
  )
);

-- Group creation and membership mutations now go through the server. This
-- closes self-joining as admin and primary-key rewrites.
do $$
declare
  policy_record record;
begin
  if to_regclass('public.group_members') is not null then
    for policy_record in
      select policyname from pg_policies
      where schemaname = 'public'
        and tablename = 'group_members'
        and cmd in ('INSERT', 'UPDATE')
    loop
      execute format('drop policy if exists %I on public.group_members', policy_record.policyname);
    end loop;
    revoke insert, update on public.group_members from authenticated;
    grant select, delete on public.group_members to authenticated;
    grant all on public.group_members to service_role;
  end if;

  if to_regclass('public.groups') is not null then
    for policy_record in
      select policyname from pg_policies
      where schemaname = 'public'
        and tablename = 'groups'
        and cmd = 'INSERT'
    loop
      execute format('drop policy if exists %I on public.groups', policy_record.policyname);
    end loop;
    revoke insert, update, delete on public.groups from authenticated;
    grant select on public.groups to authenticated;
    grant all on public.groups to service_role;
  end if;
end
$$;

-- Rama broadcasts must belong to the caller and require an immutable approved
-- educator/admin assignment.
drop policy if exists "rama broadcast insert own author" on public.rama_broadcast_messages;
create policy rama_broadcast_insert_authorized
on public.rama_broadcast_messages for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_active_member()
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
      )
  )
);

-- Narrativas are public to read, but only signed admin claims may mutate them.
drop policy if exists "Only admins can create narrativas" on public.narrativas;
drop policy if exists "Authors and admins can update narrativas" on public.narrativas;
drop policy if exists "Authors and admins can delete narrativas" on public.narrativas;
create policy narrativas_insert_admin
on public.narrativas for insert to authenticated
with check (autor_id = (select auth.uid()) and private.is_admin());
create policy narrativas_update_admin
on public.narrativas for update to authenticated
using (private.is_admin())
with check (private.is_admin());
create policy narrativas_delete_admin
on public.narrativas for delete to authenticated
using (private.is_admin());
grant select on public.narrativas to anon, authenticated;
revoke insert, update, delete on public.narrativas from authenticated;
grant all on public.narrativas to service_role;

-- Rama Storage writes previously allowed every authenticated user to overwrite
-- or delete every file. Reads remain direct; signed write URLs will be issued by
-- the backend in the media phase.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (
        coalesce(qual, '') ilike '%rama-documentos%'
        or coalesce(with_check, '') ilike '%rama-documentos%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;
end
$$;

-- Revoke default PUBLIC/anon execution from every exposed SECURITY DEFINER.
-- Explicit authenticated grants for user-facing RPCs remain intact, except the
-- privileged/unsafe names listed below.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon', function_record.signature);
  end loop;

  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_notification',
        'update_user_role',
        'simple_review_user_registration',
        'simple_review_educator_permission',
        'review_user_registration_request',
        'add_group_owner_membership',
        'is_email_registered',
        'request_educator_permissions',
        'review_educator_permission_request'
      )
  loop
    execute format('revoke all on function %s from authenticated', function_record.signature);
    execute format('grant execute on function %s to service_role', function_record.signature);
  end loop;
end
$$;

-- Keep the database notification trigger, but resolve recipients only from
-- server-managed app metadata. Legacy email patterns are intentionally gone.
create or replace function public.notify_admins_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  signup_status text;
begin
  display_name := trim(concat_ws(
    ' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));
  if display_name = '' then
    display_name := coalesce(new.email, 'Nuevo usuario');
  end if;
  signup_status := case when new.email_confirmed_at is null then 'pendiente_email' else 'pending' end;

  insert into public.notifications (
    recipient_id, actor_id, type, entity_type, entity_id, data, created_at
  )
  select
    reviewer.id,
    new.id,
    'message',
    'admin_request',
    new.id,
    jsonb_build_object(
      'kind', 'user_registration_request',
      'user_id', new.id,
      'display', display_name,
      'email', new.email,
      'tipo_relacion', nullif(new.raw_user_meta_data ->> 'tipo_relacion', ''),
      'rama', nullif(new.raw_user_meta_data ->> 'rama', ''),
      'nombre_scout_relacionado', nullif(new.raw_user_meta_data ->> 'nombre_scout_relacionado', ''),
      'status', signup_status
    ),
    now()
  from auth.users reviewer
  where lower(coalesce(reviewer.raw_app_meta_data ->> 'role', '')) in ('admin', 'mod');

  return new;
end;
$$;
revoke all on function public.notify_admins_on_signup() from public, anon, authenticated;
grant execute on function public.notify_admins_on_signup() to service_role;

-- Atomic, server-only decision command. Fastify authenticates the reviewer;
-- this function owns the database transaction and remains inaccessible to web
-- roles.
create or replace function public.review_registration_request_v2(
  p_request_id uuid,
  p_action text,
  p_reviewer_id uuid,
  p_admin_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.registration_requests%rowtype;
  next_status text;
  now_value timestamptz := now();
  generated_username text;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'invalid_action';
  end if;
  if p_reviewer_id is null or not exists (select 1 from auth.users where id = p_reviewer_id) then
    raise exception 'invalid_reviewer';
  end if;

  select * into request_row
  from public.registration_requests
  where id = p_request_id
  for update;
  if not found then
    raise exception 'registration_not_found';
  end if;

  next_status := case when p_action = 'approve' then 'approved' else 'rejected' end;
  if request_row.status = next_status then
    return jsonb_build_object(
      'id', request_row.id,
      'user_id', request_row.auth_user_id,
      'status', request_row.status,
      'idempotent', true
    );
  end if;
  if request_row.status <> 'pending' then
    raise exception 'already_reviewed';
  end if;

  if p_action = 'approve' then
    if request_row.auth_user_id is null then
      raise exception 'registration_has_no_auth_user';
    end if;
    if not exists (
      select 1 from auth.users
      where id = request_row.auth_user_id and email_confirmed_at is not null
    ) then
      raise exception 'email_not_verified';
    end if;

    generated_username := left(
      lower(regexp_replace(split_part(request_row.email, '@', 1), '[^a-z0-9_]+', '_', 'g')),
      20
    ) || '_' || right(replace(request_row.auth_user_id::text, '-', ''), 6);

    insert into public.profiles (
      user_id,
      email,
      nombre_completo,
      username,
      account_status,
      account_classification,
      email_verified,
      account_review_reason
    ) values (
      request_row.auth_user_id,
      request_row.email,
      trim(concat_ws(' ', request_row.nombre, request_row.apellido)),
      generated_username,
      'activo',
      request_row.tipo_relacion,
      true,
      nullif(trim(coalesce(p_admin_notes, '')), '')
    )
    on conflict (user_id) do update set
      email = excluded.email,
      nombre_completo = excluded.nombre_completo,
      account_status = 'activo',
      account_classification = coalesce(public.profiles.account_classification, excluded.account_classification),
      email_verified = true,
      account_review_reason = excluded.account_review_reason,
      updated_at = now_value;
  else
    update public.profiles
    set account_status = 'rechazado',
        account_review_reason = nullif(trim(coalesce(p_admin_notes, '')), ''),
        updated_at = now_value
    where user_id = request_row.auth_user_id;
  end if;

  update public.registration_requests
  set status = next_status,
      reviewed_at = now_value,
      reviewed_by = p_reviewer_id,
      admin_notes = nullif(trim(coalesce(p_admin_notes, '')), '')
  where id = request_row.id;

  if request_row.auth_user_id is not null then
    insert into public.notifications (
      recipient_id, actor_id, type, entity_type, entity_id, data, created_at
    ) values (
      request_row.auth_user_id,
      p_reviewer_id,
      'message',
      'registration_response',
      request_row.id,
      jsonb_build_object(
        'kind', 'registration_response',
        'approved', p_action = 'approve',
        'status', next_status,
        'note', nullif(trim(coalesce(p_admin_notes, '')), '')
      ),
      now_value
    );
  end if;

  return jsonb_build_object(
    'id', request_row.id,
    'user_id', request_row.auth_user_id,
    'status', next_status,
    'reviewed_at', now_value,
    'idempotent', false
  );
end;
$$;

revoke all on function public.review_registration_request_v2(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.review_registration_request_v2(uuid, text, uuid, text)
  to service_role;

commit;
