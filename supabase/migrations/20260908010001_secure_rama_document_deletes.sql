-- Allow global admins/moderators to manage rama documents directly from Supabase.
-- The frontend still uses deleteDocumento(), but RLS is the authority.

begin;

alter table public.rama_documentos enable row level security;

drop policy if exists "educators_can_delete_rama_documentos" on public.rama_documentos;
drop policy if exists "admins_can_delete_rama_documentos" on public.rama_documentos;

create policy "admins_can_delete_rama_documentos"
  on public.rama_documentos for delete
  to authenticated
  using (
    subido_por = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('admin', 'mod')
          or p.rol_adulto::text = '1'
        )
    )
  );

drop policy if exists "Authenticated users can delete" on storage.objects;
drop policy if exists "Authenticated users can delete documents" on storage.objects;
drop policy if exists "rama_docs_admin_delete" on storage.objects;
create policy "rama_docs_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'rama-documentos'
    and (
      owner_id = auth.uid()
      or exists (
        select 1
        from public.profiles p
        where p.user_id = auth.uid()
          and lower(coalesce(p.role, '')) in ('admin', 'mod')
      )
    )
  );

commit;
