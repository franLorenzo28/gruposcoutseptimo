# AGENTS.md - Grupo Scout Séptimo

## Commands

```bash
pnpm run dev            # Vite (5173) + Fastify API (4000)
pnpm dev:web            # Vite only (registration still requires the API)
pnpm type-check     # tsc --noEmit
pnpm lint           # ESLint
pnpm test           # Vitest (jsdom)
pnpm ci             # type-check + lint + build
pnpm dev:server     # Express backend in /server
pnpm dev:all        # frontend + backend concurrently (same as pnpm dev)
```

## Provider Tree

`main.tsx` → `App.tsx` → `AppProviders` (QueryClient → ThemeProvider → Tooltip → SupabaseUser → Notifications) → BrowserRouter → `AppRoutes` → `AppContent` → `MemberAuthProvider` → `AppRouteTree`

Two auth layers:
- **SupabaseUserProvider** (`src/providers/AppProviders.tsx`): watches `supabase.auth.onAuthStateChange`, fetches profile from `profiles` table, derives `accountStatus`. Provides `{ user, isUserLoading, accountStatus }`.
- **MemberAuthProvider** (`src/context/MemberAuthContext.tsx`): reads/writes `grupo7_member_session` in localStorage. On mount, validates against Supabase user + auto-creates member session from profile if missing. Also subscribes to `onAuthStateChange`. Routes protected by `RequireMemberAuth` redirect to `/interno/login`.

## Auth & Sessions

- `src/integrations/supabase/client.ts` — **custom `getUser()` override** that delegates to `getSession()` to avoid "auth session missing" errors.
- `src/lib/member-auth.ts` — session persistence helpers (`getStoredMemberSession`, `saveMemberSession`, `clearMemberSession`). Key: `grupo7_member_session`.
- `MemberAuthProvider.checkAuth()` — on mount: if Supabase user exists but no member session, auto-fetches profile + calls `resolveMemberAccessFromProfile()` to create session automatically. On Supabase session loss, clears member session.
- `LoginMiembros` (`src/pages/miembros/LoginMiembros.tsx`) — the only page that explicitly creates member sessions via `login()`. Called after email/password login or as reconfirmation step.
- Logout in `InternalPlatformNav` calls both `supabase.auth.signOut()` then `logout()` (clears member session).
- Supabase user is stored in localStorage as `adminUser` (used by `AdminGuard` for legacy pages).

## Routing Structure

- `src/routes/AppRoutes.tsx` — root: `publicRoutes` (no path) + `internalRoutes` (path: `interno`) + `adminRoutes` + compatibilityRoutes
- Public routes (`src/app/routes/public-routes.tsx`): Inicio, Historia, Movimiento Scout, Eventos, Archivo, unidades/*, contacto, etc.
- Internal routes (`src/app/routes/internal-routes.tsx`): dashboard, narrativas, documentos, anuncios, agenda, subidas, planificacion, galeria, jamborees/*, am-lagerfeuer, capsula-tiempo, perfil, configuracion, mensajes, usuarios, grupos/:id
- All lazy-loaded via `src/app/routes/lazy-pages.ts`
- Internal routes use `RequireMemberAuth` (authenticated) or `RequireApproval` (authenticated + approved) guards
- `src/app/layouts/PublicSiteLayout.tsx` and `InternalPlatformLayout.tsx`

## Architecture

- **Stack**: React 18 + TypeScript + Vite 5 + TailwindCSS + shadcn/ui
- **Backend**: Controlled by `VITE_BACKEND` env var — `local` (Express in `/server`) or `supabase` (Supabase Direct)
- **Database**: Supabase (PostgreSQL), RLS policies in `supabase/migrations/`
- **Alias**: `@` → `./src`
- **Design tokens**: `src/styles/global.css` (HSL vars, animations), `tailwind.config.ts`
- **UI components**: `src/components/ui/*.tsx` (shadcn/ui — modify styles, not structure)
- **Icons**: lucide-react

## Key Conventions

- Use `cn()` from `@/lib/utils` for class merging
- `Reveal` component for scroll-triggered fade-in animations
- Prefer `Button` variants over custom button styles
- Images in `src/assets/` optimized via `scripts/optimize-images.js`
- Supabase migrations: apply on deploy, do not edit RLS in dashboard

## Routes Hierarchy (Notable)

| Path | Guard | Component |
|------|-------|-----------|
| `/interno` | — | Redirects to `/interno/dashboard` |
| `/interno/dashboard` | `RequireMemberAuth` | `InternalDashboardPage` with two sections: "Plataforma Interna" (Miembros, Galería, Anuncios) and "Identidad y Grupo" |
| `/interno/auth` | — | Auth page (login/signup/Google OAuth) |
| `/interno/login` | — | LoginMiembros (creates member session) |
| Public `/unidades/*` | — | Public unit pages (Manada, Tropa, Pioneros, Rovers, Staff, Comite) |
| `/veteranos`, `/educadores` | `AdminGuard` | Protected public pages (checks localStorage adminUser + Supabase) |

## Gotchas

- The app **requires** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars (app throws on startup)
- Local backend mode needs `pnpm install` inside `/server` too
- Supabase client's `getUser()` is monkey-patched to use `getSession()` — do not bypass
- `navigate()` after login uses `replace: true` to prevent back-button loops
- `RequireMemberAuth` redirects to `/interno/login` (not `/interno/auth`)
- `RequireApproval` is a stronger guard that checks account status — use for profile/settings/messages
- `AdminGuard` waits for the user provider and authenticated `/v1/me/access` before mounting the entire admin layout. It never trusts `adminUser` storage or a frontend profile role. API failures show a retry screen without mounting the panel.
- `clearMemberSession()` removes the key from localStorage but does NOT call `supabase.auth.signOut()`
- `checkAuth()` in MemberAuthContext runs on mount AND on every `onAuthStateChange` event
