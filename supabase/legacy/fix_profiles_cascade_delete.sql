-- Permitir borrar usuarios desde el panel de Supabase
-- Esto actualiza la foreign key de profiles para que use CASCADE en vez de RESTRICT

-- 1. Eliminar la constraint existente (puede tener diferentes nombres)
-- Primero intentamos encontrar y eliminar cualquier constraint de foreign key en user_id
do $$
declare
  constraint_name text;
begin
  -- Buscar el nombre del constraint
  select con.conname into constraint_name
  from pg_constraint con
  inner join pg_class rel on rel.oid = con.conrelid
  inner join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'profiles'
    and con.contype = 'f'
    and con.confrelid = (
      select oid from pg_class
      where relname = 'users'
        and relnamespace = (select oid from pg_namespace where nspname = 'auth')
    );
  
  -- Si encontramos el constraint, lo eliminamos
  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end $$;

-- 2. Agregar la nueva constraint con ON DELETE CASCADE
alter table public.profiles
add constraint profiles_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

-- Ahora podrás borrar usuarios desde el panel y se eliminarán automáticamente:
-- - Su perfil en la tabla profiles
-- - Todas sus relaciones de follows (ya tenía cascade)
