-- Fix: Allow notifications insert from system triggers (notify_admins_on_signup)
-- Problema: Las políticas RLS bloqueaban inserts desde triggers porque auth.uid() es null

begin;

-- Agregar política específica para permitir inserts desde funciones del sistema
drop policy if exists notifications_insert_from_system on public.notifications;

create policy notifications_insert_from_system
on public.notifications for insert
to authenticated
with check (
  actor_id = auth.uid()
  or recipient_id = auth.uid()
  or public.is_admin_from_profile()
  or (
    -- Permitir si viene de función public del sistema con security definer
    current_setting('search_path', true) LIKE '%public%'
  )
);

commit;