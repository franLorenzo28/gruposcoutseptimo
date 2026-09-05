# Despliegue seguro del backend

## Orden obligatorio

1. Desplegar Fastify con `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ORIGIN` y al menos un bootstrap en `ADMIN_USER_IDS` o `ADMIN_EMAILS`.
2. Confirmar `GET /health`, `GET /ready` y un login real contra el entorno.
3. Reconciliar el historial de migraciones contra un dump y una copia de seguridad. No usar `supabase db push --include-all`: actualmente intentaría incluir migraciones históricas anteriores a la última versión remota.
4. Aplicar únicamente `20260905002604_harden_backend_security.sql` mediante el proceso de migración revisado del entorno.
5. Desplegar las Edge Functions retiradas para que `approve-registration` y `notify-admin-signup` respondan 410.
6. Configurar el frontend con `VITE_API_BASE` apuntando a Fastify y ejecutar los smoke tests de registro, aprobación, perfil, grupos, follows, mensajes y Storage.

## Incidente de credenciales

La tabla histórica `registration_requests` almacenaba el campo llamado `password_hash`, pero el cliente enviaba allí la contraseña sin hash. La migración borra los valores y elimina la columna; eso no revoca secretos que hayan sido leídos antes. Después del backup forense correspondiente:

- forzar recuperación/cambio de contraseña para todos los correos que tuvieron una solicitud;
- revocar sesiones activas de esas cuentas;
- rotar la service-role y cualquier secreto accesible desde funciones vulnerables;
- revisar logs de acceso y decisiones de registro;
- comunicar el incidente según las obligaciones aplicables.

## Rollback

El código puede volver al release anterior, pero no se debe restaurar `password_hash`, políticas públicas ni las Edge Functions inseguras. Los cambios de RLS y GRANT deben corregirse con otra migración hacia adelante. Antes de aplicar, guardar un dump de sólo esquema y un backup recuperable de datos.

## Verificación

```bash
pnpm check:migrations
pnpm type-check
pnpm lint
pnpm test
pnpm build
pnpm --dir server run ci
pnpm exec supabase db advisors --linked --type security
pnpm exec supabase db advisors --linked --type performance
```

Los advisors se ejecutan de nuevo después de aplicar la migración; correrlos antes sólo describe el estado vulnerable actual.
