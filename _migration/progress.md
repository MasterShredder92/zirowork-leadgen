# Migration Progress

PHASE: 0 — map terrain
DONE:
  - dep-graph.md     (272 lines) — 66 globals (65 in jsx/js modules + window.sb inline in html); spine/leaf classified; 7 dead-code files flagged; 0 cycles; leaf-first order; OnboardForm marked cross-surface
  - spa-boundaries.md (259 lines) — 4 surfaces inventoried (operator, schools, dashboard, onboard.html); 3 shared local modules (theme.js, icons.jsx, onboard-form.jsx); 7 HTML entry points; routing table verbatim
  - token-map.md     (151 lines) — 57 T tokens tabulated; 43 without CSS var; schools/dashboard = 0 T usage

IN PROGRESS: none

BLOCKED:
  - 7 files define window globals but load in no surface (see dep-graph.md §Dead-Code Candidates) — architect must confirm dead vs. live before Phase 1
  - hex/rgba orphan dedup requires rg (ripgrep) — not available on current Windows host; Phase 1 toolchain will provide it

NOTES (documented behavior, not blockers):
  - rowHover absent from dark T object: every consumer reads `T.rowHover || 'rgba(255,255,255,0.03)'` — dark falls back correctly. Migrated dark row-hover value = rgba(255,255,255,0.03)
  - Schools window.sb: schools/app.jsx:3 initializes a module-local Supabase client (not window.sb) — resolved

NEXT: Phase 1 (toolchain, empty Next.js app scaffold) — awaiting architect go-ahead
COMMIT: not committed — operator decides
