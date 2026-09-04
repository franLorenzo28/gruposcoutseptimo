# SQL legado de Supabase

Estos archivos estaban dentro de `supabase/migrations/` sin el prefijo numérico que exige Supabase CLI. La CLI los omitía y nunca los consideró parte del historial de migraciones.

Se conservan aquí como referencia porque parte del esquema pudo haberse creado manualmente desde el Dashboard. No deben renombrarse ni ejecutarse en producción sin comparar antes su contenido con el esquema remoto.

Las migraciones nuevas deben crearse con `pnpm exec supabase migration new <nombre>` y usar una versión única de 14 dígitos.
