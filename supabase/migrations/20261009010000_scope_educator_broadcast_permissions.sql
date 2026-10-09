begin;

-- The profile is the role authority; JWT metadata can remain stale after a demotion.
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'mod')
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- Reviews use the API, which validates the recipient, request kind and status.
-- The legacy RPC accepts email patterns as authorization, so retire client access.
revoke all on function public.review_educator_permission_request(uuid, uuid, boolean, text[], text)
  from public, anon, authenticated;
-- The old role RPC lets a moderator edit an administrator's role.
revoke all on function public.update_user_role(uuid, text)
  from public, anon, authenticated;

-- Educators may publish only to an approved assigned unit.
drop policy if exists rama_broadcast_insert_authorized on public.rama_broadcast_messages;
create policy rama_broadcast_insert_authorized
  on public.rama_broadcast_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.is_active_member()
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and (
          lower(coalesce(p.role, '')) in ('admin', 'mod')
          or (
            p.educador_aprobado is true
            and lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
            and (
              case rama when 'lobatos' then 'manada' when 'rover' then 'rovers' else rama end
            ) = any(string_to_array(lower(replace(coalesce(p.rama_que_educa, ''), ' ', '')), ','))
          )
        )
    )
  );

drop policy if exists "rama broadcast delete own or admin" on public.rama_broadcast_messages;
create policy "rama broadcast delete own or admin"
  on public.rama_broadcast_messages for delete to authenticated
  using (
    private.is_active_member()
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and (
          p.user_id = author_id
          or lower(coalesce(p.role, '')) in ('admin', 'mod')
          or (
            p.educador_aprobado is true
            and lower(coalesce(p.rol_adulto, '')) in ('educador', 'educador/a', 'educadora')
            and (
              case rama when 'lobatos' then 'manada' when 'rover' then 'rovers' else rama end
            ) = any(string_to_array(lower(replace(coalesce(p.rama_que_educa, ''), ' ', '')), ','))
          )
        )
    )
  );

commit;
