# Vercel - Deployment Guide

## Quick Start

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
# First time
vercel login
vercel

# Production
vercel --prod
```

### 3. Add Environment Variables
Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Configure these variables for Production before deploying:

| Variable | Value |
| --- | --- |
| `VITE_BACKEND` | `supabase` |
| `VITE_SUPABASE_URL` | URL of the Supabase project used by this site |
| `VITE_SUPABASE_ANON_KEY` | Public anon key from the same project |
| `SUPABASE_SERVICE_ROLE_KEY` | Private service role key from that same project; server only, never prefix with `VITE_` |
| `AUTH_MODE` | `supabase` |
| `APP_URL` | `https://gruposcoutseptimo.vercel.app` (or the canonical custom domain) |
| `VITE_API_BASE` | Leave unset or use `/api` |

The server reuses the public Supabase variables unless `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` are explicitly set. Keep their
project consistent with the frontend. `APP_URL` defaults to Vercel's production
domain. `ORIGIN` defaults to `APP_URL`; set it explicitly for additional CORS origins.
Set equivalent values separately for Preview if preview deployments need the API.
Redeploy after changing environment variables; existing deployments do not change.

### API in the same deployment

`vercel.json` compiles `server/src/serverless.ts` before building Vite.
`api/index.js` exports the compiled Fastify handler, and `/api/*` rewrites reach
that function before the SPA fallback. The backend does not open a listening port
inside Vercel. The frontend defaults to `/api` in production and development.

The service role key is required at runtime. Without it, the function returns
HTTP 503 JSON (`API_UNAVAILABLE`), and the admin guard shows a retry message.
Do not use `NODE_ENV=development` or weaken authorization to work around missing
credentials. The serverless entrypoint always validates production configuration.

Operational checks: `/api/health` reports liveness, `/api/ready` checks dependencies,
and an unauthenticated `/api/v1/me/access` must return 401 JSON. Opening `/admin`
without a session must redirect to login without mounting the panel.

Administrator access is still determined by trusted server-side role metadata or
the existing explicit server bootstrap configuration. Deploying the API does not
grant administrator access to arbitrary signed-in accounts.

## Auto-deploy from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite settings
4. Add environment variables
5. Deploy!

Now every push to `main` triggers automatic deployment 🚀

## Useful Commands

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# Add env variable
vercel env add VARIABLE_NAME

# Pull env variables to local
vercel env pull
```

## Limits (Hobby Plan - FREE)

- ✅ **6000 build minutes/month** (20x more than Netlify)
- ✅ **100 GB bandwidth**
- ✅ **Unlimited builds**
- ✅ **Unlimited team members**
- ✅ **Free SSL**
- ✅ **Custom domains**

## Migration from Netlify

1. Export env vars from Netlify
2. Import them to Vercel (Dashboard → Settings → Environment Variables)
3. Remove Netlify config files (optional):
   - `netlify.toml`
   - `_redirects`
4. Deploy with `vercel --prod`

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
