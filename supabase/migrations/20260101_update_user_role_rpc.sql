-- Allow admin and mod to update profiles.role for any user
-- Mods cannot assign admin role

-- Create RPC function to update user role with guard
create or replace function public.update_user_role(
  p_user_id uuid,
  p_new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_existing_role text;
begin
  -- Check caller is admin or mod
  select coalesce(lower(role), '')
  into v_caller_role
  from public.profiles
  where user_id = auth.uid();

  if v_caller_role not in ('admin', 'mod') then
    raise exception 'Solo admin o moderador pueden cambiar roles';
  end if;

  -- If caller is mod, cannot assign admin
  if v_caller_role = 'mod' and lower(p_new_role) = 'admin' then
    raise exception 'Los moderadores no pueden asignar rol admin';
  end if;

  -- Validate new role
  if lower(p_new_role) not in ('user', 'mod', 'admin') then
    raise exception 'Rol inválido: debe ser user, mod o admin';
  end if;

  -- Update the role
  update public.profiles
  set role = lower(p_new_role)
  where user_id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;
end;
$$;

revoke all on function public.update_user_role(uuid, text) from public;
grant execute on function public.update_user_role(uuid, text) to authenticated;
