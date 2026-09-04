-- Clear and re-create coherent profiles read policies

alter table public.profiles enable row level security;

-- Drop legacy combined policy if present
drop policy if exists read_profiles_public_or_self_or_accepted_follower on public.profiles;

-- 1) Owner can read su propio perfil
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self
on public.profiles for select
to authenticated
using ( user_id = auth.uid() );

-- 2) Cualquiera autenticado puede leer perfiles públicos
drop policy if exists profiles_read_public on public.profiles;
create policy profiles_read_public
on public.profiles for select
to authenticated
using ( coalesce(is_public, false) = true );

-- 3) Seguidores aceptados pueden leer perfil privado del seguido
drop policy if exists profiles_read_accepted_follower on public.profiles;
create policy profiles_read_accepted_follower
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.follows f
    where f.followed_id = profiles.user_id
      and f.follower_id = auth.uid()
      and f.status = 'accepted'
  )
);

-- 4) Permitir ver perfil básico de quien te envió o a quien enviaste solicitud pendiente
-- Esto es necesario para que puedas ver quién te sigue y decidir aceptar/rechazar
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

-- Opcional: permitir que usuarios no autenticados vean perfiles públicos
-- drop policy if exists profiles_read_public_anon on public.profiles;
-- create policy profiles_read_public_anon
-- on public.profiles for select
-- to anon
-- using ( coalesce(is_public, false) = true );

