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

Configura `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en `server/.env`. La service-role queda aislada en el proceso del servidor y nunca se envía al navegador. En desarrollo la API puede iniciar sin Supabase, pero los endpoints dependientes responderán 503; en producción las tres variables son obligatorias.

Desde la raíz, `pnpm dev` inicia la web y la API juntas. `pnpm dev:web` inicia sólo Vite. El registro necesita la API incluso con `VITE_BACKEND=supabase`. Deja `VITE_API_BASE` vacío en desarrollo para usar el proxy `/api` de Vite hacia `127.0.0.1:4000`; así también funciona al abrir la web desde otro equipo de la red. Si cambias el puerto de la API, configura `VITE_API_BASE` con su URL accesible desde el navegador.

Si el registro indica que el servicio no está disponible, revisa la salida del proceso `api` y comprueba `http://localhost:5173/api/health`. Un estado `ok` confirma la conexión, pero guardar solicitudes también requiere `SUPABASE_SERVICE_ROLE_KEY` en `server/.env`. Reinicia la API después de cambiar ese archivo. Nunca agregues esta clave a una variable `VITE_`.

Los administradores se autorizan mediante `app_metadata.role` (`admin` o `mod`). `ADMIN_USER_IDS` y `ADMIN_EMAILS` sirven sólo como bootstrap explícito; no se usan patrones de correo ni datos editables del perfil.

## Comandos

```bash
pnpm --dir server run dev
pnpm --dir server run type-check
pnpm --dir server run test
pnpm --dir server run build
pnpm --dir server run ci
```

## Endpoints

- `GET /health`: liveness del proceso.
- `GET /ready`: disponibilidad de Supabase Auth y del acceso Data API a `profiles`.
- `GET /docs`: Swagger UI, solo en desarrollo.
- Registro: `POST /v1/registration-requests`, `POST /v1/registration-requests/oauth` y revisión bajo `/v1/admin/registration-requests`.
- Perfil y acceso: `/v1/me/profile`, `/v1/me/access`, `/v1/profiles`.
- Administración: usuarios, roles, permisos de educador, dashboard y páginas bajo `/v1/admin`.
- Contenido: `/v1/events` y `/v1/narratives`.
- Comunidad: `/v1/groups`, `/v1/follows`, `/v1/dms` y `/v1/notifications`.
- Multimedia: URLs firmadas en `/v1/media`; los bytes van directamente entre el navegador y Supabase Storage.

Las rutas Express/SQLite antiguas no están montadas ni entran en el build de producción. Se conservan temporalmente sólo como referencia de compatibilidad mientras se termina de retirar código frontend no crítico.

## Seguridad incluida

- CORS por lista explícita de orígenes.
- Cabeceras de seguridad con Helmet.
- Límite global de peticiones y de tamaño del body.
- IDs de request propagables mediante `x-request-id`.
- Logs JSON con credenciales y tokens redactados.
- Errores con contrato consistente, sin filtrar detalles internos en respuestas 5xx.
- Hook `app.authenticate` que valida bearer tokens mediante `supabase.auth.getUser(token)`.
- Cliente Supabase por request que reenvía el JWT del usuario para respetar `auth.uid()` y RLS.
- Cliente service-role separado, usado sólo después de guards de autorización.
- Estado de cuenta validado en el servidor para operaciones de comunidad.
- Contraseñas redactadas en logs y enviadas únicamente a Supabase Auth durante el alta; nunca se almacenan en tablas de aplicación.
- Caché breve y deduplicación de la sonda `/ready` para no consumir el Data API por cada health check.
- Cierre ordenado ante `SIGINT` y `SIGTERM`.

## Docker

La imagen usa Node 22 y debe construirse con la raíz del repositorio como contexto:

```bash
docker build -f server/Dockerfile .
```

Consulta `docs/backend/ARCHITECTURE.md` y `docs/backend/SUPABASE_INVENTORY.md` para las decisiones y riesgos detectados.

## Despliegue de la migración de seguridad

La migración `20260905002604_harden_backend_security.sql` no se aplica automáticamente. El historial remoto tiene migraciones locales antiguas pendientes, por lo que un `db push --include-all` sería inseguro. Sigue el orden documentado en `docs/backend/DEPLOYMENT.md`.
