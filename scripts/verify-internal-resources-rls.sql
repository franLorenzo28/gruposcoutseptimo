-- Run with `supabase db query --linked --file scripts/verify-internal-resources-rls.sql`.
-- The probe uses existing account roles and rolls back every test row.
begin;

select set_config('app.internal_resource_probe', gen_random_uuid()::text, true);

-- An active Rover can read only Rover files and own PPP files.
select set_config('request.jwt.claim.sub', (
  select user_id::text from public.profiles
  where internal_unit = 'rover' and account_status = 'activo'
  limit 1
), true);
set local role authenticated;
do $$
declare affected integer;
begin
  if auth.uid() is null or not private.can_read_internal_unit('rover')
    or private.can_read_internal_unit('lobatos')
    or private.can_publish_internal_unit('rover')
    or not private.can_own_ppp('rover') then
    raise exception 'Rover beneficiary permissions are incorrect';
  end if;
  if exists (select 1 from public.rama_documentos where rama <> 'rover')
    or exists (select 1 from storage.objects
      where bucket_id = 'rama-documentos' and name !~ '^rama_rover/') then
    raise exception 'Rover beneficiary can read another unit';
  end if;

  begin
    insert into public.rama_documentos
      (rama, nombre, original_filename, mime_type, "tamaño", storage_path, subido_por, categoria)
    values ('rover', 'RLS probe', 'rls-probe.pdf', 'application/pdf', 1,
      'rama_rover/' || current_setting('app.internal_resource_probe'), auth.uid(), 'formulario');
    raise exception 'Rover beneficiary inserted a shared document';
  exception when insufficient_privilege then null;
  end;

  delete from public.rama_documentos where rama = 'rover';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Rover beneficiary deleted a shared document'; end if;

  insert into public.ppp_files
    (owner_id, rama, storage_path, original_filename, mime_type, size_bytes)
  values (auth.uid(), 'rover', auth.uid()::text || '/rover/' || current_setting('app.internal_resource_probe'),
    'rls-probe.pdf', 'application/pdf', 1);
  insert into storage.objects (bucket_id, name, owner_id)
  values ('ppp-files', auth.uid()::text || '/rover/' || current_setting('app.internal_resource_probe'), auth.uid()::text);
  if (select count(*) from public.ppp_files
      where original_filename = 'rls-probe.pdf'
        and storage_path like '%' || current_setting('app.internal_resource_probe')) <> 1
    or (select count(*) from storage.objects
      where bucket_id = 'ppp-files' and name like '%' || current_setting('app.internal_resource_probe')) <> 1 then
    raise exception 'Rover beneficiary cannot read their PPP file';
  end if;
end;
$$;

-- An approved educator can publish in their unit and supervise its PPP files.
reset role;
select set_config('request.jwt.claim.sub', (
  select user_id::text from public.profiles
  where educador_aprobado is true and lower(coalesce(rama_que_educa, '')) = 'rovers'
    and coalesce(role, '') = '' and account_status = 'activo'
  limit 1
), true);
set local role authenticated;
do $$
declare affected integer;
begin
  if auth.uid() is null or not private.can_read_internal_unit('rover')
    or not private.can_publish_internal_unit('rover')
    or private.can_publish_internal_unit('lobatos')
    or private.can_own_ppp('rover') then
    raise exception 'Rover educator permissions are incorrect';
  end if;
  if exists (select 1 from public.rama_documentos where rama <> 'rover') then
    raise exception 'Rover educator can read another unit';
  end if;
  if (select count(*) from public.ppp_files
      where storage_path like '%' || current_setting('app.internal_resource_probe')) <> 1
    or (select count(*) from storage.objects
      where bucket_id = 'ppp-files' and name like '%' || current_setting('app.internal_resource_probe')) <> 1 then
    raise exception 'Rover educator cannot supervise the PPP file';
  end if;

  delete from public.ppp_files
    where storage_path like '%' || current_setting('app.internal_resource_probe');
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Rover educator deleted a beneficiary PPP file'; end if;
  -- Direct DELETE on storage.objects is blocked by storage.protect_delete().
  -- Storage deletion must be verified through the Storage API.

  insert into storage.objects (bucket_id, name, owner_id)
  values ('rama-documentos', 'rama_rover/' || current_setting('app.internal_resource_probe'), auth.uid()::text);
  insert into public.rama_documentos
    (rama, nombre, original_filename, mime_type, "tamaño", storage_path, subido_por, categoria)
  values ('rover', 'RLS probe', 'rls-probe.pdf', 'application/pdf', 1,
    'rama_rover/' || current_setting('app.internal_resource_probe'), auth.uid(), 'formulario');
  if (select count(*) from public.rama_documentos
      where storage_path = 'rama_rover/' || current_setting('app.internal_resource_probe')) <> 1 then
    raise exception 'Rover educator cannot read the new form';
  end if;
end;
$$;

-- An educator of another unit cannot see or publish Rover resources.
reset role;
select set_config('request.jwt.claim.sub', (
  select user_id::text from public.profiles
  where educador_aprobado is true and lower(coalesce(rama_que_educa, '')) = 'manada'
    and coalesce(role, '') = '' and account_status = 'activo'
  limit 1
), true);
set local role authenticated;
do $$
begin
  if auth.uid() is null or private.can_read_internal_unit('rover')
    or private.can_publish_internal_unit('rover')
    or not private.can_read_internal_unit('lobatos')
    or exists (select 1 from public.rama_documentos
      where storage_path = 'rama_rover/' || current_setting('app.internal_resource_probe'))
    or exists (select 1 from public.ppp_files
      where storage_path like '%' || current_setting('app.internal_resource_probe'))
    or exists (select 1 from storage.objects
      where name like '%' || current_setting('app.internal_resource_probe')) then
    raise exception 'Manada educator can access Rover files';
  end if;
end;
$$;

-- An ordinary public account cannot read or publish internal files.
reset role;
select set_config('request.jwt.claim.sub', (
  select user_id::text from public.profiles
  where internal_access is false and account_status = 'activo'
  limit 1
), true);
set local role authenticated;
do $$
begin
  if auth.uid() is null or private.can_read_internal_unit('rover')
    or private.can_publish_internal_unit('rover') or private.can_own_ppp('rover')
    or exists (select 1 from public.rama_documentos)
    or exists (select 1 from public.ppp_files)
    or exists (select 1 from storage.objects
      where bucket_id in ('rama-documentos', 'ppp-files')) then
    raise exception 'Public account can access internal files';
  end if;
  begin
    insert into public.ppp_files
      (owner_id, rama, storage_path, original_filename, mime_type, size_bytes)
    values (auth.uid(), 'rover', auth.uid()::text || '/rover/' || current_setting('app.internal_resource_probe'),
      'rls-probe.pdf', 'application/pdf', 1);
    raise exception 'Public account inserted a PPP file';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- The owner still sees their PPP file and the educator's shared document.
reset role;
select set_config('request.jwt.claim.sub', (
  select user_id::text from public.profiles
  where internal_unit = 'rover' and account_status = 'activo'
  limit 1
), true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.ppp_files
      where storage_path like '%' || current_setting('app.internal_resource_probe')) <> 1
    or (select count(*) from public.rama_documentos
      where storage_path = 'rama_rover/' || current_setting('app.internal_resource_probe')) <> 1 then
    raise exception 'Rover beneficiary cannot see the test files';
  end if;
end;
$$;

rollback;
