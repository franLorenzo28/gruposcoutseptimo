-- Workflow de aprobacion de nuevos registros para produccion.
-- 1) Estado de cuenta en profiles.
-- 2) Sincronizacion de estado al confirmar email.
-- 3) RPC para aprobar/rechazar solicitudes desde notificaciones admin.

begin;

alter table public.profiles
  add column if not exists account_status text,
  add column if not exists account_classification text,
  add column if not exists account_review_reason text;

update public.profiles
set account_status = coalesce(nullif(account_status, ''), 'activo')
where account_status is null or account_status = '';

-- Trigger de alta de perfil con estado inicial.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_username text;
  v_display_name text;
  v_status text;
  v_classification text;
begin
  v_username := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]+', '_', 'g'));
  v_username := trim(both '_' from v_username);
  if v_username = '' then
    v_username := 'scout';
  end if;
  v_username := left(v_username, 20) || '_' || right(replace(new.id::text, '-', ''), 6);

  v_display_name := trim(concat_ws(' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));
  if v_display_name is null or v_display_name = '' then
    v_display_name := split_part(coalesce(new.email, 'Scout'), '@', 1);
  end if;

  v_status := case
    when new.email_confirmed_at is null then 'pendiente_email'
    else 'pendiente_aprobacion'
  end;

  v_classification := nullif(coalesce(new.raw_user_meta_data ->> 'tipo_relacion', ''), '');

  insert into public.profiles (
    user_id,
    email,
    nombre_completo,
    username,
    account_status,
    account_classification
  )
  values (
    new.id,
    new.email,
    v_display_name,
    v_username,
    v_status,
    v_classification
  )
  on conflict (user_id) do update set
    email = excluded.email,
    nombre_completo = coalesce(nullif(public.profiles.nombre_completo, ''), excluded.nombre_completo),
    account_status = coalesce(public.profiles.account_status, excluded.account_status),
    account_classification = coalesce(public.profiles.account_classification, excluded.account_classification);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cuando se verifica email, pasar de pendiente_email a pendiente_aprobacion.
create or replace function public.sync_profile_status_on_email_confirm()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
    set account_status = case
      when account_status is null or account_status = '' or account_status = 'pendiente_email'
        then 'pendiente_aprobacion'
      else account_status
    end,
    updated_at = now()
    where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute procedure public.sync_profile_status_on_email_confirm();

-- Notificacion admin con estado acorde.
create or replace function public.notify_admins_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_display text := null;
  v_tipo_relacion text := null;
  v_rama text := null;
  v_nombre_scout_relacionado text := null;
  v_created_at timestamptz := now();
  v_status text := 'pendiente_email';
begin
  v_display := trim(concat_ws(' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));

  if v_display is null or v_display = '' then
    v_display := coalesce(new.email, 'Nuevo usuario');
  end if;

  if new.email_confirmed_at is not null then
    v_status := 'pending';
  end if;

  v_tipo_relacion := nullif(coalesce(new.raw_user_meta_data ->> 'tipo_relacion', ''), '');
  v_rama := nullif(coalesce(new.raw_user_meta_data ->> 'rama', ''), '');
  v_nombre_scout_relacionado := nullif(coalesce(new.raw_user_meta_data ->> 'nombre_scout_relacionado', ''), '');

  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, data, created_at)
  select
    p.user_id,
    new.id,
    'message',
    'admin_request',
    new.id,
    jsonb_build_object(
      'kind', 'user_registration_request',
      'user_id', new.id,
      'display', v_display,
      'email', new.email,
      'tipo_relacion', v_tipo_relacion,
      'rama', v_rama,
      'nombre_scout_relacionado', v_nombre_scout_relacionado,
      'status', v_status,
      'content', concat('Nuevo registro: ', v_display, ' (', new.email, ').'),
      'created_at', v_created_at
    ),
    v_created_at
  from public.profiles p
  where
    lower(coalesce(p.role, '')) in ('admin', 'mod')
    or lower(coalesce(p.email, '')) like '%@admin%'
    or lower(coalesce(p.email, '')) like '%grupo-scout%'
    or lower(coalesce(p.email, '')) = 'franciscolorenzo2406@gmail.com';

  return new;
end;
$$;

drop trigger if exists on_auth_user_admin_notification on auth.users;
create trigger on_auth_user_admin_notification
  after insert on auth.users
  for each row execute procedure public.notify_admins_on_signup();

create or replace function public.review_user_registration_request(
  p_notification_id uuid,
  p_requester_id uuid,
  p_approve boolean,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text := '';
  v_actor_email text := '';
  v_reviewer_name text := 'Administracion';
  v_now timestamptz := now();
  v_notification public.notifications%rowtype;
  v_data jsonb := '{}'::jsonb;
  v_status text := 'pending';
  v_new_status text := case when p_approve then 'activo' else 'rechazado' end;
begin
  if v_actor_id is null then
    raise exception 'No autorizado';
  end if;

  select
    lower(coalesce(p.role, '')),
    lower(coalesce(p.email, u.email, '')),
    coalesce(
      nullif(trim(p.nombre_completo), ''),
      nullif(trim(p.username), ''),
      nullif(trim(u.email), ''),
      'Administracion'
    )
  into v_actor_role, v_actor_email, v_reviewer_name
  from public.profiles p
  left join auth.users u on u.id = p.user_id
  where p.user_id = v_actor_id;

  if not found then
    select
      lower(coalesce(u.email, '')),
      coalesce(nullif(trim(u.email), ''), 'Administracion')
    into v_actor_email, v_reviewer_name
    from auth.users u
    where u.id = v_actor_id;
  end if;

  if v_actor_role not in ('admin', 'mod')
     and v_actor_email not like '%@admin%'
     and v_actor_email not like '%grupo-scout%'
     and v_actor_email <> 'franciscolorenzo2406@gmail.com'
  then
    raise exception 'No tienes permisos para revisar registros.';
  end if;

  select n.*
  into v_notification
  from public.notifications n
  where n.id = p_notification_id
  for update;

  if not found then
    raise exception 'No se encontro la solicitud a revisar.';
  end if;

  v_data := coalesce(v_notification.data::jsonb, '{}'::jsonb);
  v_status := lower(coalesce(v_data ->> 'status', 'pending'));

  if lower(coalesce(v_data ->> 'kind', '')) <> 'user_registration_request' then
    raise exception 'La notificacion no corresponde a un registro de usuario.';
  end if;

  if v_notification.actor_id <> p_requester_id then
    raise exception 'El solicitante no coincide con la notificacion.';
  end if;

  if v_notification.read_at is not null then
    raise exception 'Esta solicitud ya fue revisada.';
  end if;

  if v_status not in ('pending', 'pendiente_email', 'pendiente_aprobacion') then
    raise exception 'Esta solicitud ya no esta pendiente.';
  end if;

  update public.profiles
  set
    account_status = v_new_status,
    account_review_reason = nullif(trim(coalesce(p_note, '')), ''),
    updated_at = v_now
  where user_id = p_requester_id;

  if not found then
    raise exception 'No se encontro el perfil del solicitante.';
  end if;

  update public.notifications
  set
    read_at = v_now,
    data = coalesce(data::jsonb, '{}'::jsonb) ||
      jsonb_build_object(
        'status', 'reviewed',
        'approved', p_approve,
        'reviewed_at', v_now,
        'reviewer_name', v_reviewer_name
      )
  where id = p_notification_id;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    data
  )
  values (
    p_requester_id,
    v_actor_id,
    'message',
    'user_registration_response',
    p_requester_id,
    jsonb_build_object(
      'kind', 'user_registration_response',
      'approved', p_approve,
      'account_status', v_new_status,
      'reviewer_name', v_reviewer_name,
      'note', nullif(trim(coalesce(p_note, '')), ''),
      'reviewed_at', v_now
    )
  );

  return jsonb_build_object(
    'ok', true,
    'reviewed_at', v_now,
    'requester_id', p_requester_id,
    'approved', p_approve,
    'new_status', v_new_status
  );
end;
$$;

revoke all on function public.review_user_registration_request(uuid, uuid, boolean, text) from public;
grant execute on function public.review_user_registration_request(uuid, uuid, boolean, text) to authenticated;

commit;
