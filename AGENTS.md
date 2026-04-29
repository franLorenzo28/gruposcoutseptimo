# AGENTS.md - Grupo Scout Séptimo

## Verified Commands

```bash
npm run dev          # Start dev server (Vite)
npm run type-check   # TypeScript validation
npm run lint        # ESLint with fix
npm run test       # Vitest
npm run ci         # Full quality gate: type-check + lint + build
npm run dev:server # Optional local Express backend
npm run dev:all   # Both frontend + backend
```

## Architecture

- **Stack**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Dual backend**: Controlled by `VITE_BACKEND` env var:
  - `local` → Express API in `server/` folder
  - `supabase` → Supabase Direct (needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- **Database**: Supabase (PostgreSQL) with RLS policies in `supabase/migrations/`

## Key Files

- `src/lib/supabase.ts` - Supabase client singleton
- `src/lib/backend.ts` - Local backend detection and API wrapper
- `src/components/ui/*.tsx` - shadcn/ui components (modify styles, not structure)
- `tailwind.config.ts` - Design tokens
- `src/styles/global.css` - CSS custom properties and animations

## UI Component Conventions

- Use `cn()` utility from `@/lib/utils` for class merging
- shadcn/ui components are in `src/components/ui/`
- Design system tokens in `src/styles/global.css` (HSL colors, shadows, animations)
- Prefer `Button` variants over custom button styles
- Use `Reveal` component for scroll-triggered fade-in animations

## Gotchas

- Local backend requires `npm install` in `/server` folder too
- Supabase migrations run on deploy; do not edit RLS policies directly in dashboard
- Avoid `npm audit` failures - run `npm run security:check` before deploy
- Images in `src/assets/` are optimized via `scripts/optimize-images.js`