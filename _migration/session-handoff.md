# Handoff

VERIFIED: Phase 3.8 — EscalationsView COMPLETE.
  - render-diff: 0.35% PASS · tsc: 0 errors · eslint: 0 issues
  - flip-state: escalations → passing
  - 8 views total passing: insights, bookings, reporting, settings, pages, enrollments, automation-rules, escalations

CHANGED (this session):
  - src/app/(operator)/escalations/page.tsx — NEW: server page; renders EscalationsView
  - src/components/views/EscalationsView.tsx — NEW: "use client"; useRealtimeTable<Escalation> unfiltered + client-side !resolved_at filter via resolvedIds Set; local Escalation + Msg types; zero effects; all setState in onClick→.then; color-mix badge(9%) + outbound bubble(6%); zero new tokens
  - feature_list.json — escalations flipped to passing by flip-state
  - _migration/progress.md — 3.8 entry added; NEXT updated to 3.9

PATTERN NOTE (escalations):
  useRealtimeTable can't express .is('resolved_at', null) — it uses .eq() only.
  Fix: call unfiltered, derive open list client-side with resolvedIds Set for optimistic removal.
  Same pattern applies to any future view that needs IS NULL / IS NOT NULL filtering.

INTERACTIVE PATH NOTE (escalations):
  Thread/resolve/forward paths verified by code review only — not gate-executable until auth + seed data.
  Gate covers empty-state only: header (no badge since 0 open), doctrine callout, "No open escalations."

BROKEN: nothing

ACTIVE CORRECTIONS (from user, apply to all future prompts):
  - 10 total views to port; feature_list.json is source of truth, not prose lists.
  - onboarding: 91-auth/onboarding.jsx is dead (not loaded anywhere). Live view = 02-onboarding/onboarding.jsx, cross-surface with OnboardForm → Phase 4 concern. Port last.
  - conversations/integrations hooks warning in prior prompts is STALE: both hooks already in spine; conversations imports zero window.use* hooks.

NEXT BEST STEP: Phase 3.9 — port integrations (209 LOC, next by simplest-first order).
  Legacy: 13-integrations/integrations.jsx
  Hooks: useAgentTenants + useClients — both already in spine (tables.ts).
  PROCESS:
    1. Read 13-integrations/integrations.jsx
    2. CREATE src/app/(operator)/integrations/page.tsx + src/components/views/IntegrationsView.tsx
    3. Gate: node _migration/epic/GATES/render-diff.mjs compare integrations + npx tsc --noEmit + npx eslint .
    4. node flip-state.mjs → commit

KEY GOTCHAS (carried forward):
  1. Port 3000 may have lingering Python processes — check + kill before running gate.
  2. Legacy server: use Node.js one-liner (not npx serve).
  3. flip-state.mjs lives in PROJECT ROOT.
  4. studio-map: window.vis CDN dep — do NOT port until Phase 4 decides CDN strategy.
  5. onboarding: port last; disambiguate dead vs live + cross-surface first.
