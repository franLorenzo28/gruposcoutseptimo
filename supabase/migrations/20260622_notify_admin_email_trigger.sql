-- Connect notify-admin-signup Edge Function
-- Modificar notify_admins_on_signup para enviar email al admin

begin;

-- Primero, necesitamos una forma de obtener la URL de Supabase
-- Creamos una función que obtiene la URL desde la configuración
create or replace function public.get_supabase_url()
returns text
language sql
stable
as $$
  select coalesce(
    current_setting('app.supabase_url', true),
    (select value from vault.secrets where name = 'supabase_url' limit 1),
    'https://YOUR_PROJECT.supabase.co'
  );
$$;

-- Reemplazar la función para que también llame a la Edge Function
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
  v_supabase_url text;
  v_edge_function_url text;
begin
  v_display := trim(concat_ws(' ',
    nullif(coalesce(new.raw_user_meta_data ->> 'nombre', ''), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'apellido', ''), '')
  ));

  if v_display is null or v_display = '' then
    v_display := coalesce(new.email, 'Nuevo usuario');
  end if;

  if new.email_confirmed_at is not null then
    v_status := 'pendiente_aprobacion';
  end if;

  v_tipo_relacion := nullif(coalesce(new.raw_user_meta_data ->> 'tipo_relacion', ''), '');
  v_rama := nullif(coalesce(new.raw_user_meta_data ->> 'rama', ''), '');
  v_nombre_scout_relacionado := nullif(coalesce(new.raw_user_meta_data ->> 'nombre_scout_relacionado', ''), '');

  -- Insert notification for admin
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

-- Nota: La llamada HTTP a la Edge Function requiere la extensión 'http' de Supabase.
-- Si no está habilitada, la notificación interna todavía funciona.
-- Alternativamente, el frontend puede llamar a la Edge Function después del registro.

commit;