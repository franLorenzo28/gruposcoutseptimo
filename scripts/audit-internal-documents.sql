-- Read-only inventory for administrative review.
-- Run with: pnpm exec supabase db query --linked --file scripts/audit-internal-documents.sql
-- This query does not move, delete or expose a Storage object.
select
  d.id,
  d.rama,
  d.categoria,
  d.nombre,
  d.original_filename,
  d.storage_path,
  d.created_at,
  case
    when d.rama not in ('lobatos', 'tropa', 'pioneros', 'rover') and o.id is null
      then 'unidad_no_vigente_y_archivo_ausente'
    when d.rama not in ('lobatos', 'tropa', 'pioneros', 'rover')
      then 'unidad_no_vigente'
    else 'archivo_ausente'
  end as motivo_revision
from public.rama_documentos as d
left join storage.objects as o
  on o.bucket_id = 'rama-documentos' and o.name = d.storage_path
where d.rama not in ('lobatos', 'tropa', 'pioneros', 'rover') or o.id is null
order by d.created_at, d.id;
