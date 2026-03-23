# Grupo Scout Séptimo de Montevideo

ES: Sitio web oficial del Grupo Scout Séptimo.

EN: Official website of Grupo Scout Séptimo.

ES: Frontend principal con React + TypeScript + Vite, diseño con TailwindCSS y shadcn/ui, y soporte de backend local opcional para desarrollo.

EN: Main frontend built with React + TypeScript + Vite, styled with TailwindCSS and shadcn/ui, with optional local backend support for development.

## ES - Resumen

- Stack frontend: React 18, TypeScript, Vite, React Router, TailwindCSS, shadcn/ui.
- Estado de datos: modo dual (Supabase o backend local según variable de entorno).
- Backend opcional: Express + TypeScript en [server](server).
- Deploy principal: Vercel.

## EN - Summary

- Frontend stack: React 18, TypeScript, Vite, React Router, TailwindCSS, shadcn/ui.
- Data mode: dual mode (Supabase or local backend based on environment variables).
- Optional backend: Express + TypeScript in [server](server).
- Main deployment target: Vercel.

## ES - Puesta en marcha

### Requisitos

- Node.js 20
- npm

### Instalación

```bash
npm install
cd server && npm install
```

### Variables de entorno

1. Copiar plantilla:

```bash
cp .env.example .env.local
```

2. Configurar al menos:

```env
VITE_BACKEND=local
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Notas:

- `VITE_BACKEND=local`: usa API local (Express).
- `VITE_BACKEND=supabase`: usa Supabase en frontend.

## EN - Getting Started

### Requirements

- Node.js 20
- npm

### Install

```bash
npm install
cd server && npm install
```

### Environment variables

1. Copy template:

```bash
cp .env.example .env.local
```

2. Set at least:

```env
VITE_BACKEND=local
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Notes:

- `VITE_BACKEND=local`: uses local API (Express).
- `VITE_BACKEND=supabase`: uses Supabase from frontend.

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Backend

```bash
npm run dev:server
```

### Both

```bash
npm run dev:all
```

### Quality

```bash
npm run type-check
npm run lint
npm run test
npm run ci
npm run security:check
```

## Project Structure

```text
.
├─ src/
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  └─ integrations/
├─ server/
│  ├─ src/
│  └─ data/
├─ docs/
├─ public/
└─ scripts/
```

## Key Routes

- `/` Inicio / Home
- `/historia`
- `/movimiento-scout`
- `/archivo`
- `/archivo/scoutpedia`
- `/archivo/locales`
- `/eventos`
- `/eventos/jamborees`
- `/galeria`
- `/contacto`
- `/area-miembros`

## Documentation

- [docs/RESUMEN.md](docs/RESUMEN.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/CHECKLIST.md](docs/CHECKLIST.md)
- [docs/DEPLOY.md](docs/DEPLOY.md)
- [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)

## Security

ES:

- No subir `.env*` reales al repositorio.
- Revisar [docs/SECURITY.md](docs/SECURITY.md) antes de deploy.
- Ejecutar `npm run security:check` previo a publicar.

EN:

- Do not commit real `.env*` files.
- Review [docs/SECURITY.md](docs/SECURITY.md) before deployment.
- Run `npm run security:check` before publishing.

## Deploy

ES: Producción recomendada: Vercel. También se incluyen scripts de despliegue en [scripts](scripts).

EN: Recommended production target: Vercel. Deployment scripts are also available in [scripts](scripts).

## Historical Archive Notes

- ES: La sección de locales históricos se encuentra en `/archivo/locales`.
- EN: Historical locations are available at `/archivo/locales`.
- ES: Las imágenes sugeridas para esa sección se organizan en [src/assets/locales-historicos](src/assets/locales-historicos).
- EN: Suggested images for that section are organized in [src/assets/locales-historicos](src/assets/locales-historicos).

## License

ES: Proyecto de uso interno/comunitario del Grupo Scout Séptimo.

EN: Internal/community project for Grupo Scout Séptimo.
