# Documentación del proyecto

El código actual utiliza React 19, Vite 8, Tailwind 3 y una API Fastify en `server/src/`. El workspace se instala desde la raíz con pnpm y requiere Node 22 o superior. Los archivos históricos se conservan como referencia; algunas guías describen etapas anteriores con Express, SQLite o Docker.

## Desarrollo actual

- `pnpm run setup`: instala el workspace y crea archivos de configuración solo cuando faltan. `--check` comprueba el entorno sin instalar ni copiar archivos.
- `pnpm run dev`: inicia web y API. `pnpm dev:web` inicia únicamente Vite.
- `pnpm run ci`: valida los nombres de migraciones, tipos, lint, pruebas y compilaciones de frontend y servidor.
- `pnpm run build:analyze`: genera el build y `artifacts/bundle-analysis.json`, con los bytes y gzip de los scripts iniciales y de la portada.
- `pnpm run optimize:images`: genera las versiones optimizadas y variantes de portada, conservando los originales.
- `pnpm run security:check`: devuelve un fallo si la auditoría detecta problemas moderados o superiores. `pnpm run audit:report` sigue siendo un informe informativo.
- `pnpm run clean --dry-run`: muestra el directorio de build que limpiaría el comando.
- `scripts/stop-dev.ps1 -WhatIf`: muestra la parada prevista; solo considera el Vite de este proyecto y del puerto indicado.

## Arquitectura y operación

- [Migración del backend local](backend/LOCAL_BACKEND_MIGRATION.md): estado y límites de la transición entre proveedores.
- [Despliegue en Vercel](VERCEL_DEPLOY.md).
- [Seguridad](SECURITY.md) y [rotación de credenciales](SECURITY_ROTATION.md).
- [Verificación de correo](EMAIL_VERIFICATION_SUPABASE.md).

Autenticación conserva dos responsabilidades: identidad/perfil en `AppProviders` y acceso de miembro en `MemberAuthContext`. Las consultas simultáneas del perfil propio comparten una petición; no existe una caché permanente que autorice al usuario. Las políticas de acceso se mantienen en las migraciones versionadas.

La mensajería separa la consulta de páginas y resúmenes (`src/lib/message-history.ts`), el estado y la suscripción (`src/hooks/useConversationMessages.ts`) y la presentación (`src/pages/Mensajes.tsx`). Cada página contiene hasta 50 mensajes y permite cargar los anteriores.

## Antecedentes conservados

[RESUMEN.md](RESUMEN.md), [MEJORAS.md](MEJORAS.md), [CHECKLIST.md](CHECKLIST.md), [INSTALACION.md](INSTALACION.md), [COMANDOS.md](COMANDOS.md) y los informes de migración documentan etapas del proyecto. Antes de ejecutar comandos de esas guías, contrastarlos con `package.json` y este índice. El código Express/SQLite y los scripts antiguos se mantienen en sus ubicaciones originales.
