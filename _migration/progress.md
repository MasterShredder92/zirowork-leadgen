# Migration Progress

PHASE: 2 — spine: tokens + hooks → typed modules
DONE:
  Phase 0:
  - dep-graph.md     (272 lines) — 66 globals (65 in jsx/js modules + window.sb inline in html); spine/leaf classified; 7 dead-code files flagged; 0 cycles; leaf-first order; OnboardForm marked cross-surface
  - spa-boundaries.md (259 lines) — 4 surfaces inventoried (operator, schools, dashboard, onboard.html); 3 shared local modules (theme.js, icons.jsx, onboard-form.jsx); 7 HTML entry points; routing table verbatim
  - token-map.md     (151 lines) — 57 T tokens tabulated; 43 without CSS var; schools/dashboard = 0 T usage

  Phase 1:
  - Next 16.2.9 + React 19.2.4 + TypeScript strict + Tailwind v4 + ESLint 9 (flat config) scaffolded
  - verify-phase-1.sh exits 0: tsc (noEmit) + eslint + next build + blank-page serve check all pass
  - CLAUDE.md replaced with migration executor map; old operator CRM doc preserved as ARCHITECT.md
  - Tooling scoped to src/ ON PURPOSE — tsconfig + eslint exclude all legacy folders (00-*…99-agents, schools/, dashboard/) until each view migrates into src/. Do not re-include them.
  - .brain/ active instruction runbooks bannered SUPERSEDED — stale instructions neutralized, stale reference docs left for Phase 5 reconciliation

  Phase 2:
  - 2.1 DONE: src/app/globals.css — 72 color tokens + 1 shadow ported verbatim from theme.js; dark default + [data-theme="light"] override; --color-row-hover kept at 0.03 (dark) distinct from --color-hover (0.05); verify-phase-2.sh exits 0 (tsc + eslint + build + parity=72 + row-hover sentinel).
  - 2.2 DECIDED: design-tokens.js NOT ported — 815 lines, only radius.lg/radius.xl consumed (sidebar.jsx), both = Tailwind built-in rounded-lg/rounded-xl (8px/12px). Sidebar uses built-ins at Phase 3; file drops with it. No src/styles/tokens.ts.
  - 2.3 DONE: src/lib/supabase/client.ts (module singleton, anon, no session — mirrors window.sb); src/app/providers.tsx ("use client" boundary; useSyncExternalStore theme, SSR-safe); src/app/layout.tsx (server component; pre-paint themeBoot script; wraps in Providers). @supabase/supabase-js installed. verify-phase-2.sh extended with 2.3 teeth (no hardcoded secrets in src/, serve gate 200 + clean HTML). Gate exits 0.

IN PROGRESS: none

BLOCKED: none

NOTES:
  - 7 files define window globals but load in no surface (see phase-0/dep-graph.md §Dead-Code Candidates) — confirm dead vs. live before porting those views
  - 43 T tokens have no CSS var equivalent; hex dedup table deferred to Phase 2 (rg now available via toolchain)
  - 3 local modules shared across surfaces (theme.js, icons.jsx, onboard-form.jsx); Phase 4 decides separate apps vs route groups
  - Real @supabase/ssr cookie auth is a SEPARATE tracked change — deliberately not built in 2.3. Current client is anon+RLS only.

NEXT: Phase 2.4 (hooks — typed wrappers for 93-hooks/ window globals)
COMMIT: phase 1 committed; phase 2.1+2.2 committed; phase 2.3 committed
