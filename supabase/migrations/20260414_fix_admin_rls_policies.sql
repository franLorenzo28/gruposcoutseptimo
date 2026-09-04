-- Fix RLS policies para permitirle al admin acceso total a todas las tablas
-- PERO sin romper el acceso de usuarios regulares a sus propios datos

-- Los admins pueden ver todo en profiles, y usuarios pueden ver su propio perfil
drop policy if exists "Admin can view all profiles" on profiles;
create policy "Admin can view all profiles" on profiles
  for select using (
    -- Admin puede ver todo
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
    OR
    -- Usuarios regulares solo ven su propio perfil
    auth.uid() = id
  );

-- Los admins pueden ver todo en groups
drop policy if exists "Admin can view all groups" on groups;
create policy "Admin can view all groups" on groups
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

-- Los admins pueden ver todo en threads
drop policy if exists "Admin can view all threads" on threads;
create policy "Admin can view all threads" on threads
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

-- Los admins pueden ver todo en thread_comments
drop policy if exists "Admin can view all thread_comments" on thread_comments;
create policy "Admin can view all thread_comments" on thread_comments
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

-- Los admins pueden ver todo en follows
drop policy if exists "Admin can view all follows" on follows;
create policy "Admin can view all follows" on follows
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

-- Los admins pueden ver todo en notifications
drop policy if exists "Admin can view all notifications" on notifications;
create policy "Admin can view all notifications" on notifications
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

-- Los admins pueden ver todo en group_messages
drop policy if exists "Admin can view all group_messages" on group_messages;
create policy "Admin can view all group_messages" on group_messages
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

