-- app_users becomes the identity parent for every remaining public business
-- table. The prior migrations backfill all auth.users UUIDs and mirror any
-- identities created while AUTH_MODE=supabase remains available for rollback.
begin;

do $$
declare fk record;
begin
  for fk in
    select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where contype = 'f'
      and confrelid = 'auth.users'::regclass
      and connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', fk.table_name, fk.conname);
    execute format('alter table %s add constraint %I %s', fk.table_name, fk.conname,
      replace(fk.definition, 'REFERENCES auth.users(', 'REFERENCES public.app_users('));
  end loop;
end;
$$;

commit;
