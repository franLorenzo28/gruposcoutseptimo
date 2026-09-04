-- Notificar a administradores cuando se registra un usuario (Supabase)

begin;

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
begin
  v_display := trim(concat_ws(' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));

  if v_display is null or v_display = '' then
    v_display := coalesce(new.email, 'Nuevo usuario');
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
      'status', 'pendiente_email',
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

-- Asegurar trigger unico
drop trigger if exists on_auth_user_admin_notification on auth.users;

create trigger on_auth_user_admin_notification
  after insert on auth.users
  for each row execute procedure public.notify_admins_on_signup();

commit;
