# Time Keeper — Setup Guide

## What's Been Done

- Next.js 16 scaffolded (App Router, TypeScript, Tailwind v4)
- Dependencies installed: `convex`, `@convex-dev/auth`, `@auth/core@0.37.0`
- All source files written (Convex backend + Next.js frontend)

## What Still Needs to Be Done

Run these commands **in order**. Steps 1–3 are interactive (need a browser/terminal).

### 1. Initialize Convex (needs login)

```bash
npx convex dev
```

- Opens a browser to log in to your Convex account
- Creates the project and writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
- Generates `convex/_generated/` with TypeScript types
- Leave this running — it's the Convex dev server

### 2. Initialize Convex Auth (new terminal)

```bash
npx @convex-dev/auth
```

- Auto-generates JWT keys and pushes them to your Convex deployment

### 3. Set environment variables

```bash
npx convex env set SITE_URL http://localhost:3000
```

Optional — only needed if you want GitHub OAuth:

```bash
npx convex env set AUTH_GITHUB_ID <your_github_client_id>
npx convex env set AUTH_GITHUB_SECRET <your_github_client_secret>
```

GitHub OAuth app callback URL to register: `http://localhost:3000/api/auth/callback/github`

### 4. Initialize shadcn/ui (interactive)

```bash
npx shadcn@latest init
```

When prompted: Default style, any base color, CSS variables = yes.

Then add components (non-interactive):

```bash
npx shadcn@latest add button input badge card separator label
```

### 5. Start dev servers (two terminals)

```bash
# Terminal 1 — already running from step 1, or restart:
npx convex dev

# Terminal 2 — Next.js:
npm run dev
```

App runs at http://localhost:3000

---

## Architecture

**Stack:** Next.js 16 (App Router) + Convex + Convex Auth + Tailwind v4

**Auth:** Email/password + GitHub OAuth via Convex Auth. Route protection in `middleware.ts` — all routes except `/signin` require auth.

**Data model:**

```
tasks        userId, name, tags[], createdAt
sessions     taskId, userId, startTime, endTime (absent = active)
```

One active session per user at a time. Starting a new task auto-stops the current one (`startSession` mutation).

**Pages:**
- `/` — Active timer + new task input + recent tasks list
- `/review` — Time breakdown by task and by tag with date range filter
- `/signin` — Email/password sign in/up + GitHub button

**Key files:**
```
convex/schema.ts          DB schema
convex/auth.ts            Auth providers config
convex/sessions.ts        All session queries/mutations (core logic)
convex/tasks.ts           Task queries/mutations
src/app/layout.tsx        Root layout with Convex providers
src/app/page.tsx          Home page
src/app/review/page.tsx   Review page
src/app/signin/page.tsx   Sign in page
src/components/           All React components
src/lib/                  formatDuration, parseTags utilities
middleware.ts             Route protection
```

---

## Vercel Deployment (when ready)

1. Run `npx convex deploy` to push to production Convex
2. Set `NEXT_PUBLIC_CONVEX_URL` in Vercel project settings (production Convex URL)
3. Update site URL: `npx convex env set SITE_URL https://your-app.vercel.app --prod`
4. Auth secrets (`JWT_PRIVATE_KEY`, `AUTH_GITHUB_*`) stay in Convex only — do not add to Vercel

---

## Verification Checklist

- [ ] Sign up with email+password → lands on `/`
- [ ] Type `"Fix login bug #auth"` → timer starts
- [ ] Type another task → previous timer auto-stops
- [ ] Refresh page → timer still running, elapsed time correct
- [ ] Click Resume on a past task → new session starts
- [ ] Navigate to `/review` → see time totals by task and tag
- [ ] Sign out → redirected to `/signin`
- [ ] Sign back in → data persists
