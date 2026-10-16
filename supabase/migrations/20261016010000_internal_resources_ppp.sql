begin;

-- Preserve legacy beneficiary access with a one-time assignment. Future
-- changes to the editable birth date do not grant access to another unit.
update public.profiles p set internal_unit = case
  when p.edad between 7 and 10 then 'lobatos'
  when p.edad between 11 and 14 then 'tropa'
  when p.edad between 15 and 17 then 'pioneros'
  when p.edad between 18 and 20 then 'rover'
  else null end
where p.internal_access is true and p.internal_unit is null
  and lower(coalesce(p.rol_adulto, '')) not in ('educador', 'educador/a', 'educadora')
  and p.edad between 7 and 20;

-- Match the unit assigned to an active internal account. The profile, not a
-- browser-stored member session, is the authority for file access.
create or replace function private.can_read_internal_unit(p_rama text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_rama in ('lobatos', 'tropa', 'pioneros', 'rover') and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.account_status = 'activo' and p.internal_access is true
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or p.internal_unit = p_rama
        or (p.educador_aprobado is true
          and lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
          and (case p_rama when 'lobatos' then 'manada' when 'rover' then 'rovers' else p_rama end)
            = any(regexp_split_to_array(lower(replace(coalesce(p.rama_que_educa, ''), ' ', '')), '[;,|]')))
      )
  );
$$;

create or replace function private.can_publish_internal_unit(p_rama text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_rama in ('lobatos', 'tropa', 'pioneros', 'rover') and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.account_status = 'activo' and p.internal_access is true
      and (lower(coalesce(p.role, '')) in ('admin', 'mod')
        or (p.educador_aprobado is true
          and lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
          and (case p_rama when 'lobatos' then 'manada' when 'rover' then 'rovers' else p_rama end)
            = any(regexp_split_to_array(lower(replace(coalesce(p.rama_que_educa, ''), ' ', '')), '[;,|]'))))
  );
$$;

create or replace function private.can_own_ppp(p_rama text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_rama in ('pioneros', 'rover') and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.account_status = 'activo' and p.internal_access is true
      and p.internal_unit = p_rama
      and lower(coalesce(p.rol_adulto, '')) not in ('educador', 'educador/a', 'educadora')
  );
$$;

revoke all on function private.can_read_internal_unit(text), private.can_publish_internal_unit(text), private.can_own_ppp(text) from public, anon;
grant execute on function private.can_read_internal_unit(text), private.can_publish_internal_unit(text), private.can_own_ppp(text) to authenticated, service_role;

alter table public.rama_documentos add column if not exists categoria text not null default 'general';
alter table public.rama_documentos drop constraint if exists rama_documentos_categoria_check;
alter table public.rama_documentos add constraint rama_documentos_categoria_check
  check (categoria in ('general', 'formulario', 'biblioteca'));
alter table public.rama_documentos enable row level security;

-- Replace older permissive policies, including the historical public read.
do $$ declare item record; begin
  for item in select policyname from pg_policies where schemaname = 'public' and tablename = 'rama_documentos' loop
    execute format('drop policy %I on public.rama_documentos', item.policyname);
  end loop;
end $$;
revoke all on public.rama_documentos from public, anon;
grant select, insert, delete on public.rama_documentos to authenticated;
create policy rama_documentos_read_unit on public.rama_documentos for select to authenticated
  using (private.can_read_internal_unit(rama));
create policy rama_documentos_publish_unit on public.rama_documentos for insert to authenticated
  with check (subido_por = (select auth.uid()) and private.can_publish_internal_unit(rama)
    and storage_path like 'rama_' || rama || '/%');
create policy rama_documentos_delete_unit on public.rama_documentos for delete to authenticated
  using (private.can_publish_internal_unit(rama));
create index if not exists rama_documentos_category_unit_created_idx
  on public.rama_documentos (categoria, rama, created_at desc);

-- Restrictive policies close older broad Storage grants for this bucket.
update storage.buckets set public = false where id = 'rama-documentos';
create policy rama_docs_unit_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'rama-documentos'
    and name ~ '^rama_(lobatos|tropa|pioneros|rover)/'
    and private.can_publish_internal_unit(replace(split_part(name, '/', 1), 'rama_', '')));
create policy rama_docs_unit_remove on storage.objects for delete to authenticated
  using (bucket_id = 'rama-documentos'
    and name ~ '^(rama_)?(lobatos|tropa|pioneros|rover)/'
    and private.can_publish_internal_unit(replace(split_part(name, '/', 1), 'rama_', '')));
create policy rama_docs_unit_read_guard on storage.objects as restrictive for select to public
  using (bucket_id <> 'rama-documentos' or (
    name ~ '^(rama_)?(lobatos|tropa|pioneros|rover)/'
    and private.can_read_internal_unit(replace(split_part(name, '/', 1), 'rama_', ''))));
create policy rama_docs_unit_insert_guard on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'rama-documentos' or (
    name ~ '^(rama_)?(lobatos|tropa|pioneros|rover)/'
    and private.can_publish_internal_unit(replace(split_part(name, '/', 1), 'rama_', ''))));
create policy rama_docs_unit_delete_guard on storage.objects as restrictive for delete to public
  using (bucket_id <> 'rama-documentos' or (
    name ~ '^(rama_)?(lobatos|tropa|pioneros|rover)/'
    and private.can_publish_internal_unit(replace(split_part(name, '/', 1), 'rama_', ''))));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ppp-files', 'ppp-files', false, 20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.ppp_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  rama text not null check (rama in ('pioneros', 'rover')),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_at timestamptz not null default now()
);
create index if not exists ppp_files_owner_created_idx on public.ppp_files (owner_id, created_at desc);
create index if not exists ppp_files_rama_created_idx on public.ppp_files (rama, created_at desc);
alter table public.ppp_files enable row level security;
revoke all on public.ppp_files from public, anon;
grant select, insert, delete on public.ppp_files to authenticated;
create policy ppp_files_read on public.ppp_files for select to authenticated
  using ((owner_id = (select auth.uid()) and private.can_own_ppp(rama))
    or private.can_publish_internal_unit(rama));
create policy ppp_files_insert on public.ppp_files for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.can_own_ppp(rama)
    and storage_path like (select auth.uid())::text || '/' || rama || '/%');
create policy ppp_files_delete on public.ppp_files for delete to authenticated
  using (owner_id = (select auth.uid()) and private.can_own_ppp(rama));

create policy ppp_storage_read on storage.objects for select to authenticated
  using (bucket_id = 'ppp-files' and exists (
    select 1 from public.ppp_files f where f.storage_path = name
      and ((f.owner_id = (select auth.uid()) and private.can_own_ppp(f.rama))
        or private.can_publish_internal_unit(f.rama))));
create policy ppp_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ppp-files' and split_part(name, '/', 1) = (select auth.uid())::text
    and private.can_own_ppp(split_part(name, '/', 2)));
create policy ppp_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'ppp-files' and split_part(name, '/', 1) = (select auth.uid())::text
    and private.can_own_ppp(split_part(name, '/', 2)));

-- Guard against unrelated permissive policies on storage.objects.
create policy ppp_storage_read_guard on storage.objects as restrictive for select to public
  using (bucket_id <> 'ppp-files' or (auth.uid() is not null and exists (
    select 1 from public.ppp_files f where f.storage_path = name
      and ((f.owner_id = (select auth.uid()) and private.can_own_ppp(f.rama))
        or private.can_publish_internal_unit(f.rama)))));
create policy ppp_storage_insert_guard on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'ppp-files' or (
    split_part(name, '/', 1) = (select auth.uid())::text
    and private.can_own_ppp(split_part(name, '/', 2))));
create policy ppp_storage_delete_guard on storage.objects as restrictive for delete to public
  using (bucket_id <> 'ppp-files' or (
    split_part(name, '/', 1) = (select auth.uid())::text
    and private.can_own_ppp(split_part(name, '/', 2))));

commit;
