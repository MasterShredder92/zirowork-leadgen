# Phase 4: Surface Map

**Decision Required:** Route-groups (all in `src/app/`) vs separate Next.js apps (monorepo/workspace).

---

## THE 4 SURFACES

| Surface | Auth | Entry | vercel.json Route | Pages | Code (LOC) |
|---|---|---|---|---|---|
| Operator (private) | ✓ RLS, role=operator | `/` (default) | Catch-all `/(...).*` → `/index.html` | 14 ported + 1 pending | 16.7k legacy → ~3.5k (ported) |
| Schools (public) | ✗ | `/schools/:instrument` | `/schools/:path*` → `/schools/index.html` | 8 pages (drums, guitar, piano, vocals, signup, confirm, thank-you, 404) | 3.3k |
| Dashboard (private) | ✓ RLS, role=operator | `/dashboard` | `/dashboard/:path*` → `/dashboard/index.html` | 6 views (billing, login, my-business, overview, pipeline, upload) | 1.5k |
| Public Onboard (public) | ✗ | `/onboard` | `/onboarding` → `/onboard.html` | 1 form (OnboardForm) | 698 (OnboardForm) |

---

## SHARED ASSETS & DEPENDENCIES

| Asset | Used By | Current Path | Migration Notes |
|---|---|---|---|
| OnboardForm | operator (view), public onboard, operator flow | `02-onboarding/onboard-form.jsx` | 698 LOC; shared component; must live in `src/components/` or `src/lib/` so both operator + onboard can import it |
| Theme tokens (T) | operator, schools, dashboard | `92-design/theme.js` | Already ported to `src/app/globals.css` as CSS vars; legacy files can read vars via `getComputedStyle()` |
| Icons (Lucide) | operator, schools, dashboard | `92-design/icons.jsx` (CDN fallback) | Operator uses `lucide-react` npm; schools/dashboard still CDN; Phase 4 decision: upgrade all to npm or keep hybrid |
| Fonts | all | `next/font/google` (operator) | Operator via `layout.tsx`; schools/dashboard still CDN via `<link>`; can inherit font from root layout |
| Supabase client | operator, dashboard | `src/lib/supabase/client.ts` (ported) | Module singleton; schools is public (no auth); operator/dashboard share same anon key |

---

## ROUTING STRATEGY (vercel.json → App Router)

**Current (vercel.json):**
```
/ → catch-all → /index.html (operator, private)
/schools/:path* → /schools/index.html (public)
/dashboard/:path* → /dashboard/index.html (private)
/onboarding → /onboard.html (public form)
/privacy, /terms → static pages in /legal
/home → /www/index.html (landing)
```

**App Router Target:**
```
src/app/
  (operator)/          ← route group, default; RLS-gated, requires operator role
    layout.tsx         (OperatorShell + theme)
    page.tsx           (/insights – InsightsView)
    [view]/page.tsx    (14 views as subpages, e.g., /bookings, /campaigns)
  (public)/
    layout.tsx         (minimal header, no auth check)
    schools/
      layout.tsx       (schools header with nav)
      [instrument]/page.tsx  (instrument detail pages)
      page.tsx         (/schools — search/hero)
      signup/page.tsx  (/schools/signup)
      confirm/page.tsx
      thank-you/page.tsx
      not-found.tsx
    onboard/page.tsx   (/onboard — OnboardForm)
    privacy/page.tsx
    terms/page.tsx
  dashboard/           ← route group, RLS-gated, requires operator role
    layout.tsx         (dashboard header, nav)
    page.tsx           (/dashboard/overview or /dashboard/my-business – default)
    [view]/page.tsx    (6 views)
  (home)/
    page.tsx           (/ or /home – landing)
```

**Routing Rules (Next.js Middleware or API rewrites):**
- `/` → `/(home)/page.tsx` (no route group = implicit catch-all for root)
- `/schools/:path*` → `/(public)/schools/[instrument]/page.tsx`
- `/dashboard` → `/dashboard/page.tsx` (layout checks `useOperatorContext` for role gate)
- `/onboard` (alias for `/onboarding`) → `/(public)/onboard/page.tsx`
- `/privacy`, `/terms` → `/(public)/privacy/page.tsx`, `/(public)/terms/page.tsx`
- All other `/...` → `/(operator)/[view]/page.tsx` (if valid) else 404

**No 301 redirects needed** — same origin, routes map 1:1 from vercel.json to App Router.

---

## DECISION: ROUTE-GROUPS VS SEPARATE APPS

### Route-Groups (Recommended for Phase 4)
**Single Next.js app, multiple route groups:**
```
src/app/(operator)/, (public)/, dashboard/
```
✓ Shared layout, fonts, CSS tokens, Supabase client  
✓ Single build, single deploy  
✓ OnboardForm lives in `src/components/` — both operator view + onboard page import it  
✓ Operator shell layout can conditionally render for `/(operator)/*` only (middleware check)  
✗ All surfaces in same `next build` output (bloat: schools bundle includes operator code, needs proper tree-shaking)  

### Separate Apps (Monorepo, post-Phase-4)
**Three separate Next.js apps:**
- `apps/operator/` (operator CRM)
- `apps/schools/` (public pages)
- `apps/dashboard/` (partner dashboard, if separate)

✓ Independent deploys, independent builds  
✓ Each app only bundles what it needs  
✗ Shared components (OnboardForm) need `@monorepo/ui` package  
✗ More complex initial setup; adds `turbo`/`yarn workspaces`  
✗ Supabase client duplication or shared lib  
✗ Token definitions must be published as npm package  

---

## PHASE 4 LANES (assuming route-groups decision)

| Unit | File(s) | Gate | Owner |
|---|---|---|---|
| **4.1 Operator Surface** | `src/app/(operator)/layout.tsx` (OperatorShell moved) + route 14 views | `/(operator)/insights` 200 + render-diff 0.36% | Zach |
| **4.2 Schools Surface** | `src/app/(public)/schools/` — port 8 pages (3.3k LOC); no auth | `/schools/:instrument` 200 + render-diff | Zach |
| **4.3 Dashboard Surface** | `src/app/dashboard/` — port 6 views (1.5k LOC); RLS gate | `/dashboard` 200 + role gate 403 for non-operator | Zach |
| **4.4 Public Onboard** | `src/app/(public)/onboard/page.tsx` — port OnboardForm; kill onboard.html | `/onboard` 200 + form submission works | Zach |
| **4.5 Routing Rules** | `middleware.ts` (RLS role check) + `next.config.ts` rewrites | all routes 200, old vercel.json routes tested | Zach |
| **4.6 Static Pages** | `/privacy`, `/terms` ported to MDX or HTML pages in `(public)` | `/privacy` 200, `/terms` 200 | Zach |

---

## SHARED COMPONENT: OnboardForm

**Current state:** `02-onboarding/onboard-form.jsx` (698 LOC)
- Used by: operator view (`ClientOnboardingView`), public onboard surface (`onboard.html`)
- Issue: two entry points, one legacy file

**Phase 4 decision:**
- Port `02-onboarding/onboard-form.jsx` → `src/components/forms/OnboardForm.tsx`
- Operator view imports it (already in Phase 3 as a view component)
- Public onboard page imports it (shared)
- Delete legacy `02-onboarding/onboard-form.jsx` once both surfaces verified

---

## DECISION GATE FOR ZACH

**Before opening parallel lanes for 4.1–4.6:**
1. ✓ Route-groups strategy approved? (vs. separate apps)
2. ✓ Operator shell moved into `src/app/(operator)/layout.tsx`? (wraps all 14 views)
3. ✓ OnboardForm ported to `src/components/forms/OnboardForm.tsx`?
4. ✓ RLS role gate strategy chosen (middleware.ts vs. per-layout useEffect)?

Once 1–4 are done, 4.1–4.6 are parallel-safe (zero shared outputs).

---

## NOTES

- **www/index.html** (104 LOC, legacy landing) — Phase 4 can either port to `src/app/(home)/page.tsx` (React/Next.js) or leave static in `public/` and serve from `next.config.ts` rewrites. Recommend port to `(home)/page.tsx` for consistency (one stack).
- **Operator auth** — `Session.jsx` (legacy, Phase 3 reference) checks `window.sb.auth.session()` + role. Target: move RLS gate to middleware or per-route layout. Seed data / testing: `window.sb = null` injection during render-diff (Phase 3 trick) carries into Phase 4 — dashboard/schools tests can also inject fake session.
- **Dashboard vs Operator auth** — Both private, same RLS role check. Phase 4 can decide: shared middleware or separate layout guards.
- **Icons (Lucide)** — Operator uses npm `lucide-react`; schools/dashboard still use CDN fallback `window.LucideReact`. Phase 4 can standardize to npm across all surfaces (cleaner) or leave hybrid. No functional blocker.
