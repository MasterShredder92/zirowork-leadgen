# Handoff

VERIFIED: Migration COMPLETE — all phases 0–5 gated. Cold-clone BUILD VERIFY: PASS, 2026-06-21.

## Cold-clone proof (final close)

`bash _migration/verify-build.sh` from clean clone → `BUILD VERIFY: PASS` / `exit=0`.

```
=== build ===  exit=0  (24 pages, Turbopack, no import-time throws)
=== tsc ===    exit=0
=== lint ===   exit=0  (10 pre-existing no-img-element warnings, 0 errors)
=== serve ===
http=307  operator / (auth redirect)
http=307  operator /insights (auth redirect)
http=200  schools /piano
http=200  schools /signup
http=200  schools /thank-you
http=200  schools /confirm
http=200  dashboard /?preview
BUILD VERIFY: PASS
```

## What landed this session (commits 1809a8f → 9adc7b7)

- `chore(phase-5/close)`: render-diff harness retired + legacy SPAs deleted + verify-build.sh added
  - Deleted: render-diff.mjs, legacy-server.mjs, verify-phase-3-views.sh, snapshots/
  - Deleted: root 96-public/, 99-agents/, dashboard/, legal/, schools/
  - Added: _migration/verify-build.sh (standing build gate)
  - Updated: _migration/DECISIONS.md (retirement decision recorded)
- `chore`: HASHES.txt regenerated (8 gates after verify-phase-3-views.sh removal)
- `fix(gates)`: verify-final.sh dangling ref to deleted verify-phase-3-views.sh removed; HASHES.txt re-regen

## Key decisions made

- Render-diff retired: app never shipped / zero customers → pixel-fidelity has no value.
- New definition of done: `bash _migration/verify-build.sh` (clean-clone build + tsc + lint + routes serve).
- client.ts already lazy (Proxy pattern, getClient() defers createClient to first use) — no import-time landmine.
- gate-integrity PASS ≠ gates work: integrity hashes files; cannot see a gate's internal calls. verify-final.sh had a dangling call to the deleted gate that gate-integrity couldn't catch.
- <img> warnings (10) are pre-existing migration carry-overs; not errors; not gated.

## Invariants that must not break

- test-fixture slug in live Supabase (clients + agent_tenants + client_pages). Gates depend on it. Never delete.
- Agent never touches HASHES.txt. Only Zach runs `gate-integrity.sh --update` and commits the result.
- proxy.ts (not middleware.ts) is the Next.js 16 auth convention.

## NEXT: North-path engine (see _migration/north-path-plan.md)

**Phase 1** — Excise 2nd CRM from 94-knowledge/schema.sql (families/students/teachers/lessons/payroll/financials docs only; live table drops are a separate Supabase decision).
**Phase 2** — Isolate vertical vocab into src/config/vertical.ts (programColor, instrument labels, entity names).
**Phase 3** — Connector abstraction + Tier C: src/lib/connectors/types.ts interface + Supabase-backed availability/booking store.
