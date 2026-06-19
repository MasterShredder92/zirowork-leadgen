# Migration Progress

PHASE: 0 — map terrain
DONE:
  - dep-graph.md     (180 lines) — 67 globals mapped; spine/leaf classified; 7 dead-code files flagged; 0 cycles; leaf-first order
  - spa-boundaries.md (144 lines) — 3 surfaces fully inventoried; 0 shared local modules; routing table verbatim
  - token-map.md     (155 lines) — 57 T tokens tabulated; 43 without CSS var; rowHover asymmetry flagged; schools/dashboard = 0 T usage

IN PROGRESS: none

BLOCKED:
  - 7 files define window globals but load in no surface (see dep-graph.md §Dead-Code Candidates) — architect must confirm dead vs. live before Phase 1
  - rowHover token missing from dark theme — architect must resolve before T migration in Phase 2
  - Schools window.sb init not confirmed (CDN loaded, no inline script found — may be in app.jsx) — verify before Phase 3 schools migration
  - hex/rgba orphan dedup requires rg (ripgrep) — not available on current Windows host; Phase 1 toolchain will provide it

NEXT: Phase 1 (toolchain, empty Next.js app scaffold) — awaiting architect go-ahead
COMMIT: not committed — operator decides
