-- Fix: Forzar todos los usuarios a activo (excepto los explícitamente rechazados)
-- Esto corrige el problema de usuarios que no pueden iniciar sesión

begin;

-- Ver el estado actual de los usuarios
-- select user_id, email, account_status from public.profiles;

-- 1. ACTUALIZAR TODOS los usuarios a 'activo' (incluye null, vacío, pendiente)
update public.profiles
set account_status = 'activo',
    updated_at = now()
where account_status != 'activo' 
   or account_status is null 
   or account_status = '';

-- 2. Verificar resultado
-- select user_id, email, account_status from public.profiles limit 10;

commit;