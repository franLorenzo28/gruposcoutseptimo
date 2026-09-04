-- Permite ver perfil básico de usuarios con solicitudes pendientes
-- Esto soluciona el problema donde no puedes ver quién te envió una solicitud
-- Ejecutar este script en la consola SQL de Supabase

-- Asegurar que RLS esté habilitado
alter table public.profiles enable row level security;

-- Agregar política para ver perfiles con relación pendiente
drop policy if exists profiles_read_pending_relation on public.profiles;
create policy profiles_read_pending_relation
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.follows f
    where (
      -- Yo soy el seguido y esta persona me envió solicitud
      (f.followed_id = auth.uid() and f.follower_id = profiles.user_id)
      -- O yo soy el seguidor y envié solicitud a esta persona
      or (f.follower_id = auth.uid() and f.followed_id = profiles.user_id)
    )
    and f.status = 'pending'
  )
);
