-- Crear perfil para el admin si no existe
-- Este script identifica el user_id de franciscolorenzo2406@gmail.com en auth.users
-- y crea un perfil en la tabla profiles

insert into public.profiles (user_id, email, nombre_completo, username, fecha_nacimiento, rol_adulto)
select 
  u.id,
  u.email,
  'Admin',
  'admin',
  '1990-01-01'::date,
  'Educador/a'
from auth.users u
where u.email = 'franciscolorenzo2406@gmail.com'
    and not exists (
      select 1 from public.profiles p
      where p.user_id = u.id
    )
on conflict (user_id) do nothing;
