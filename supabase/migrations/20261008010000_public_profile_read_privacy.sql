begin;

-- Public accounts may read their own complete profile. Only members who were
-- manually granted internal access may read other rows directly.
drop policy if exists profiles_select_internal_or_owner on public.profiles;
create policy profiles_select_internal_or_owner
on public.profiles as restrictive for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_active_member())
);

-- Guests can read only the fields displayed on public profile cards. The
-- existing anon row policy still limits these rows to is_public = true.
revoke select on table public.profiles from public, anon;
grant select (
  id, user_id, nombre_completo, username, avatar_url,
  descripcion_personal, is_public
) on table public.profiles to anon;

commit;
