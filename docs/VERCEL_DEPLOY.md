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

Add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Any other env vars you had in Netlify

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
