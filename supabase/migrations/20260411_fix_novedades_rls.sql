-- Fix RLS policies for novedades - allow public read
drop policy if exists "Novedades visibles públicamente" on novedades;
drop policy if exists "Solo admin puede gestionar novedades" on novedades;

-- Políticas ajustadas para permitir lectura pública sin restricciones
create policy "Permitir lectura pública de novedades" on novedades
  for select using (true);

-- Permitir insert/update/delete solo a admin
create policy "Solo admin puede gestionar novedades" on novedades
  for insert with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

create policy "Solo admin puede actualizar novedades" on novedades
  for update using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  ) with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );

create policy "Solo admin puede eliminar novedades" on novedades
  for delete using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.email like '%@admin%' or auth.users.email like '%grupo-scout%')
    )
  );
