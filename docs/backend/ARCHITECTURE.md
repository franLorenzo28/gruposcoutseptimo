# Backend objetivo

## Decisión

El backend HTTP usa Fastify 5, TypeScript y Zod. Supabase sigue siendo el sistema de datos administrado: PostgreSQL, Auth, Storage y Realtime.

El servidor es una capa de aplicación, no una segunda base de datos. Su responsabilidad es verificar identidad, aplicar reglas de negocio, validar contratos, coordinar operaciones y exponer observabilidad. El código Express/SQLite que todavía vive en `server/src/routes/` queda como legado para migrar por módulos; ya no es el punto de entrada de producción.

## Flujo

```text
React/Vite
    |
    | HTTPS + Supabase access token
    v
Fastify API
    |-- validación Zod
    |-- autorización y reglas de negocio
    |-- logs estructurados + request id
    v
Supabase
    |-- Auth
    |-- PostgreSQL + RLS
    |-- Storage
    `-- Realtime
```

## Estado de implementación

- Activos: configuración validada, seguridad HTTP, cliente público, cliente por request y cliente service-role aislados, autenticación, estado de cuenta, roles firmados, errores consistentes, `/health`, `/ready`, OpenAPI y cierre ordenado.
- Migrados a Fastify: registro/aprobación, perfiles, administración de usuarios/roles/permisos, eventos, narrativas, grupos, follows, mensajes, notificaciones y autorización de Storage por URL firmada.
- El frontend ya usa Fastify obligatoriamente para registro, panel administrativo y mensajes del módulo `dms`. Los adaptadores de negocio restantes conservan un modo transicional con `VITE_BACKEND` hasta completar su QA visual.
- Supabase continúa siendo la fuente única de datos; no existe una segunda sesión JWT ni una base SQLite en el runtime activo.

## Contratos operativos

- `GET /health`: confirma que el proceso HTTP responde; no consulta dependencias.
- `GET /ready`: comprueba en paralelo Supabase Auth y una lectura mínima de `profiles` mediante Data API, ambas con timeout. Devuelve 503 si alguna no está operativa.
- `GET /docs`: Swagger UI solamente con `NODE_ENV=development`.
- Todos los errores incluyen `error.code`, `error.message` y `error.requestId`.

`/ready` deduplica comprobaciones concurrentes y cachea el resultado durante `READINESS_CACHE_MS` (5 segundos por defecto).

## Ejecución

```bash
pnpm install --frozen-lockfile
copy server/.env.example server/.env
pnpm dev:server
```

Para verificar el backend:

```bash
pnpm --dir server run ci
```

Para construir la imagen desde la raíz del repositorio:

```bash
docker build -f server/Dockerfile .
```
