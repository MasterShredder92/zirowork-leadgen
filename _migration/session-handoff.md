# Handoff

VERIFIED: Phase 3.7 — AutomationRulesView COMPLETE.
  - render-diff: 0.35% PASS · tsc: 0 errors · eslint: 0 issues
  - flip-state: automation-rules → passing
  - 7 views total passing: insights, bookings, reporting, settings, pages, enrollments, automation-rules

CHANGED (this session):
  - _migration/verify-phase-2.sh — light-token parity uses sed (not awk); test = light>70 (not dark==light); secrets grep more precise (JWT pattern + env-var literal, excludes process.env refs)
  - _migration/epic/GATES/render-diff.mjs — integrations added to VIEW_MAP
  - _migration/epic/GATES/gate-integrity.sh — strip Windows sha256sum binary-mode '*' prefix on HASHES.txt read
  - _migration/epic/GATES/HASHES.txt — regenerated after verify-phase-2 + gate-integrity fixes
  - _migration/epic/GATES/snapshots/ — 8 baselines committed: onboarding, automation-rules, command-center, integrations, conversations, campaigns, clients, studio-map
  - src/app/(operator)/automation-rules/page.tsx — NEW: server page; renders AutomationRulesView
  - src/components/views/AutomationRulesView.tsx — NEW: "use client"; local AutomationRule type; overrides+created derive pattern; color-mix translucent fills; zero new tokens
  - feature_list.json — automation-rules flipped to passing by flip-state
  - _migration/progress.md — 3.7 entry added; NEXT updated to 3.8

CORRECTIONS FROM USER (apply to all future prompts):
  - 10 remaining views, not 8: feature_list.json is the source of truth (command-center, clients, onboarding, campaigns, leads, conversations, escalations, studio-map, automation-rules[now done], integrations)
  - onboarding = dead file trap: 91-auth/onboarding.jsx is NOT loaded anywhere. Live operator view is ClientOnboardingView (02-onboarding/onboarding.jsx, 154 LOC), cross-surface with OnboardForm → Phase 4 surface-split concern. Port last.
  - conversations/integrations hooks warning in prior prompts is STALE: integrations' two hooks (useAgentTenants+useClients) are already in spine; conversations imports zero window.use* hooks.

INTERACTIVE PATH NOTE (automation-rules):
  Toggle/save optimistic paths verified by code review only — not executable until auth + seed data.
  Gate covers empty-state only (no rules → header + empty scroll area, modal closed).

BROKEN: nothing

NEXT BEST STEP: Phase 3.8 — port escalations (208 LOC, next simplest live leaf).
  PROCESS (same as always):
    1. Legacy server on :3001 (Node.js one-liner), Next dev on :3000
    2. Both servers already up in this session — confirm or restart
    3. Read legacy: 04-escalations/escalations.jsx
    4. CREATE src/app/(operator)/escalations/page.tsx + src/components/views/EscalationsView.tsx
    5. Gate: node _migration/epic/GATES/render-diff.mjs compare escalations + npx tsc --noEmit + npx eslint .
    6. node flip-state.mjs → commit

KEY GOTCHAS (carried forward):
  1. Port 3000 may have lingering Python processes — check + kill before running gate.
  2. Legacy server: use Node.js one-liner (not npx serve — redirects / to /login).
  3. flip-state.mjs lives in PROJECT ROOT (not _migration/).
  4. studio-map: window.vis CDN dep — do NOT port until Phase 4 decides CDN strategy.
  5. onboarding: disambiguate dead (91-auth/onboarding.jsx) vs live (02-onboarding/onboarding.jsx) + cross-surface OnboardForm before attempting — port last.
  6. verify-phase-3-views.sh VIEWS array is the source of truth for registered views; add a view only when its baseline PNG is committed (all 16 now committed).
