# Handoff

VERIFIED: verify-phase-2-waveC.sh exits 0 (all 6 channels: tsc + eslint + next build + derive fixtures + structural audit + serve gate). gate-integrity.sh exits 0. PHASE 2 COMPLETE.

CHANGED:
  - tsconfig.json — added `"_migration"` to exclude (harness test uses .ts import extensions tsc rejects without allowImportingTsExtensions)
  - eslint.config.mjs — added `"_migration/**"` to globalIgnores (same reason)
  - src/lib/derive/types.ts — created (14 domain types)
  - src/lib/derive/rollups.ts — created (deriveRollups + 2 constants)
  - src/lib/derive/integrations.ts — created (deriveIntegrations)
  - src/lib/derive/pageFunnel.ts — created (parseLeadPage + derivePageFunnel)
  - src/hooks/useRealtimeTable.ts — created (typed realtime engine)
  - src/hooks/tables.ts — created (7 thin wrappers + useAgentTenants safe-col)
  - src/hooks/useRollups.ts — created (composer; uses ziro_messaging_escalations for open-count)
  - src/hooks/usePageFunnel.ts — created (composer)
  - src/hooks/usePages.ts — comment rephrased (literal window.sb in comment tripped structural audit grep)
  - _migration/progress.md — Wave C DONE; Phase 2 COMPLETE; NEXT updated to Phase 3
  - _migration/epic/CHECKPOINTS/phase-2-waveC.md — checkpoint ender written

BROKEN: nothing

NEXT BEST STEP: Phase 3 — BUILD the render-diff gate first (per RUNBOOK, Phase 3 gate is prerequisite before porting any view).
  - No view ports are allowed until the render-diff gate exists and exits non-zero on a broken view.
  - Phase 3 spec lives in _migration/epic/STAGES/ (not yet written — Zach creates it, or the next session builds it per RUNBOOK §PHASE LADDER).
  - Leaf-first order for view porting: start with views that have no inter-view dependencies.

COMMIT PENDING: Zach commits Wave C work. All Wave C files are staged but not committed.
