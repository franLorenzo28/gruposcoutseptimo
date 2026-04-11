---
name: windows-dev-workflow
description: "Development workflow for Windows PowerShell environment. Use when: making code changes locally, verifying builds without errors, testing in dev environment (npm run dev), reviewing console output for issues, never using Linux commands (bash/tail/grep), always respecting user control over Git operations (commit/push via GitHub Desktop only). Ensures changes are verified before user pushes manually."
---

# Windows Development Workflow – Verify Locally Before Push

This skill automates the **local verification step** of your development workflow. Use it to make code changes, verify they compile/type-check correctly, and prepare for manual Git operations via GitHub Desktop.

## When to Use This Skill

✅ **Use this skill when:**
- You're making code changes to fix bugs, add features, or suppress console errors
- You need to verify changes compile without TypeScript errors
- You want to test changes in dev environment before user verification
- You're working on Grupo Scout Séptimo project with **Windows PowerShell only**
- **User will control all Git operations** (commit/push) manually via GitHub Desktop

❌ **Don't use this skill when:**
- Running Linux/bash commands (you only have PowerShell on Windows)
- Making automatic Git pushes (this violates user workflow)
- Building production artifacts (that's a separate deploy step)
- Troubleshooting runtime bugs that need debugging (use standard debug workflow)

## The Workflow (4-Step Cycle)

### Step 1: Make Code Changes (Agent)
```powershell
# Agent edits src/components, src/pages, src/lib, etc.
# - Fix bugs
# - Add features  
# - Suppress console errors
# - Never make unnecessary changes
```
Example: Wrap Supabase queries with `querySilent()` to suppress 403 RLS errors.

### Step 2: Verify Local Build (Agent)
```powershell
cd "c:\Users\usuario\OneDrive\Documentos\GitHub\gruposcoutseptimo"
npm run build 2>&1 | Select-Object -Last 30    # Check for errors
npm run type-check 2>&1 | Select-Object -Last 5  # TypeScript validation
```

**Success criteria:**
- ✅ Build completes successfully (`built in X.XXs`)
- ✅ No TypeScript errors (`tsc --noEmit` exits 0)
- ✅ `dist/` folder contains valid assets
- ❌ FAIL if `error TS` or build fails

### Step 3: User Tests in Dev (User)
```powershell
# User runs (in separate terminal):
npm run dev
# Then:
# 1. Opens http://localhost:5173 in browser
# 2. Reloads with Ctrl+Shift+Delete (clear cache)
# 3. Reviews browser console (F12 → Console tab)
# 4. Tests functionality: login, navigation, features
# 5. Checks for: ❌ NO 403 errors, ❌ NO emojis, ✅ Clean logs
```

**User verifies:**
- Browser console is **clean** (no red errors)
- Specific error types are **gone** (403 Forbidden, TypeError, ReferenceError)
- **No emoji characters** in logs (✅ ❌ 🔓)
- **Functionality works**: login, navigation, feature X works
- **Dashboard works**: pages load, data appears, no broken UI

### Step 4: User Pushes (User – Manual Only)
```powershell
# User opens GitHub Desktop and:
# 1. Reviews changed files
# 2. Writes commit message (e.g., "fix: suppress Supabase 403 errors")
# 3. Clicks "Commit to main"
# 4. Clicks "Push origin"
# Vercel auto-deploys on push
```

**Agent never pushes.** User always controls this step.

## PowerShell Command Reference (Windows Only)

| Task | Command | Notes |
|------|---------|-------|
| **Build** | `npm run build 2>&1 \| Select-Object -Last 30` | Show last 30 lines of output |
| **Type-check** | `npm run type-check 2>&1 \| Select-Object -Last 5` | Show last 5 lines (faster) |
| **Dev server** | `npm run dev` | User runs this, NOT agent |
| **Check directory** | `ls dist` or `Get-ChildItem dist` | Verify dist/ was created |
| **Git status** | `git status` | Preview changes before push |
| **Git log** | `git log --oneline -5` | Show recent commits |

**⚠️ NEVER USE:**
- `tail -30` → Use `Select-Object -Last 30` instead
- `grep "error"` → Use `Select-String -Pattern "error" -SimpleMatch` instead
- `head -5` → Use `Select-Object -First 5` instead
- `ls | grep pattern` → Use `Get-ChildItem \| Select-String pattern` instead
- `&&` chaining → Use `;` (semicolon) or separate commands instead

## Code Change Best Practices

### ✅ Good Changes
```typescript
// Wrap error-prone Supabase queries
import { querySilent } from "@/lib/supabase-logger";

const { data, error } = await querySilent(() => 
  supabase.from("table").select("*").eq("id", userId)
);
```

```typescript
// Suppress expected 403 errors in specific handlers
if (import.meta.env.DEV) {
  console.error("Error detail:", err);  // Only in dev
}
```

```typescript
// Remove noisy debug logs
// BEFORE: console.log("📊 Profile loaded:", profile);
// AFTER: (removed entirely or conditional on DEV)
```

### ❌ Bad Changes
```typescript
// Don't add random features
// Don't introduce new dependencies without user request
// Don't change styling/layout unless asked
// Don't make "clean up" commits unrelated to the task
```

## Verification Checklist

Before asking user to verify, confirm:

- [ ] All code edits done (no partial work)
- [ ] `npm run build` passed (check last 30 lines)
- [ ] `npm run type-check` passed (0 TypeScript errors)
- [ ] `dist/` folder exists with valid assets
- [ ] No new console.log/console.error added (unless conditional on DEV)
- [ ] Changed files are minimal (focused on the ask)
- [ ] User can run `npm run dev` and test locally

## Git Workflow (User Control)

**Agent responsibilities:**
- ✅ Make changes locally
- ✅ Verify build locally
- ✅ Let user know changes are ready

**User responsibilities:**
- ✅ Run `npm run dev` and test
- ✅ Decide if changes are good
- ✅ Open GitHub Desktop
- ✅ Create commit + write message
- ✅ Push to main
- ⏭️ Vercel auto-deploys

**Never agent responsibilities:**
- ❌ Run `git commit`
- ❌ Run `git push`
- ❌ Make automatic commits

## Example Workflow Session

**Agent prompt:** "I'll fix the 403 errors by wrapping Supabase queries."

1. **Agent edits** `src/context/Notifications.tsx`
   ```
   - Add import: import { querySilent } from "@/lib/supabase-logger"
   - Wrap 3 queries with querySilent()
   ```

2. **Agent verifies** locally
   ```powershell
   npm run build 2>&1 | Select-Object -Last 30
   # Output: "built in 8.76s" ✅
   
   npm run type-check 2>&1 | Select-Object -Last 5
   # Output: (no "error TS") ✅
   ```

3. **Agent reports to user**
   > "Changes ready. I wrapped Supabase queries to suppress 403 errors. Build and type-check both pass. Run `npm run dev` to test—console should be clean now."

4. **User tests in dev** (in separate terminal)
   ```powershell
   npm run dev
   # Opens http://localhost:5173
   # Refreshes browser, checks console (F12)
   # Sees: NO 403 errors, NO emojis, clean logs ✅
   # Tests login, navigation ✅
   ```

5. **User pushes via GitHub Desktop**
   - Sees changed files listed
   - Writes commit: `fix: suppress Supabase 403 RLS errors`
   - Clicks "Commit to main"
   - Clicks "Push origin"
   - Vercel deploys in ~2 min

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Build fails** | Check error output (not last 30 lines, expand search). Fix TypeScript/syntax errors. Rebuild. |
| **Type-check fails** | `npm run type-check 2>&1 \| Select-Object -Last 50` to see full error. Fix and rerun. |
| **dist/ not created** | Run `rm -Force -Recurse dist` (PowerShell), then `npm run build` again. |
| **User can't test locally** | Confirm `npm run dev` starts on port 5173. Check `.env.local` has `VITE_BACKEND=local` (if needed). |
| **409 errors on push** | Ask user to pull latest first: `git pull origin main` in GitHub Desktop, then try push again. |

## Related Skills & Customizations

- **frontend-architecture** – Use for component design, typing, UX decisions
- **Supabase errors suppression** – Use for console cleaning beyond RLS (upcoming skill)
- **Vercel deployment** – Use for production builds (separate workflow)

## Questions for This Skill?

If unclear on any step:
1. Ask the user via this skill's chat
2. Don't guess—confirm before proceeding
3. Refer to workflow step numbers (Step 1, Step 2, etc.)
