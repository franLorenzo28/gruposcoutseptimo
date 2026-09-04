# Inventario inicial de Supabase

Fecha del relevamiento: 2026-09-04. Fuentes: código, SQL versionado y `supabase migration list` contra el proyecto enlazado. No se aplicaron cambios al esquema remoto.

## Superficie utilizada por la aplicación

Tablas o vistas referenciadas: `profiles`, `eventos`, `notifications`, `gallery_upload_events`, `albums`, `gallery_images`, `follows`, `groups`, `group_members`, `group_messages`, `conversations`, `conversation_participants`, `messages`, `narrativas`, `rama_documentos`, `rama_broadcast_messages`, `media_upload_events`, `registration_requests`, `scoutpedia_topics` y `site_pages`.

RPC referenciados: `update_user_role`, `create_or_get_conversation`, `get_follow_counts`, `create_notification`, `resend_verification_email`, `verify_email_token`, `is_email_registered`, `list_profiles_directory`, `request_educator_permissions`, `simple_review_educator_permission` y `simple_review_user_registration`.

Buckets identificados en código o SQL: `avatars`, `gallery`, `cancionero-audios`, `lagerfeuer-files`, `rama-documentos`, `thread-images` y `group-covers`.

## RLS observado en los archivos versionados

Los SQL habilitan RLS explícitamente para `profiles`, `follows`, `notifications`, `narrativas`, `novedades`, `rama_documentos`, `email_verification_tokens`, `eventos`, `scoutpedia_topics`, `rama_broadcast_messages`, `gallery_upload_events`, `media_upload_events`, `conversations`, `conversation_participants`, `messages` y `registration_requests`. También existen políticas sobre `storage.objects` para varios buckets.

Esto es un inventario del código, no una certificación del estado vivo. `groups`, `group_members`, `group_messages`, `albums`, `gallery_images` y `site_pages` necesitan verificación remota específica porque su creación o su política definitiva no queda demostrada por la cadena versionada actual.

## Estado de migraciones

- La CLI detectó 56 archivos versionados y omitía 17 SQL sin versión. Esos 17 se movieron a `supabase/legacy/` para que no aparenten ser migraciones ejecutables.
- El remoto tiene 36 filas de versión coincidentes y el árbol local muestra 20 entradas pendientes. No deben ejecutarse en bloque hasta validar cada una contra el esquema vivo.
- Existen versiones antiguas duplicadas: `20260101`, `20260427`, `20260621` y `20260817`. Se mantienen porque renombrar versiones ya registradas rompe la correspondencia con el historial remoto.
- `20260429_emergency_disable_rls.sql` desactiva RLS para `rama_documentos`; migraciones posteriores vuelven a crear/configurar esa tabla, pero el estado remoto debe confirmarse explícitamente antes de migrar endpoints sensibles.

## Riesgos que bloquean un `db push` automático

1. No hay garantía de que el esquema creado manualmente coincida con los SQL legados.
2. Hay migraciones locales pendientes con fechas anteriores a cambios ya desplegados.
3. Varias políticas RLS fueron reemplazadas repetidamente; la última definición del archivo no demuestra el estado real del proyecto.
4. Las tablas nuevas necesitan permisos explícitos para quedar expuestas al Data API; no se debe depender de exposición automática.
5. Persisten reglas de autorización históricas basadas en un correo personal o en patrones de correo como `%@admin%` y `%grupo-scout%`; deben sustituirse por roles verificables.
6. La función `public.create_notification(...)` usa `SECURITY DEFINER` y debe restringir el actor y destinatario antes de considerarse segura para clientes autenticados.
7. Las políticas finales de actualización observadas para `messages` y `notifications` necesitan una revisión de `WITH CHECK` para impedir cambios que saquen una fila del alcance autorizado.

Estos puntos deben corregirse mediante una migración nueva y auditable. No se modificarán migraciones que ya puedan estar registradas en el remoto.

## Regla desde ahora

Crear migraciones solo mediante `pnpm exec supabase migration new <nombre>`, revisar RLS y `GRANT` en el mismo cambio, y ejecutar `pnpm check:migrations` antes de integrar. La reconciliación del historial remoto debe hacerse como trabajo separado, con un dump de solo esquema y una copia de seguridad verificada.
