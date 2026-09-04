-- Restrict guest access to storage content used by Archivo/Explorar.
-- Movimiento Scout remains public because it does not depend on these buckets.

begin;

update storage.buckets
set public = false
where id in ('gallery', 'cancionero-audios', 'lagerfeuer-files');

-- Remove legacy policies tied to these buckets (public or permissive ones included).
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%bucket_id = ''gallery''%'
        or coalesce(with_check, '') ilike '%bucket_id = ''gallery''%'
        or coalesce(qual, '') ilike '%bucket_id = ''cancionero-audios''%'
        or coalesce(with_check, '') ilike '%bucket_id = ''cancionero-audios''%'
        or coalesce(qual, '') ilike '%bucket_id = ''lagerfeuer-files''%'
        or coalesce(with_check, '') ilike '%bucket_id = ''lagerfeuer-files''%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end;
$$;

-- Read access: authenticated users only.
create policy gallery_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'gallery');

create policy cancionero_audios_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'cancionero-audios');

create policy lagerfeuer_files_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'lagerfeuer-files');

-- Admin check shared predicate.
-- We support both role and rol_adulto fields to keep compatibility.

create policy gallery_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy gallery_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
)
with check (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy gallery_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy cancionero_audios_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cancionero-audios'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy cancionero_audios_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cancionero-audios'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
)
with check (
  bucket_id = 'cancionero-audios'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy cancionero_audios_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cancionero-audios'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy lagerfeuer_files_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lagerfeuer-files'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy lagerfeuer_files_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'lagerfeuer-files'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
)
with check (
  bucket_id = 'lagerfeuer-files'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

create policy lagerfeuer_files_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lagerfeuer-files'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        lower(coalesce(p.role, '')) in ('admin', 'mod')
        or lower(coalesce(p.rol_adulto, '')) = 'admin'
      )
  )
);

commit;
