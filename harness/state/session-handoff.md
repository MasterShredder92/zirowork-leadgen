# Handoff

VERIFIED: Migration COMPLETE — all phases 0–5 gated. 2026-06-21/22: harness reorg + domain doc collapse complete.

## Current gate state

`bash harness/gates/verify-build.sh` — build + tsc + lint PASS; serve check FAILS on auth redirect (/ → 200, not 307).

**Known open issue:** `src/proxy.ts` is not wired as Next.js middleware (must be named `src/middleware.ts`). Auth redirect broken. Fix is own commit — rename file + function, confirm verify-build.sh serve check returns to 307.

## What landed 2026-06-21/22

- **Harness reorg** — _config/ + migration gate files relocated to harness/:
  - harness/gates/ · harness/loop/ · harness/state/ · harness/agent.md · harness/README.md
  - gate-integrity.sh depth + list_gates() fixed; HASHES.txt regenerated; red-check passed.
- **Domain doc collapse** — 3 docs deleted, content folded into northstar.md (4-doc set → 1 canonical):
  - Deleted (3): ZiroWork-Client-Flow, 94-knowledge/business-model.md, 94-knowledge/northstar-ideology.md
  - Canonical (survived): 94-knowledge/northstar.md (Domain Model & Invariants)
  - "Is Not" positioning table folded in from business-model.md
  - Dead refs fixed in CONTEXT.md, data-model.md, README.md, zirowork-youratlas-framework.md
  - V1–V4 PASS, Rule 15 red-check PASS
- **verify-phase-north-1.sh** — north-path Phase 1 gate moved from _migration/ → harness/gates/ (2026-06-22).
  Not yet in HASHES.txt — run `gate-integrity.sh --update` + commit when north-path Phase 1 starts.
- **Deferred tracked** — SMS derive layer (integrations.ts still hardcodes openphone)

## Invariants that must not break

- test-fixture slug in live Supabase (clients + agent_tenants + client_pages). Gates depend on it. Never delete.
- Agent never touches HASHES.txt. Only Zach runs `gate-integrity.sh --update` and commits.
- 94-knowledge/northstar.md is the single domain SSOT — no other doc claims primacy.

## NEXT: North-path engine (see harness/north-path-plan.md)

**Fix first** — rename src/proxy.ts → src/middleware.ts + rename export `proxy` → `middleware`; confirm verify-build.sh serve check → 307.

**Phase 1** — Excise 2nd CRM from 94-knowledge/schema.sql.
**Phase 2** — Isolate vertical vocab into src/config/vertical.ts.
**Phase 3** — Connector abstraction + Tier C: src/lib/connectors/types.ts + Supabase-backed availability/booking store.
