# API del Grupo Scout Séptimo

Backend Fastify + TypeScript. Supabase continúa proporcionando PostgreSQL, Auth, Storage y Realtime; esta API concentra validación, autorización y reglas de negocio.

## Requisitos

- Node.js 22 o superior
- pnpm 9.15.4
- Un proyecto Supabase

## Desarrollo

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
copy server/.env.example server/.env
pnpm dev:server
```

Configura como mínimo `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en `server/.env`. En desarrollo la API puede iniciar sin esas variables, pero `/ready` responderá 503. En producción son obligatorias.

## Comandos

```bash
pnpm --dir server run dev
pnpm --dir server run type-check
pnpm --dir server run test
pnpm --dir server run build
pnpm --dir server run ci
```

## Endpoints base

- `GET /health`: liveness del proceso.
- `GET /ready`: disponibilidad de Supabase Auth y del acceso Data API a `profiles`.
- `GET /docs`: Swagger UI, solo en desarrollo.

Las rutas de negocio del servidor Express anterior permanecen en `src/routes/` únicamente como código legado para migrar en las próximas fases; no están montadas en el nuevo punto de entrada.

## Seguridad incluida

- CORS por lista explícita de orígenes.
- Cabeceras de seguridad con Helmet.
- Límite global de peticiones y de tamaño del body.
- IDs de request propagables mediante `x-request-id`.
- Logs JSON con credenciales y tokens redactados.
- Errores con contrato consistente, sin filtrar detalles internos en respuestas 5xx.
- Hook `app.authenticate` que valida bearer tokens mediante `supabase.auth.getUser(token)`.
- Cierre ordenado ante `SIGINT` y `SIGTERM`.

## Docker

La imagen usa Node 22 y debe construirse con la raíz del repositorio como contexto:

```bash
docker build -f server/Dockerfile .
```

Consulta `docs/backend/ARCHITECTURE.md` y `docs/backend/SUPABASE_INVENTORY.md` para las decisiones y riesgos detectados.
