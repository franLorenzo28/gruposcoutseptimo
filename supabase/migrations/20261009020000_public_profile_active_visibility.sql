begin;

-- Anonymous visitors only see published profiles belonging to active accounts.
-- The public API can then read the same fields with its publishable key.
drop policy if exists profiles_public_active_anon on public.profiles;
create policy profiles_public_active_anon
on public.profiles as restrictive for select to anon
using (account_status = 'activo');

commit;
