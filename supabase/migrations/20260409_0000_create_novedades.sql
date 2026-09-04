-- Novedades (barra lateral dinámicas)
create table if not exists novedades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  href text not null,
  etiqueta text not null,
  tipo text not null default 'manual',
  referencia_id text,
  activa boolean default true,
  creada_por uuid references auth.users on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_novedades_activa on novedades(activa, created_at desc);
create index if not exists idx_novedades_tipo on novedades(tipo, created_at desc);

-- Enable RLS
alter table novedades enable row level security;

-- Drop existing policies to recreate them
drop policy if exists "Novedades visibles públicamente" on novedades;
drop policy if exists "Solo admin puede gestionar novedades" on novedades;

-- Públicamente visible
create policy "Novedades visibles públicamente" on novedades
  for select using (activa = true);

-- Solo admin puede crear/editar/eliminar
create policy "Solo admin puede gestionar novedades" on novedades
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.email like '%@admin%'
    )
  );
