-- Preserve already verified users from legacy automatic verification.
-- This is a one-time backfill so existing users keep access.
-- New users will follow the manual token flow via profiles.email_verified.

do $$
declare
  has_profile_flag boolean;
  has_email_confirmed_at boolean;
  has_confirmed_at boolean;
  updated_count integer := 0;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email_verified'
  ) into has_profile_flag;

  if not has_profile_flag then
    raise notice 'Skip backfill: public.profiles.email_verified no existe.';
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'email_confirmed_at'
  ) into has_email_confirmed_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'confirmed_at'
  ) into has_confirmed_at;

  if has_email_confirmed_at then
    update public.profiles p
    set email_verified = true
    from auth.users u
    where u.id = p.user_id
      and coalesce(p.email_verified, false) = false
      and u.email_confirmed_at is not null;

    get diagnostics updated_count = row_count;
    raise notice 'Backfill email_verified completado (email_confirmed_at). Filas actualizadas: %', updated_count;
    return;
  end if;

  if has_confirmed_at then
    update public.profiles p
    set email_verified = true
    from auth.users u
    where u.id = p.user_id
      and coalesce(p.email_verified, false) = false
      and u.confirmed_at is not null;

    get diagnostics updated_count = row_count;
    raise notice 'Backfill email_verified completado (confirmed_at). Filas actualizadas: %', updated_count;
    return;
  end if;

  raise notice 'Skip backfill: no existe columna de confirmacion en auth.users.';
end;
$$;
