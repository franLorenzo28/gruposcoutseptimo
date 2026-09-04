-- Fix profiles UPDATE policy: allow admin/mod to update any profile
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can update own profile" on profiles
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and lower(coalesce(p.role, '')) in ('admin', 'mod')
    )
  ) with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and lower(coalesce(p.role, '')) in ('admin', 'mod')
    )
  );

-- Fix profiles DELETE policy: use role instead of auth.users email
drop policy if exists "Admin can delete profiles" on profiles;

create policy "Admin can delete profiles" on profiles
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  );
