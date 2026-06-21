# Migration Progress

PHASE: 3 — views: port operator views into Next.js App Router
DONE:
  Phase 0:
  - dep-graph.md     (272 lines) — 66 globals (65 in jsx/js modules + window.sb inline in html); spine/leaf classified; 7 dead-code files flagged; 0 cycles; leaf-first order; OnboardForm marked cross-surface
  - spa-boundaries.md (259 lines) — 4 surfaces inventoried (operator, schools, dashboard, onboard.html); 3 shared local modules (theme.js, icons.jsx, onboard-form.jsx); 7 HTML entry points; routing table verbatim
  - token-map.md     (151 lines) — 57 T tokens tabulated; 43 without CSS var; schools/dashboard = 0 T usage

  Phase 1:
  - Next 16.2.9 + React 19.2.4 + TypeScript strict + Tailwind v4 + ESLint 9 (flat config) scaffolded
  - verify-phase-1.sh exits 0: tsc (noEmit) + eslint + next build + blank-page serve check all pass
  - CLAUDE.md replaced with migration executor map; old operator CRM doc preserved as ARCHITECT.md
  - Tooling scoped to src/ ON PURPOSE — tsconfig + eslint exclude all legacy folders (00-*…99-agents, schools/, dashboard/) until each view migrates into src/. Do not re-include them.
  - .brain/ active instruction runbooks bannered SUPERSEDED — stale instructions neutralized, stale reference docs left for Phase 5 reconciliation

  Phase 2:
  - 2.1 DONE: src/app/globals.css — 72 color tokens + 1 shadow ported verbatim from theme.js; dark default + [data-theme="light"] override; --color-row-hover kept at 0.03 (dark) distinct from --color-hover (0.05); verify-phase-2.sh exits 0 (tsc + eslint + build + parity=72 + row-hover sentinel).
  - 2.2 DECIDED: design-tokens.js NOT ported — 815 lines, only radius.lg/radius.xl consumed (sidebar.jsx), both = Tailwind built-in rounded-lg/rounded-xl (8px/12px). Sidebar uses built-ins at Phase 3; file drops with it. No src/styles/tokens.ts.
  - 2.3 DONE: src/lib/supabase/client.ts (module singleton, anon, no session — mirrors window.sb); src/app/providers.tsx ("use client" boundary; useSyncExternalStore theme, SSR-safe); src/app/layout.tsx (server component; pre-paint themeBoot script; wraps in Providers). @supabase/supabase-js installed. verify-phase-2.sh extended with 2.3 teeth (no hardcoded secrets in src/, serve gate 200 + clean HTML). Gate exits 0.

  - 2.4 Wave A DONE — useIsMobile, useSupabaseTable, useOperatorContext(+useStudioContext stub) ported.
  - 2.4 Wave B DONE — usePages ported. useStudents/useLessons confirmed dead (Phase-0 dead-code list + 0 call sites + not in any index.html) → NOT ported; deferred to 91-auth dead-code sweep.
  - 2.4 Wave C DONE — use-local-data spine ported. 4 derive files (types, rollups, integrations, pageFunnel) + 4 hook files (useRealtimeTable engine, tables, useRollups, usePageFunnel). 4 dead hooks NOT ported (useConversations, useOperatorTasks, useClientReports, useIntegrations). verify-phase-2-waveC.sh exits 0; gate-integrity.sh exits 0. PHASE 2 COMPLETE.

  Phase 3:
  - 3.0 DONE: render-diff gate infrastructure. playwright + pixelmatch + pngjs installed; Chromium headless downloaded. render-diff.mjs (baseline+compare modes); verify-phase-3-views.sh (6-channel bundle: tsc+eslint+build+render-diff+structural+route); GATES/snapshots/insights.png baseline committed. RED-TEST PASSED: gate exits 1 on all 3 non-toolchain channels (99.43% diff, no src/components/, /insights→404). gate-integrity.sh exits 0.
  - 3.1 DONE: shell + InsightsView. lucide-react installed; Plus Jakarta Sans via next/font/google; 10 new CSS tokens; html/body base styles; (operator) route group; OperatorShell "use client" (sidebar, header, theme toggle, user footer); UserMenu "use client" (closed button); InsightsView server component (6 PLAYBOOKS, CSS :hover, color-mix chip bg); public/brand/ bolt assets. verify-phase-3-views.sh exits 0 (all 6 channels): 0.42% render-diff. gate-integrity.sh exits 0. CHECKPOINT: phase-3-shell-insights.md.
  - 3.1 LINEHEIGHT FIX: Root cause — Tailwind Preflight (via `@import "tailwindcss"`) forces buttons to inherit `line-height: 1.5`; legacy index.html has the same 1.5 on html/body but NO Preflight, so its buttons stay at UA normal (~1.286). Each button 3px taller in Next.js → cumulative nav 48px taller → vertical center shift. Fix (spine, not per-button): `button { line-height: normal; }` inside `@layer base` in globals.css covers all 15 remaining views. 0.85% → 0.36%. Subpixel flag removed (zero rendering effect, proved by identical baseline PNG bytes). Gate: PASS. Red-test: InsightsView bg→red 75.6% exit 1, revert back to 0.36% PASS. Shell floor ~0.36%: CDN vs npm lucide-react glyph-edge noise.
  - 3.2 DONE: BookingsView — 8 status/program tokens + optimistic markBooking pattern. flip-state: passing.
  - 3.3 DONE: ReportingView — ROI metrics + SMS counts + enrollment trend. --color-roi-accent token added to globals.css. useClients<Client> typed in tables.ts (spine fix). flip-state: passing.
  - 3.4 DONE: SettingsView — send-window + max-followups config via useAgentTenants. Client type added to types.ts. flip-state: passing.
  - 3.5 DONE: PagesView — 148 LOC, collapsible client groups, status/publish toggle, program + status badges via color-mix. No new tokens. render-diff 0.36%. flip-state: passing.
  - 3.6 DONE: EnrollmentsView — Enrollment type extended (+6 fields). Overrides map for optimistic enroll/lost/charge (avoids set-state-in-effect). Billing via supabase.functions.invoke. No new tokens. render-diff 0.36%. flip-state: passing. Interactive path (enroll/lost/charge) code-reviewed only — not executable until auth + seed data.
  - 3.7 DONE: AutomationRulesView — 176 LOC legacy. Local AutomationRule type (not in types.ts — no hook change needed). Derive pattern: overrides map for optimistic toggle + created array for optimistic insert. color-mix for translucent fills (18→9%, 1A→10%). Zero new tokens. render-diff 0.35%. flip-state: passing. Toggle/save paths code-reviewed only — not executable until auth + seed data.
  - 3.8 DONE: EscalationsView — 208 LOC legacy. No spine hook for escalations table — used useRealtimeTable<Escalation> directly (unfiltered) + client-side `!resolved_at` filter via resolvedIds Set (optimistic removal). Local Escalation + Msg types. Zero effects in component; all setState in onClick→.then handlers. color-mix for badge (9%) + outbound bubble (6%). Zero new tokens. render-diff 0.35%. flip-state: passing. Thread/resolve/forward paths code-reviewed only.
  PHASE-3 SHELL DEBT (deferred, not in static baseline — logged per task spec):
    - Command palette (⌘K overlay)
    - Sidebar user-dropdown
    - Header UserMenu dropdown + signOut
    - Bolt firing animation / ring
    - Theme-toggle circle-reveal animation
    - All mobile (drawer, swipe, MobileHeader, equalizer)
    - TweaksPanel

IN PROGRESS: none

BLOCKED: none

NOTES:
  - 7 files define window globals but load in no surface (see phase-0/dep-graph.md §Dead-Code Candidates) — confirm dead vs. live before porting those views
  - 43 T tokens have no CSS var equivalent; hex dedup table deferred to Phase 2 (rg now available via toolchain)
  - 3 local modules shared across surfaces (theme.js, icons.jsx, onboard-form.jsx); Phase 4 decides separate apps vs route groups
  - Real @supabase/ssr cookie auth is a SEPARATE tracked change — deliberately not built in 2.3. Current client is anon+RLS only.
  - ESLint rule react-hooks/set-state-in-effect requires setState calls inside .then() callbacks, not via void load() pattern. Use useSupabaseTable.ts pattern (query.then inside useEffect).
  - ESLint v9 react-hooks/purity fires on Date.now() inside useMemo — use eslint-disable-next-line react-hooks/purity for rollup-window use cases.
  - Legacy static server: `npx serve .` redirects / → /login on this system; use minimal Node.js http.createServer for baseline generation (see checkpoint phase-3-gate.md §DEVIATIONS).
  - verify-phase-3-views.sh VIEWS array is the source of truth for registered views; add a view only when its baseline PNG is committed.
  - RULE 14 (code overrides docs): Legacy auth is REAL and role-gated — Session.jsx checks app_metadata.role === 'operator' against live Supabase. The "cosmetic auth / isAuthenticated:true" note in any prior doc is stale and superseded by the running code.

NEXT: Phase 3.9 — port next view. 8 passing (insights, bookings, reporting, settings, pages, enrollments, automation-rules, escalations). Remaining (8 operator views, simplest-first): integrations(209), conversations(252), leads(265), campaigns(287), command-center(194), clients(597), studio-map(448/vis.js—defer), onboarding(disambiguate dead vs live + cross-surface first).
