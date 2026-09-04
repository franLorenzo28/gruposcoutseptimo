-- Diagnosticar y corregir políticas RLS en profiles

-- Primero, eliminar TODAS las políticas existentes en profiles
drop policy if exists "Users and admins can view profiles" on profiles;
drop policy if exists "Admin can view all profiles" on profiles;
drop policy if exists "Anyone can view their own profile" on profiles;
drop policy if exists "Permitir lectura pública de novedades" on profiles;
drop policy if exists "Users are viewing own profile" on profiles;
drop policy if exists "Public profiles are viewable by anyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Crear política única y clara: usuarios ven su propio perfil, admins ven todo
create policy "Profiles: users see own, admins see all" on profiles
  for select using (
    -- ADMIN: puede ver todo si email contiene admin o grupo-scout
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (
        auth.users.email ilike '%admin%' 
        or auth.users.email ilike '%grupo-scout%'
        or auth.users.email = 'franciscolorenzo2406@gmail.com'
      )
    )
    OR
    -- USUARIO REGULAR: solo ve su propio perfil
    (auth.uid() = id)
  );

-- Permitir que usuarios actualicen su propio perfil
create policy "Profiles: users can update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Permitir que usuarios inserten su propio perfil
create policy "Profiles: users can insert own" on profiles
  for insert with check (auth.uid() = id);

-- Admin puede hacer todo en profiles
create policy "Admin can do anything on profiles" on profiles
  using (
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
