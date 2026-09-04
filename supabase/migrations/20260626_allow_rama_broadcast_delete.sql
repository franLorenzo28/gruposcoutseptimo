begin;

drop policy if exists "rama broadcast delete own or admin" on public.rama_broadcast_messages;
create policy "rama broadcast delete own or admin"
  on public.rama_broadcast_messages
  for delete
  to authenticated
  using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
    )
  );

commit;
