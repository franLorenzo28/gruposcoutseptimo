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

## Límites de esta fase

- Activos: configuración validada, seguridad HTTP, cliente Supabase sin sesión persistente, hook de autenticación con `auth.getUser(token)`, errores consistentes, `/health`, `/ready`, OpenAPI en desarrollo y cierre ordenado.
- Aún no migrado: endpoints de negocio del Express legado y llamadas directas del frontend a tablas/RPC. Eso corresponde a las siguientes fases.
- La service-role key es opcional y no se usa en esta base. Los módulos futuros deberán aislarla y nunca reenviarla al navegador.

## Contratos operativos

- `GET /health`: confirma que el proceso HTTP responde; no consulta dependencias.
- `GET /ready`: comprueba en paralelo Supabase Auth y una lectura mínima de `profiles` mediante Data API, ambas con timeout. Devuelve 503 si alguna no está operativa.
- `GET /docs`: Swagger UI solamente con `NODE_ENV=development`.
- Todos los errores incluyen `error.code`, `error.message` y `error.requestId`.

`/ready` está pensado para sondas controladas de infraestructura. Antes de exponerlo a tráfico público sostenido se debe proteger en el proxy o añadir una caché breve, porque cada consulta realiza verificaciones remotas contra Supabase.

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
