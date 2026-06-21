# Handoff

VERIFIED: Phase 4 CLOSED — verify-phase-4.sh exit 0 from cold clone (origin/main edc6348), 2026-06-21.

## Phase 4 gate — confirmed green
Cold clone at `C:\Users\admin\Desktop\p4-verify`, npm install from scratch, `.env.local` injected,
`bash _migration/verify-phase-4.sh` → `PHASE 4 VERIFY: PASS` / `exit=0`.

4 channels all clear:
- tsc: 0 errors
- eslint: 0 errors (10 pre-existing no-img-element warnings, not introduced by Phase 4)
- next build: 22 pages, exit 0
- surface-serve: `/` `/insights` `/onboard` `/privacy` `/terms` `/dashboard?preview` `/schools/adkins-music-lessons-omaha/piano` → 200; `/onboarding` `/privacy-policy` `/terms-of-service` → 308

## Deferred defects (logged in DECISIONS.md, not Phase 4 blockers)
1. `src/lib/supabase/client.ts` top-level `createClient` throws at import with no env — fix with lazy singleton alongside `@supabase/ssr` work.
2. `verify-phase-4.sh` schools serve checks cover `[instrument]` only — `signup/thank-you/confirm` are gate-blind. Fix in Phase 5 gate-decouple unit (atomic with fixture row change).
3. Both schools serve check and render-diff baseline couple to live `adkins` slug — decouple to fixture in Phase 5 (do both checks together, not piecemeal). See DECISIONS.md §2026-06-21.

## NEXT: Phase 5 — Agent layer
First unit: `_config/` governance docs + one generator→guard→exit-code loop on a real ticket.
NOT the gate-decouple (that's logged, it waits its turn in Phase 5).

Pre-5 tracked changes (separate commits, any order):
- `@supabase/ssr` cookie auth in `proxy.ts` + lazy supabase singleton
- Phase 3.15 ClientOnboardingView (`OnboardForm` is in `src/components/forms/` — unblocked)
- `www/` landing page (home route unhandled)
