begin;

-- Legacy policies query profiles from within a profiles policy, so every
-- authenticated update fails with SQLSTATE 42P17. The safe owner update policy
-- remains in place; administrative writes use the server role.
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admin can delete profiles" on public.profiles;

commit;
