# Release Preparation Checklist - v1.0.0

**Fecha**: 9 de abril de 2026  
**Estado**: Bugs críticos de security/stability arreglados ✓  
**Build Status**: 18 type errors (pending narrativas schema sync)

---

## 🔴 CRITICAL FIXES APPLIED

### Security Fixes
- [x] **File Upload MIME Validation** (`server/src/routes/uploads.ts`)
  - ✓ Whitelist of allowed MIME types: `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`
  - ✓ Max file size limit: 5MB
  - ✓ Error handler for invalid uploads
  - **Impact**: Prevents exe/script upload attacks, DoS via infinite file size

- [x] **CORS Configuration Tightened** (`server/src/index.ts`)
  - ✓ Changed from `true`  (allow-all) to whitelist of origins
  - ✓ ORIGIN env var used to configure allowed domains
  - ✓ Credentials enabled for cross-domain auth flows
  - **Impact**: Prevents CSRF attacks, unauthorized API access

### Stability Fixes
- [x] **localStorage Error Handling** (`src/App.tsx`, `src/pages/Auth.tsx`)
  - ✓ Wrapped all localStorage.setItem/removeItem in try/catch blocks
  - ✓ App continues functioning if localStorage unavailable (incognito, full storage)
  - ✓ Locations fixed: L135-140 (App.tsx), L165, L238, L254, L526-531 (Auth.tsx)
  - **Impact**: App functions in incognito/private browsers, full localStorage scenarios

- [x] **Subscription Cleanup Memory Leak** (`src/App.tsx` L152)
  - ✓ Fixed: `listener?.unsubscribe()` (was incorrect structure)
  - ✓ Properly destructure auth state listener
  - **Impact**: Prevents memory accumulation in long sessions

- [x] **API Request Timeouts** (`src/lib/backend.ts`)
  - ✓ Added 15-second timeout using AbortController
  - ✓ Applied to both `apiFetch()` and `uploadImage()`
  - ✓ Prevents app hanging if backend is slow/down
  - **Impact**: Better UX when backend has issues

- [x] **OAuth Flow Reliability** (`src/pages/Auth.tsx` L160-180)
  - ✓ Removed unreliable hash access_token parsing
  - ✓ Relies on Supabase onAuthStateChange for session detection
  - ✓ Improved error handling for Google OAuth callback
  - **Impact**: More predictable OAuth login flow

### Type Safety Improvements
- [x] **Eliminate `any` types** (`src/App.tsx`)
  - ✓ Imported `User` from `@supabase/supabase-js`
  - ✓ Created `SupabaseUserWithProfile` combining User + Profile types
  - ✓ Replaced `useState<any | null>` with proper typing
  - **Impact**: Better IDE autocomplete, fewer runtime type errors

### Configuration Fixes
- [x] **tsconfig.json** - Removed deprecated `ignoreDeprecations` option

---

## 📋 REMAINING TYPE ERRORS (Non-Critical)

These don't block runtime but should be addressed before major release:

1. **Narrativas table not in Supabase schema** (src/lib/narrativas.ts)
   - ⚠️ Reason: `"narrativas"` table missing from generated Supabase types
   - ✅ Fix: Run `supabase gen types --local > src/integrations/supabase/types.ts` after schema sync

2. **Component prop mismatches** (src/components/)
   - ⚠️ UserAvatar, OptimizedImage props in NarrativaViewer
   - ✅ Fix: Update component signatures to match usage

3. **Profile column mismatch** (src/lib/admin-permissions.ts L34)
   - ⚠️ Accessing both `rol_adulto` and `role` - unclear which is correct
   - ✅ Fix: Align database schema (profiles table) with code

**Total errors**: 18 type errors (down from 30+ in initial analysis)  
**Build**: Can proceed with `skipLibCheck: true` if needed, but above should be resolved

---

## 🚀 PRE-RELEASE VALIDATION

### Database & Environment Setup
- [ ] Verify `.env.local` configured correctly (VITE_BACKEND, VITE_API_BASE)
- [ ] Test with both `VITE_BACKEND=supabase` and `VITE_BACKEND=local`
- [ ] Ensure Supabase project has email verification enabled
- [ ] Verify upload directory exists and is writable (server/uploads/)
- [ ] Check database migrations are up-to-date

### Core Flows Testing
- [ ] **Signup Flow**
  - [ ] Google OAuth signup works (redirects correctly)
  - [ ] Email verification email is sent
  - [ ] Email verification link works
  - [ ] Profile created successfully
  
- [ ] **Login Flow**
  - [ ] Email + password login works
  - [ ] Google OAuth login works
  - [ ] Session persists after page refresh
  - [ ] Logout clears session properly

- [ ] **File Uploads**
  - [ ] Image upload succeeds (jpg, png, webp)
  - [ ] Non-image upload is rejected with error
  - [ ] Oversized file (>5MB) is rejected
  - [ ] Uploaded images are accessible

- [ ] **User Creation Under Load**
  - [ ] Test 10 concurrent signups (no race conditions)
  - [ ] Verify each user gets unique profile
  - [ ] Check database queries aren't N+1
  - [ ] Monitor memory/CPU usage

### Browser Compatibility
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari (Mac, iOS)
- [ ] Mobile responsiveness

### Browser Features
- [ ] Private browsing / Incognito mode (localStorage fallback)
- [ ] LocalStorage quota exceeded handling (try/catch works)
- [ ] Network timeout handling (15s API requests)

---

## 🔧 DEPLOYMENT CHECKLIST

### Vercel/Netlify/Hosting Setup
- [ ] Set environment variables:
  ```
  VITE_BACKEND=supabase
  VITE_API_BASE=<supabase_url>
  VITE_APP_URL=<production_domain>
  ORIGIN=https://production-domain.com
  ```
- [ ] Verify build succeeds: `npm run build`
- [ ] Test preview deployment before going live
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Set up performance monitoring

### Security Review Checklist
- [x] CORS whitelist configured ✓
- [x] File upload MIME validation ✓
- [x] No hardcoded API keys
- [x] All passwords hashed (bcrypt)
- [x] JWT tokens used for auth
- [ ] Rate limiting on auth endpoints (TODO: implement express-rate-limit)
- [ ] SQL injection prevention (prepared statements used ✓)
- [ ] CSRF protection (tokens validated)
- [ ] Email validation working

### Monitoring & Observability
- [ ] Error tracking setup (Sentry, Rollbar, etc.)
- [ ] Performance metrics (Lighthouse, Web Vitals)
- [ ] Uptime monitoring
- [ ] Database query monitoring
- [ ] API response time tracking
- [ ] User signup/login success rates

---

## 📝 COMMIT MESSAGES FOR CHANGES

```bash
# Security: Validate MIME types and limit file uploads
# Prevents malicious file execution and DoS attacks

# Security: Tighten CORS configuration  
# Only allow configured origins instead of all

# Fix: Handle localStorage errors in auth flow
# App now works in incognito/private browsing modes

# Fix: Memory leak in Supabase auth listener cleanup
# Properly unsubscribe from auth state changes

# Perf: Add 15s timeout to API requests
# Prevents app hanging if backend is unresponsive

# Refactor: Type safety improvements for AuthUser
# Eliminate `any` types, better IDE support

# Chore: Remove deprecated TypeScript config
```

---

## 🎯 KNOWN LIMITATIONS

1. **Narrativas Feature**: Currently broken due to schema mismatch
   - Status: Needs migration/schema sync
   - Impact: Narrativas pages will show type errors
   - Priority: High (before v1.0 release)

2. **Rate Limiting**: Not yet implemented on auth endpoints
   - Recommendation: Add express-rate-limit before production
   - Impact: Vulnerable to brute force attacks
   - Priority: High (before v1.0 release)

3. **Email Verification**: Requires working SMTP
   - Ensure SENDGRID_API_KEY or equivalent configured
   - Test email delivery in staging

4. **Upload Directory**: Must exist and be writable
   - Server needs write permissions to `server/uploads/`
   - Consider cloud storage (S3, Google Cloud) instead

---

## 📞 ROLLBACK PLAN

If issues arise after deployment:

1. **Immediate Rollback**: Revert to last stable commit
   - `git revert <commit-hash>`
   - Redeploy previous version

2. **Database Rollback**: Ensure migrations can be reversed
   - Test `npm run migrate:rollback` in staging first

3. **Communication**: Notify users if prolonged downtime
   - Status page update
   - Email notification if critical features down

---

## ✅ FINAL SIGN-OFF

**Release Readiness**: 🟡 YELLOW (4 critical issues to resolve)

**To Go to Production**:
1. [ ] Resolve narrativas schema mismatch (HIGH PRIORITY)
2. [ ] Implement rate limiting on auth endpoints (HIGH PRIORITY)  
3. [ ] Complete all core flow testing
4. [ ] Verify error tracking is active
5. [ ] Final security audit

**Estimated Time to Fix**: 2-3 hours (narrativas + rate limiting + testing)

