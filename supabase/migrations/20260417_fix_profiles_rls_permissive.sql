-- Fix RLS para profiles - permite lectura de perfiles pero con restricciones de privacidad en la aplicación

-- Eliminar todas las políticas anteriores
drop policy if exists "Profiles: users see own, admins see all" on profiles;
drop policy if exists "Profiles: users can update own" on profiles;
drop policy if exists "Profiles: users can insert own" on profiles;
drop policy if exists "Admin can do anything on profiles" on profiles;
drop policy if exists "Admin can view all profiles" on profiles;
drop policy if exists "Users and admins can view profiles" on profiles;

-- POLÍTICA 1: Todos pueden LEER perfiles (privacidad se maneja en aplicación)
create policy "Anyone can view profiles" on profiles
  for select using (true);

-- POLÍTICA 2: Usuarios solo updatan su propio perfil
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- POLÍTICA 3: Usuarios insertan su propio perfil
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

-- POLÍTICA 4: Solo admin puede deleter
create policy "Admin can delete profiles" on profiles
  for delete using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (
        auth.users.email ilike '%admin%'
        or auth.users.email ilike '%grupo-scout%'
        or auth.users.email = 'franciscolorenzo2406@gmail.com'
      )
    )
  );
