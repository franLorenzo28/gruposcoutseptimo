-- Trigger para crear perfil automáticamente cuando se crea un usuario
-- Este trigger asegura que cada nuevo usuario tenga un perfil

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, nombre_completo, username)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Eliminar trigger anterior si existe
drop trigger if exists on_auth_user_created on auth.users;

-- Crear trigger en auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
