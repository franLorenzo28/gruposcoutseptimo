-- Migración simple: crear perfil para admin específico
-- Sin triggers complejos

insert into profiles (id, user_id, email, nombre_completo, username, telefono, created_at, updated_at)
values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  (select id from auth.users where email = 'franciscolorenzo2406@gmail.com' limit 1),
  'franciscolorenzo2406@gmail.com',
  'Admin',
  'admin',
  '',
  now(),
  now()
)
on conflict (user_id) do nothing;
