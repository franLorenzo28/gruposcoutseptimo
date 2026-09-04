-- Seed de datos de prueba para sistema de seguidores
-- IMPORTANTE: Solo ejecutar en entornos de desarrollo/testing
-- NO ejecutar en producción

-- Este script crea:
-- - 4 usuarios de prueba (2 públicos, 2 privados)
-- - Perfiles completos para cada uno
-- - Relaciones de seguimiento en diferentes estados

-- NOTA: Las contraseñas de prueba son 'password123'
-- Los emails siguen el patrón: test.{nombre}@example.com

-- 1) Insertar usuarios de prueba en auth.users
-- (Requiere permisos de superusuario o service_role)
-- Si no puedes ejecutar esto directamente, crea los usuarios desde el Dashboard de Supabase

-- Usuario A - María (Privado, Manada)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values (
  'a1111111-1111-1111-1111-111111111111',
  'test.maria@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Usuario B - Juan (Público, Tropa)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values (
  'b2222222-2222-2222-2222-222222222222',
  'test.juan@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Usuario C - Ana (Privado, Pioneros)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values (
  'c3333333-3333-3333-3333-333333333333',
  'test.ana@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Usuario D - Pedro (Público, Rover)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values (
  'd4444444-4444-4444-4444-444444444444',
  'test.pedro@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- 2) Insertar perfiles completos
insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  seisena,
  is_public
) values (
  'a1111111-1111-1111-1111-111111111111',
  'María González',
  9,
  '+598 91 234 567',
  '2015-03-15',
  'Seisena Roja',
  false  -- PRIVADO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  telefono = excluded.telefono,
  fecha_nacimiento = excluded.fecha_nacimiento,
  seisena = excluded.seisena,
  is_public = excluded.is_public;

insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  patrulla,
  is_public
) values (
  'b2222222-2222-2222-2222-222222222222',
  'Juan Pérez',
  13,
  '+598 92 345 678',
  '2011-07-22',
  'Patrulla Águilas',
  true  -- PÚBLICO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  telefono = excluded.telefono,
  fecha_nacimiento = excluded.fecha_nacimiento,
  patrulla = excluded.patrulla,
  is_public = excluded.is_public;

insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  equipo_pioneros,
  is_public
) values (
  'c3333333-3333-3333-3333-333333333333',
  'Ana Rodríguez',
  16,
  '+598 93 456 789',
  '2008-11-10',
  'Equipo Aventura',
  false  -- PRIVADO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  telefono = excluded.telefono,
  fecha_nacimiento = excluded.fecha_nacimiento,
  equipo_pioneros = excluded.equipo_pioneros,
  is_public = excluded.is_public;

insert into public.profiles (
  user_id,
  nombre_completo,
  edad,
  telefono,
  fecha_nacimiento,
  comunidad_rovers,
  is_public
) values (
  'd4444444-4444-4444-4444-444444444444',
  'Pedro Martínez',
  19,
  '+598 94 567 890',
  '2005-05-28',
  'Comunidad Tropa',
  true  -- PÚBLICO
) on conflict (user_id) do update set
  nombre_completo = excluded.nombre_completo,
  edad = excluded.edad,
  telefono = excluded.telefono,
  fecha_nacimiento = excluded.fecha_nacimiento,
  comunidad_rovers = excluded.comunidad_rovers,
  is_public = excluded.is_public;

-- 3) Crear relaciones de seguimiento
-- María (privado) sigue a Juan (público) → auto-aceptado
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'accepted',
  now() - interval '2 days',
  now() - interval '2 days'
) on conflict (follower_id, followed_id) do nothing;

-- Juan (público) sigue a María (privado) → pendiente (esperando aceptación)
insert into public.follows (follower_id, followed_id, status, created_at)
values (
  'b2222222-2222-2222-2222-222222222222',
  'a1111111-1111-1111-1111-111111111111',
  'pending',
  now() - interval '1 day'
) on conflict (follower_id, followed_id) do nothing;

-- Ana (privado) sigue a Pedro (público) → auto-aceptado
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
  'accepted',
  now() - interval '3 days',
  now() - interval '3 days'
) on conflict (follower_id, followed_id) do nothing;

-- Pedro (público) sigue a Juan (público) → auto-aceptado
insert into public.follows (follower_id, followed_id, status, created_at, accepted_at)
values (
  'd4444444-4444-4444-4444-444444444444',
  'b2222222-2222-2222-2222-222222222222',
  'accepted',
  now() - interval '1 hour',
  now() - interval '1 hour'
) on conflict (follower_id, followed_id) do nothing;

-- María (privado) tiene solicitud pendiente de Ana (privado)
insert into public.follows (follower_id, followed_id, status, created_at)
values (
  'c3333333-3333-3333-3333-333333333333',
  'a1111111-1111-1111-1111-111111111111',
  'pending',
  now() - interval '6 hours'
) on conflict (follower_id, followed_id) do nothing;

-- Resumen de lo creado:
do $$
begin
  raise notice '=== DATOS DE PRUEBA CREADOS ===';
  raise notice '';
  raise notice 'Usuarios creados:';
  raise notice '- María González (9 años, Manada) - PRIVADO';
  raise notice '  Email: test.maria@example.com | Password: password123';
  raise notice '  ID: a1111111-1111-1111-1111-111111111111';
  raise notice '';
  raise notice '- Juan Pérez (13 años, Tropa) - PÚBLICO';
  raise notice '  Email: test.juan@example.com | Password: password123';
  raise notice '  ID: b2222222-2222-2222-2222-222222222222';
  raise notice '';
  raise notice '- Ana Rodríguez (16 años, Pioneros) - PRIVADO';
  raise notice '  Email: test.ana@example.com | Password: password123';
  raise notice '  ID: c3333333-3333-3333-3333-333333333333';
  raise notice '';
  raise notice '- Pedro Martínez (19 años, Rover) - PÚBLICO';
  raise notice '  Email: test.pedro@example.com | Password: password123';
  raise notice '  ID: d4444444-4444-4444-4444-444444444444';
  raise notice '';
  raise notice 'Relaciones creadas:';
  raise notice '✅ María → Juan (aceptado, porque Juan es público)';
  raise notice '⏳ Juan → María (pendiente, porque María es privado)';
  raise notice '✅ Ana → Pedro (aceptado, porque Pedro es público)';
  raise notice '✅ Pedro → Juan (aceptado, ambos públicos)';
  raise notice '⏳ Ana → María (pendiente, ambos privados)';
  raise notice '';
  raise notice '=== LISTO PARA PROBAR ===';
end $$;
