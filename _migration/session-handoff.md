# Handoff

VERIFIED: 3 artifacts exist on disk at _migration/phase-0/
  - _migration/phase-0/dep-graph.md       (180 lines)
  - _migration/phase-0/spa-boundaries.md  (144 lines)
  - _migration/phase-0/token-map.md       (155 lines)

CHANGED: created _migration/ directory only; no existing app file was touched

BROKEN: nothing — all greps returned data; 4 minor gaps noted in progress.md blocked list

NEXT BEST STEP: architect reviews the 3 artifacts (especially the 3 items below), then green-lights Phase 1

---

## 3 things for the architect before Phase 1

### (a) Dependency cycles
**None found.** Load order is strictly spine→shell→views→router with no back-edges. `design-tokens.js` reads `window.T` but loads after `theme.js` — satisfied by load order. Safe to migrate spine-first.

### (b) Shared-vs-unique split across surfaces
**Zero shared local modules.** Operator, Schools, and Dashboard each load completely private JS files. CDN deps (React 18.3.1, Babel 7.29.0, Supabase 2.108.1) are identical across all 3 — the only commonality. This means in Next.js terms, the surfaces share _no runtime bundle_ today, but could share a provider and design system if you introduce one. Phase 4 must decide: 3 separate apps vs 1 app with 3 route groups.

### (c) Orphan token count
**43 T tokens have no CSS var equivalent** (only 14 of 57 are synced via `syncVars()`). All 19 operator views access the remaining 43 via `window.T.xxx` inline. Schools and Dashboard have 0 T usage — their colors are entirely surface-private. Full hex dedup table requires `rg` (ripgrep), available after Phase 1 toolchain setup.
