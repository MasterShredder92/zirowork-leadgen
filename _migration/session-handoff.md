# Handoff

VERIFIED: verify-phase-1.sh exits 0 (tsc + eslint + next build + blank-page serve check)

CHANGED:
  - CLAUDE.md → replaced with migration executor map (Next.js phases 0-5)
  - ARCHITECT.md → created; old operator CRM CLAUDE.md preserved here
  - .brain/CLAUDE.md → SUPERSEDED banner added (routes to pre-migration how-to guides)
  - .brain/how-to/session-close/CONTEXT.md → SUPERSEDED banner added
  - .brain/how-to/01-component-edit/CONTEXT.md → SUPERSEDED banner added
  - .brain/how-to/02-api-wire/CONTEXT.md → SUPERSEDED banner added
  - .brain/how-to/03-view-add/CONTEXT.md → SUPERSEDED banner added
  - .brain/how-to/repo-cleanup/CONTEXT.md → SUPERSEDED banner added
  - .brain/whats-left.md → SUPERSEDED banner added
  - _migration/progress.md → Phase 1 marked DONE, Phase 2 set as NEXT
  - _migration/session-handoff.md → this file

BROKEN: nothing

NEXT BEST STEP: begin Phase 2 — port spine (design tokens + shared hooks) to typed modules in src/
  - Start with token-map.md (phase-0/token-map.md) to identify the 57 T tokens
  - Create src/app/globals.css @theme block from the token map
  - Create src/hooks/ typed wrappers for the shared hooks (use-local-data.js, use-studio-context.js)
  - Gate: verify-phase-2.sh must exit 0 before Phase 3
