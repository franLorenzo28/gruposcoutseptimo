begin;

-- Storage is staged and SHA-256 checked by scripts/repair-legacy-documents.mjs
-- before this migration. Keep the historical record ID and attribution.
do $$
begin
  if not exists (
    select 1 from public.rama_documentos
    where id = 'd9609d27-9dcd-4cc5-b2ef-3725cf4c5806'
      and rama = 'caminantes'
      and storage_path = 'rama_caminantes/1775960412591-patrulla_adler_1966_elias_regules.png'
      and original_filename = 'patrulla_adler_1966_elias_regules.png'
      and "tamaño" = 380837
  ) then
    raise exception 'El documento histórico de Caminantes cambió; revisar antes de migrar';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'rama-documentos'
      and name = 'rama_tropa/1775960412591-patrulla_adler_1966_elias_regules.png'
      and (metadata->>'size')::bigint = 380837
  ) then
    raise exception 'Falta la copia verificada del documento en Tropa';
  end if;
  if exists (
    select 1 from public.rama_documentos
    where rama not in ('lobatos', 'tropa', 'pioneros', 'rover')
      and id <> 'd9609d27-9dcd-4cc5-b2ef-3725cf4c5806'
  ) then
    raise exception 'Existen otros documentos con unidades no vigentes';
  end if;
end $$;

-- The live legacy constraint admitted Caminantes but excluded Tropa.
alter table public.rama_documentos drop constraint if exists rama_documentos_rama_check;
alter table public.rama_documentos drop constraint if exists valid_rama;

do $$
declare changed integer;
begin
  update public.rama_documentos
  set rama = 'tropa',
      storage_path = 'rama_tropa/1775960412591-patrulla_adler_1966_elias_regules.png'
  where id = 'd9609d27-9dcd-4cc5-b2ef-3725cf4c5806'
    and rama = 'caminantes'
    and storage_path = 'rama_caminantes/1775960412591-patrulla_adler_1966_elias_regules.png';
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'El documento histórico no pudo reclasificarse';
  end if;
end $$;

alter table public.rama_documentos add constraint rama_documentos_rama_check
  check (rama in ('lobatos', 'tropa', 'pioneros', 'rover'));

commit;
