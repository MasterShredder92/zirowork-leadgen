# Migration Progress

PHASE: 1 — empty toolchain
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

IN PROGRESS: none

BLOCKED: none

NOTES:
  - 7 files define window globals but load in no surface (see phase-0/dep-graph.md §Dead-Code Candidates) — confirm dead vs. live before porting those views
  - 43 T tokens have no CSS var equivalent; hex dedup table deferred to Phase 2 (rg now available via toolchain)
  - 3 local modules shared across surfaces (theme.js, icons.jsx, onboard-form.jsx); Phase 4 decides separate apps vs route groups

NEXT: Phase 2 (spine: tokens + hooks → typed modules)
COMMIT: phase 1 work committed
