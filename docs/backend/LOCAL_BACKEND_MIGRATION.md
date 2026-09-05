# Migracion al backend local

## Contexto y objetivo

El proyecto esta pasando de una arquitectura donde el frontend consume
directamente varias capacidades de Supabase a una arquitectura donde el
backend local concentra toda la aplicacion:

```text
React/Vite
    |
    | HTTP + sesion propia
    v
Fastify local
    |-- autenticacion
    |-- autorizacion
    |-- reglas de negocio
    |-- archivos y eventos
    v
Supabase PostgreSQL
```

El objetivo elegido es que Supabase se use exclusivamente como base de datos.
El navegador no debe usar Supabase Auth, Storage, Realtime, RPC ni Edge
Functions. Fastify debe ser el unico punto de acceso del frontend.

Los archivos se almacenaran en PostgreSQL como `bytea`, tal como se decidio
para esta migracion. Esto elimina las URLs publicas y firmadas de Supabase
Storage, pero exige streaming, limites de tamano y una estrategia de backup.

## Decisiones confirmadas

- Conservar los UUID actuales para no romper perfiles, grupos, mensajes ni notificaciones.
- Crear autenticacion propia en Fastify.
- Forzar restablecimiento de contraseña para las cuentas existentes.
- Migrar Google OAuth al backend local.
- Guardar imagenes, audios y PDFs en PostgreSQL como `bytea`.
- Sustituir Realtime por polling inicialmente; WebSocket/SSE queda para una fase posterior.
- Mantener el modo `AUTH_MODE=supabase` durante la transicion para permitir rollback.

## Implementado

### Autenticacion local inicial

- Migracion `supabase/migrations/20260905010000_create_local_auth_tables.sql`.
- Tablas `public.app_users` y `public.app_sessions`.
- Backfill de UUIDs desde `auth.users` sin eliminar datos historicos.
- Marcado de cuentas existentes con `password_reset_required=true`.
- JWT local con `jti`, hash de sesion y revocacion.
- Endpoints iniciales:
  - `POST /v1/auth/login`
  - `GET /v1/auth/session`
  - `POST /v1/auth/logout`
  - `POST /v1/auth/request-password-reset`
  - `POST /v1/auth/password-reset`
- Configuracion `AUTH_MODE=local` y `JWT_SECRET`.

### Adaptacion inicial del frontend

- `apiFetch` puede usar el token local.
- El login de email/contraseña puede consumir `/v1/auth/login`.
- `AppProviders` puede cargar la sesion local y el perfil desde Fastify.
- `MemberAuthContext` deja de depender del listener de Supabase en modo local.
- El cierre de sesion local revoca la sesion del backend.

### Validacion actual

- Frontend: type-check, lint y tests existentes pasan.
- Backend: type-check, tests y build pasan.

Esto es solamente el primer corte de infraestructura. Todavia no habilita la
opcion 1 completa.

## Pendientes de implementacion

### 1. Completar autenticacion propia

- Implementar registro local sin `supabase.auth.signUp`.
- Crear y actualizar perfiles durante el registro desde Fastify.
- Migrar la aprobacion de cuentas para actualizar `app_users` y `profiles`.
- Enviar por correo los tokens de verificacion y reset; no devolver tokens en produccion.
- Implementar recuperacion, cambio de contraseña y revocacion global de sesiones.
- Implementar Google OAuth con `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y callback propio.
- Manejar correctamente cuentas Google existentes y vincularlas por email.
- Eliminar dependencias de `auth.users`, `auth.uid()` y `auth.jwt()` en triggers, RPC y politicas.
- Crear auditoria de login, reset, OAuth y cambios administrativos.

### 2. Migrar el frontend fuera de Supabase

Eliminar accesos de runtime desde `src/` a:

- `supabase.auth.*` en `Auth`, providers, guards y configuracion.
- `supabase.from(...)` en perfiles, grupos, follows, notificaciones, eventos y consultas auxiliares.
- `supabase.rpc(...)` en conversaciones, directorios, permisos y notificaciones.
- `supabase.storage.*` en galeria, avatares, documentos, audios y grupos.
- `supabase.channel(...)` en mensajes, presencia, grupos y notificaciones.
- `supabase.functions.invoke(...)` en verificacion, contacto y eliminacion de cuenta.

Archivos prioritarios:

- `src/pages/Auth.tsx`
- `src/providers/AppProviders.tsx`
- `src/context/MemberAuthContext.tsx`
- `src/components/EmailVerificationGuard.tsx`
- `src/lib/api.ts`
- `src/lib/backend.ts`
- `src/lib/gallery.ts`
- `src/lib/documentos.ts`
- `src/lib/groups.ts`
- `src/lib/follows.ts`
- `src/lib/dms.ts`
- `src/lib/email-verification.ts`
- `src/context/Notifications.tsx`

El criterio de salida es que una busqueda de runtime no encuentre esos usos
en el navegador:

```bash
rg "supabase|@supabase|storage\.from|channel\(|functions\.invoke|\.rpc\(" src
```

Los tipos generados de Supabase pueden permanecer temporalmente como tipos,
pero no como clientes ejecutados en el browser.

### 3. Sustituir el acceso de datos del servidor

El Fastify actual usa temporalmente `@supabase/supabase-js` y
`SUPABASE_SERVICE_ROLE_KEY` como Data API. Esto permite avanzar, pero no es el
estado final de "Supabase solo base de datos".

Pendiente:

- Añadir `DATABASE_URL` para PostgreSQL.
- Usar `pg` como dependencia de runtime.
- Crear pool, transacciones, timeouts y repositorios parametrizados.
- Migrar los modulos de perfiles, contenido, grupos, social, admin y media a SQL directo.
- Cambiar `/ready` para validar `SELECT 1` en PostgreSQL.
- Retirar `app.supabaseAdmin` del runtime cuando todos los modulos esten migrados.

### 4. Migrar el esquema y las referencias de identidad

Las migraciones existentes contienen referencias a `auth.users` y funciones
que dependen de la identidad de Supabase. Hay que crear migraciones nuevas,
sin reescribir historicas, para:

- Reemplazar FKs hacia `auth.users` por FKs hacia `app_users`.
- Actualizar `registration_requests`, `narrativas`, `messages`,
  `notifications`, `conversation_participants`, documentos, uploads y grupos.
- Reescribir triggers de creacion de perfil y notificaciones.
- Sustituir funciones RPC que usan `auth.uid()`.
- Revisar RLS y `GRANT`; la autorizacion principal pasara a Fastify.
- Hacer backup y reconciliar el historial remoto antes de aplicar cambios.

No ejecutar `supabase db push --include-all` sin comparar el esquema remoto y
las migraciones registradas.

### 5. Migrar media a PostgreSQL

Crear una tabla de objetos multimedia, por ejemplo con:

- `id`, `owner_id`, `bucket`, `path`, `mime_type`, `size_bytes`, `sha256`.
- `content bytea`.
- `created_at`, `updated_at` y estado de borrado.

Implementar en Fastify:

- Upload multipart con limites por tipo y cuenta.
- Descarga autenticada con streaming.
- Soporte de `Range` para audio y archivos grandes.
- Eliminacion autorizada.
- Hashes, limites, cuotas y limpieza de objetos huerfanos.
- Migracion de URLs existentes de Storage a objetos internos.

Mientras esto no exista, `src/lib/backend.ts` y las rutas de media siguen
dependiendo de Storage.

### 6. Sustituir Realtime y Edge Functions

Primera etapa:

- Polling con React Query para mensajes, presencia y notificaciones.
- Invalidacion de cache despues de cada mutacion.
- Eliminar listeners de Supabase Realtime.

Etapa posterior:

- WebSocket o SSE autenticado en Fastify.
- Rooms validadas por pertenencia al grupo o conversacion.
- Eventos emitidos por el backend despues de transacciones exitosas.

Mover a Fastify las funciones de:

- Verificacion de email.
- Contacto.
- Aprobacion y notificaciones administrativas.
- Eliminacion de cuenta.

### 7. Actualizar despliegue y secretos

Backend:

- `AUTH_MODE=local`
- `JWT_SECRET`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- Credenciales SMTP para reset y verificacion.

Frontend:

- `VITE_BACKEND=api`
- `VITE_API_BASE=https://api.dominio-real`
- Eliminar `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_URL` cuando no exista ningun uso de runtime.

La `SERVICE_ROLE_KEY` no debe formar parte de la configuracion del frontend.

## Orden recomendado

1. Aplicar la migracion de tablas locales en un entorno de prueba restaurado desde backup.
2. Completar registro, reset, verificacion, aprobacion y Google OAuth.
3. Cambiar todas las lecturas y mutaciones del frontend a Fastify.
4. Migrar el acceso Fastify de Data API a `pg`/`DATABASE_URL`.
5. Migrar identidad y FKs desde `auth.users` hacia `app_users`.
6. Implementar media en `bytea` y migrar archivos existentes.
7. Sustituir Realtime y Edge Functions por polling y servicios Fastify.
8. Ejecutar smoke tests completos y eliminar el cliente Supabase del bundle.
9. Activar `AUTH_MODE=local` primero en staging y luego en produccion.

## Criterios de finalizacion

La migracion se considera completa cuando:

- El frontend no importa ni ejecuta el cliente Supabase.
- Fastify es el unico punto de acceso a datos, auth, media y eventos.
- Las cuentas existentes pueden establecer una contraseña local sin perder su UUID ni perfil.
- Email/password y Google OAuth funcionan mediante Fastify.
- Mensajes, grupos, follows, notificaciones y permisos no usan RLS/RPC del cliente.
- Los archivos se sirven desde PostgreSQL mediante Fastify.
- No quedan FKs ni triggers de negocio que dependan de `auth.users`.
- `pnpm ci` y `pnpm --dir server run ci` pasan con `AUTH_MODE=local`.
- Se ejecutaron pruebas de rollback, backup y restauracion.

## Estado de activacion

No activar todavia en produccion. El primer corte de autenticacion local esta
implementado, pero registro, Google OAuth, media bytea, migracion de esquema,
Realtime y varios accesos directos del frontend siguen pendientes.
