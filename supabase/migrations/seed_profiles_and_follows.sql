-- Solo perfiles y relaciones (sin usuarios en auth.users)
-- Ejecutar DESPUÉS de crear los 4 usuarios manualmente en el Dashboard

-- IMPORTANTE: Necesitas conocer los UUIDs reales de los usuarios que creaste
-- Ejecuta esto primero para verlos:
-- select id, email from auth.users where email like 'test.%@example.com';

-- Luego reemplaza los UUIDs abajo con los reales y ejecuta:

-- 2) Insertar perfiles completos
-- REEMPLAZA 'USER_ID_MARIA' con el UUID real de test.maria@example.com
insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  seisena,
  is_public
) values (
  'USER_ID_MARIA',  -- ⬅️ REEMPLAZAR CON UUID REAL
  'María González',
  9,
  '+598 91 234 567',
  '2015-03-15',
  'Seisena Roja',
  false  -- PRIVADO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  is_public = excluded.is_public;

-- REEMPLAZA 'USER_ID_JUAN' con el UUID real de test.juan@example.com
insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  patrulla,
  is_public
) values (
  'USER_ID_JUAN',  -- ⬅️ REEMPLAZAR CON UUID REAL
  'Juan Pérez',
  13,
  '+598 92 345 678',
  '2011-07-22',
  'Patrulla Águilas',
  true  -- PÚBLICO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  is_public = excluded.is_public;

-- REEMPLAZA 'USER_ID_ANA' con el UUID real de test.ana@example.com
insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  equipo_pioneros,
  is_public
) values (
  'USER_ID_ANA',  -- ⬅️ REEMPLAZAR CON UUID REAL
  'Ana Rodríguez',
  16,
  '+598 93 456 789',
  '2008-11-10',
  'Equipo Aventura',
  false  -- PRIVADO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  is_public = excluded.is_public;

-- REEMPLAZA 'USER_ID_PEDRO' con el UUID real de test.pedro@example.com
insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  comunidad_rovers,
  is_public
) values (
  'USER_ID_PEDRO',  -- ⬅️ REEMPLAZAR CON UUID REAL
  'Pedro Martínez',
  19,
  '+598 94 567 890',
  '2005-05-28',
  'Comunidad Tropa',
  true  -- PÚBLICO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  is_public = excluded.is_public;

-- 3) Crear relaciones de seguimiento
-- REEMPLAZA los UUIDs con los reales

-- María → Juan (auto-aceptado porque Juan es público)
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'USER_ID_MARIA',
  'USER_ID_JUAN',
  'accepted',
  now() - interval '2 days',
  now() - interval '2 days'
) on conflict (follower_id, followed_id) do nothing;

-- Juan → María (pendiente porque María es privado)
insert into public.follows (follower_id, followed_id, status, created_at)
values (
  'USER_ID_JUAN',
  'USER_ID_MARIA',
  'pending',
  now() - interval '1 day'
) on conflict (follower_id, followed_id) do nothing;

-- Ana → Pedro (auto-aceptado porque Pedro es público)
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'USER_ID_ANA',
  'USER_ID_PEDRO',
  'accepted',
  now() - interval '3 days',
  now() - interval '3 days'
) on conflict (follower_id, followed_id) do nothing;

-- Pedro → Juan (auto-aceptado, ambos públicos)
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'USER_ID_PEDRO',
  'USER_ID_JUAN',
  'accepted',
  now() - interval '1 hour',
  now() - interval '1 hour'
) on conflict (follower_id, followed_id) do nothing;

-- Ana → María (pendiente, ambos privados)
insert into public.follows (follower_id, followed_id, status, created_at)
values (
  'USER_ID_ANA',
  'USER_ID_MARIA',
  'pending',
  now() - interval '6 hours'
) on conflict (follower_id, followed_id) do nothing;
