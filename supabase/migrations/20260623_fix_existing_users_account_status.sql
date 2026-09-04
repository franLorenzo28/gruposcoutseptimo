-- Fix: Actualizar account_status de usuarios existentes a 'activo'
-- Problema: Usuarios que ya existían tienen account_status null o valores incorrectos

begin;

-- 1. Actualizar usuarios con account_status null, vacío o pendiente a 'activo'
update public.profiles
set account_status = 'activo'
where account_status is null 
   or account_status = ''
   or account_status = 'pendiente_email'
   or account_status = 'pendiente_aprobacion';

-- 2. Verificar que los admins y mods tengan account_status = 'activo'
update public.profiles
set account_status = 'activo'
where lower(coalesce(role, '')) in ('admin', 'mod')
  and account_status != 'activo';

commit;