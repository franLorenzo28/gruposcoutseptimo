begin;

-- app_users mirrors Supabase Auth identities but does not reference auth.users.
-- Removing the mirror in the same transaction makes profile/session cleanup
-- atomic with Auth deletion through the existing app_users foreign keys.
create or replace function private.delete_local_identity_after_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.app_users where id = old.id;
  return old;
end;
$$;

revoke all on function private.delete_local_identity_after_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_deleted_local_identity on auth.users;
create trigger on_auth_user_deleted_local_identity
after delete on auth.users
for each row execute function private.delete_local_identity_after_auth_user();

commit;
