# AI Coding Agent Instructions

## Project Overview
**Grupo Scout Séptimo** - Full-stack web application for Scout group community.

**Stack**: React 18 + TypeScript (Vite), Express backend, SQLite/PostgreSQL, Supabase auth, TailwindCSS

**Key Docs**: Read RESUMEN.md for project status, SECURITY.md for secrets handling, CHECKLIST.md for quality standards.

## Mandatory Skill Application

- For any request that creates or modifies code in this repository, always apply the `frontend-architecture` skill located at `.github/skills/frontend-architecture/SKILL.md` before implementing changes.
- Treat this skill as required project policy for frontend architecture, typing, folder placement, and UX/performance decisions in this workspace.
- If a task spans customization work and code changes, combine this requirement with the relevant customization guidance, but do not skip `frontend-architecture` for code edits.

---

## Architecture

### Frontend (`src/`)
- **Entry**: `src/App.tsx` - Router setup with lazy-loaded pages, React Query + Supabase auth
- **Routes**: `src/pages/` - Feature pages (Galeria, Eventos, Perfil, Admin), route transitions with Suspense
- **API Layer**: `src/lib/api.ts` - Data fetching with dual backend support (Supabase or local Express)
- **Backend Toggle**: `isLocalBackend()` in `src/lib/backend.ts` switches between APIs via `VITE_BACKEND` env var
- **Auth Context**: `useUser()` hook in `src/hooks/useUser.tsx` - manage auth state, works with Supabase or JWT
- **UI Components**: `src/components/ui/` - shadcn/radix components (Dialog, Dropdown, Tabs, etc.)

**Key Pattern**: Dual-mode architecture allows development against Express backend while production uses Supabase.

### Backend (`server/src/`)
- **Entry**: `server/src/index.ts` - Express app with CORS, Morgan logging, Socket.IO
- **Routes**: 11 API modules (auth, profiles, groups, gallery, events, DMs, admin, etc.) in `server/src/routes/`
- **Database**: `server/src/db.ts` - SQLite with WAL mode (local), queries use prepared statements
- **Auth**: JWT tokens + bcrypt hashing, routes protected with `authMiddleware`
- **Email**: `server/src/email-service.ts` - Nodemailer for verification emails

### Database Schema
SQLite (`server/data/app.db`):
- `users` - Email, password_hash, username, email_verified_at
- `profiles` - Per-user metadata (nombre_completo, fecha_nacimiento, rol_adulto, seisena, patrulla, etc.)
- `follows`, `gallery`, `events`, `dms`, `threads` - Feature tables

---

## Essential Workflows

### Development Setup
```bash
npm install                    # Frontend deps
cd server && npm install       # Backend deps
npm run dev                    # Frontend (port 5173)
npm run dev:server            # Backend (port 4000) in another terminal
npm run dev:all               # Both concurrently
```

**Environment**: Copy `.env.example` → `.env.local`, set `VITE_BACKEND=local` for local development

### Build & Deploy
```bash
npm run build                 # Production build (Vite)
npm run build:staging         # Staging variant with different env vars
npm run deploy:prod           # PowerShell script archives dist/ to artifacts/
```

**Deploy Target**: Vercel (see VERCEL_DEPLOY.md), Netlify, or static hosting

### Testing
```bash
npm run test                  # Vitest unit tests (src/__tests__/)
npm run type-check            # TypeScript validation
npm run lint                  # ESLint with relaxed rules (see eslint.config.js)
```

**Pattern**: Use Zod for schema validation (validation.spec.ts), test form schemas and API contracts.

---

## Code Patterns & Conventions

### API Fetching (Dual Backend)
```typescript
// Use generic apiFetch for local backend, supabase SDK for remote
import { apiFetch, isLocalBackend } from "@/lib/backend";
import { supabase } from "@/integrations/supabase/client";

if (isLocalBackend()) {
  await apiFetch("/profiles/me");  // Express endpoint
} else {
  await supabase.from("profiles").select();  // Supabase
}
```

**Key File**: `src/lib/api.ts` - unified API abstraction for both backends

### Components
- Use lazy loading: `const Page = lazy(() => import("./pages/Page"))`
- Wrap in `Suspense` in router, use `RouteTransition` for page animations
- Access auth via `useUser()` hook
- Validate env vars on load (see `validateEnv()` in main.tsx)

### React Query
`QueryClientProvider` wraps app - use `useQuery`/`useMutation` for data fetching, caching automatic.

### Forms
Use `react-hook-form` + `@hookform/resolvers` + Zod schemas (in `src/lib/validation.ts`):
```typescript
const schema = z.object({ email: z.string().email() });
const form = useForm({ resolver: zodResolver(schema) });
```

### Styling
- **Framework**: TailwindCSS (tailwind.config.ts) + shadcn/radix components
- **Theme**: Dark mode via `next-themes`, scout colors (red, yellow, black) in config
- **Custom**: App.css for animations (Reveal, RouteTransition)

### Backend Routes
New routes follow Express pattern in `server/src/routes/`:
```typescript
router.post("/endpoint", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const data = parsed.data;
  // Query db, return JSON
  res.json({ success: true });
});
```

Use `db.prepare()` for SQLite queries with parameterized statements (prevents SQL injection).

---

## Critical Developer Habits

### Security
1. **NEVER** hardcode API keys - use `import.meta.env.VITE_*`
2. **NEVER** commit `.env*` files (already in `.gitignore`)
3. Read SECURITY.md before adding auth flows
4. Validate inputs server-side with Zod
5. Hash passwords with bcrypt, use JWT for auth

### Build Optimization
- Manual chunks in vite.config.ts: react-vendor, ui-vendor, query-vendor, supabase-vendor
- Tree-shaking enabled, CSS code splitting on
- Assets < 4KB inlined, lazy load below-the-fold images

### Environment Variables
- Frontend: `VITE_*` prefix (accessible in browser)
- Backend: Read from `.env` file via dotenv
- Production: Configure in Vercel/Netlify dashboard, never in code

### Testing
- Write tests for validation schemas, form submission, API contracts
- Use `vitest` with jsdom environment, tests in `src/__tests__/`

---

## File Locations Quick Reference

| Purpose | Path |
|---------|------|
| Frontend routes | `src/pages/` |
| API abstraction | `src/lib/api.ts`, `src/lib/backend.ts` |
| Validation schemas | `src/lib/validation.ts` |
| UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| Backend routes | `server/src/routes/` |
| Database init | `server/src/db.ts` |
| Auth helpers | `server/src/auth.ts`, `src/integrations/supabase/client.ts` |
| Config & env | `vite.config.ts`, `.env.example` |

---

## Common Tasks

**Add new API endpoint**: Create route in `server/src/routes/`, add to `server/src/index.ts`, update `src/lib/api.ts` with dual backend support.

**Add new page**: Create `.tsx` in `src/pages/`, lazy load in `src/App.tsx` router, wrap route in `Suspense`.

**Update database schema**: Modify `server/src/db.ts` SQLite table creation, create migration in `supabase/migrations/` for Supabase sync.

**Deploy**: Run `npm run build`, push to Git, Vercel auto-deploys main branch (see vercel.json).

**Debug backend**: Check `server/src/index.ts` for routes, middleware order matters (CORS, body parser first).
