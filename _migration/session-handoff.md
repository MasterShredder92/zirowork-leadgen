# Handoff

VERIFIED: Phase 5 CLOSED — verify-phase-5.sh exit 0, 2026-06-21.

## Phase 5 gate — confirmed green

`bash _migration/verify-phase-5.sh` → `PHASE 5 VERIFY: PASS` / `exit=0`.

Channels all clear:
- gate integrity: PASS
- files present: _config/agent.md, .claude/workflows/gate-guard.md, .claude/workflows/generate-guard-retry.md, src/proxy.ts, src/lib/supabase/server.ts
- proxy.ts: createServerClient + operator role check confirmed
- loop-demo pct.guard.mjs: PASS
- tsc: 0 errors
- eslint: 0 errors (10 pre-existing no-img-element warnings)
- serve: / → 307, /insights → 307 (auth redirect active) | schools test-fixture 4 routes → 200 | dashboard?preview → 200

## What landed this session (commits 76a4aa0 → fbb3143)

- `chore(cleanup)`: deleted .brain/ superseded docs + canonical-crm-schema.md; added _migration/north-path-plan.md
- `feat(phase-5/unit-3)`: @supabase/ssr installed; src/proxy.ts real auth (createServerClient + operator role check); src/lib/supabase/server.ts server client factory; verify-phase-5.sh; gate scripts updated
- `fix(phase-5/unit-3)`: proxy.ts replaces middleware.ts (Next.js 16 convention); middleware.ts deleted
- `chore(gate)`: schools-piano baseline PNG regenerated from test-fixture; HASHES.txt updated

## Key decisions made

- Next.js 16 uses `src/proxy.ts` + `export function proxy()` — `middleware.ts` is deprecated in this version. Auth logic lives in proxy.ts.
- Operator routes (/, /insights, etc.) now redirect unauthenticated requests to /dashboard (307). This is correct post-auth behavior; verify-phase-4.sh updated to expect redirects.
- test-fixture slug seeded in live Supabase (clients + agent_tenants + client_pages). Never delete this row — gates depend on it.
- client.ts lazy singleton already existed via Proxy pattern (no change needed).

## NEXT: North-path engine

Migration is COMPLETE. All phases 0–5 gated. Next work follows _migration/north-path-plan.md:

**Phase 1** — Excise 2nd CRM from 94-knowledge/schema.sql (families/students/teachers/lessons/payroll/financials docs only; live table drops are a separate Supabase decision).
**Phase 2** — Isolate vertical vocab into src/config/vertical.ts (programColor, instrument labels, entity names).
**Phase 3** — Connector abstraction + Tier C: src/lib/connectors/types.ts interface + Supabase-backed availability/booking store.
