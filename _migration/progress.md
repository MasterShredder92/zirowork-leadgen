# Migration Progress

PHASE: 5 — Agent layer (_config/ governance tokens, .claude/workflows/ orchestrators)
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
  - 3.13 DONE: CampaignsView — 287 LOC legacy, most structurally complex (4 sub-components: FunnelBars, ConversionDonut, TrendChart, CampaignPanel). Dropped T prop entirely; sub-components use var(--token) directly. PROGRAM_VAR map + programColor/statusColor helpers return CSS-var strings for SVG stroke + conic-gradient + color-mix pill bg. Two eslint-disable-next-line react-hooks/purity for Date.now() in useMemo (sinceMs) + TrendChart render-body (startDay). TrendChart useEffect: dropped window.sb guard, supabase singleton, setState in .then success/error callbacks. Row hover: imperative cells loop → declarative hoverId state. Close button: L.X fallback → <X size={18} strokeWidth={1.75} />. Backdrop: rgba(0,0,0,0.45) → var(--color-scrim). Zero new tokens. render-diff 1.00%. flip-state: passing. Detail panel / charts / filters = code-reviewed only.
  - FONT FLOOR FIX (prerequisite for clients): layout.tsx next/font expanded to weights 300–700 + italic + display:swap + adjustFontFallback:false. globals.css explicit font-family on html,body. _migration/DECISIONS.md created with full analysis. Floor is irreducible at 1.00% for text-dense views (CDN-vs-self-hosted byte noise, not regression). If clients exceeds 1.00% → raise DIFF_THRESHOLD to 1.5% per DECISIONS.md.
  PHASE-3 SHELL DEBT (deferred, not in static baseline — logged per task spec):
    - Command palette (⌘K overlay)
    - Sidebar user-dropdown
    - Header UserMenu dropdown + signOut
    - Bolt firing animation / ring
    - Theme-toggle circle-reveal animation
    - All mobile (drawer, swipe, MobileHeader, equalizer)
    - TweaksPanel

  - 3.15 DONE: ClientOnboardingView — 02-onboarding/onboarding.jsx ported. CHECKLIST (6 items: 2 derived read-only, 4 boolean toggleable via supabase singleton). Progress bar + per-client completion %. OnboardForm modal wired via refetch(). `client-onboarding` route added; OperatorShell nav id updated; ClientsView "Add Client" push updated to /client-onboarding. Legacy 02-onboarding/onboarding.jsx + onboard-form.jsx deleted. p4-verify/ added to tsconfig exclude (untracked cold-clone, Deno globals). tsc 0 errors, eslint 0 errors on changed files, next build passes.

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

  - 3.14 DONE: ClientsView (+ ClientDetail panel). 597 LOC legacy. ClientDetail selection-gated (code-review-only); gate sees empty list. 1 new token: --color-client-navy (#1A2B3C). Declarative hoverId row hover. Effects→.then. window.sb/SEED_DATA branches dropped. render-diff 0.36% (shell floor — floor panic was moot; empty list = sparse text). flip-state: passing.

  Phase 4:
  - 4.1 DONE: Operator surface. Deleted src/app/page.tsx (phase-1 blank). Created src/app/(operator)/page.tsx → InsightsView at /. Gate: / → 200, /insights → 200, render-diff 0.52% (< 1.0%), tsc 0 errors, eslint 0 errors, next build 18 pages. Route-groups strategy confirmed: (operator) wraps all 14 views, root layout stays server-only. OperatorShell remains in src/components/shell/ (correct pattern: thin server layout wrapping "use client" component).
  - 4.2 DONE: Schools surface. src/app/(public)/schools/[slug]/[instrument] Server Component; getSchool.ts (client_pages+clients+agent_tenants); 4 landing pages (Piano/Guitar/Vocals/Drums) + signup/thank-you/confirm sub-pages; logPageEvent.ts. Gate: Supabase live data, render-diff 3.41%/5.0% (cross-engine antialiasing noise, visually identical).
  - 4.3 DONE: Dashboard surface. src/app/dashboard/ passthrough → DashboardShell client component; LoginView + 5 portal views; ?preview bypass for unauthenticated baseline capture. Gate: render-diff 0.01%/5.0%.
  - 4.4 DONE: Onboard surface. src/app/(public)/onboard/ + OnboardForm.tsx (698 LOC port of 02-onboarding/onboard-form.jsx). CSS vars fixed: --bg/--accent → --color-bg/--color-accent throughout. Gate: render-diff 0.42%/5.0%.
  - 4.5 DONE: Routing. src/proxy.ts (Next.js 16 proxy convention, not deprecated middleware); route matcher excludes public surfaces; auth stub pass-through (deferred to @supabase/ssr PR). next.config.ts permanent redirects: /onboarding→/onboard, /privacy-policy→/privacy, /terms-of-service→/terms. All redirects return 308.
  - 4.6 DONE: Static pages. src/app/(public)/privacy/ and src/app/(public)/terms/ — inline-style Server Components, no <body>/<style> leakage.
  - Gate infra (with 4.2-4.6): legacy-server.mjs replaces npx serve (vercel.json rewrite + <base href="/">); render-diff.mjs adds URL-nav entries with diffThresholdPct:5.0 for cross-engine comparison; verify-phase-3-views.sh updated to use legacy-server.mjs.
  - PHASE 4 GATE: verify-phase-4.sh exits 0 — confirmed cold clone (origin/main edc6348), 2026-06-21.
    4 channels: tsc 0 errors | eslint 0 errors | next build 22 pages | surface-serve: / /insights /onboard /privacy /terms /dashboard?preview /schools/adkins-music-lessons-omaha/piano → 200; /onboarding /privacy-policy /terms-of-service → 308.

  Phase 5:
  - 5.1 DONE: gate-guard loop — _config/agent.md (governance/token schema) + .claude/workflows/gate-guard.md (orchestrator). commit af25910.
  - 5.2 DONE: generate-guard-retry loop — fixture + orchestrator. commit 5668f4c.
  - 5.3 DONE: @supabase/ssr auth + gate decoupling — 2026-06-21.
      - @supabase/ssr installed.
      - src/proxy.ts: real auth (createServerClient + operator role check + session refresh). Pass-through stub replaced.
      - src/lib/supabase/server.ts: server-side Supabase client factory (cookies, SSR-safe).
      - verify-phase-4.sh: operator routes → check_redir (auth redirect, not 200); schools decoupled to test-fixture slug + 3 sub-routes added.
      - verify-phase-5.sh: Phase 5 gate (files, proxy contents, loop-demo, tsc, eslint, serve).
      - render-diff.mjs: schools-piano URL → /schools/test-fixture/piano.
      - verify-final.sh: Phase 3/4/5 activated (pending → run).
      - test-fixture seeded in live Supabase (clients + agent_tenants + client_pages, slug=test-fixture).
      - schools-piano baseline PNG regenerated from test-fixture. HASHES.txt updated.
      - PHASE 5 GATE: verify-phase-5.sh exits 0 — 2026-06-21.
        Channels: gate-integrity PASS | files present | proxy auth checked | loop-demo PASS | tsc 0 errors | eslint 0 errors | / → 307 | /insights → 307 | schools test-fixture 4 routes → 200 | dashboard?preview → 200.
      - Pre-5 tracked changes resolved: @supabase/ssr ✅ | gate decouple ✅.

  - Repo cleanup (2026-06-21): .brain/ superseded docs deleted; canonical-crm-schema.md deleted; p4-verify/ deleted; _migration/north-path-plan.md added (six-phase engine plan).

  - Render-diff retired + verify-build.sh (2026-06-21):
      - render-diff.mjs, legacy-server.mjs, verify-phase-3-views.sh, snapshots/ deleted.
      - Root legacy SPAs deleted: 96-public/, 99-agents/, dashboard/, legal/, schools/.
      - _migration/verify-build.sh added: build + tsc + lint + serve (proper status assertions).
      - verify-final.sh:35 dangling ref to deleted verify-phase-3-views.sh removed.
      - HASHES.txt regenerated (8 gates). gate-integrity: PASS.
      - COLD-CLONE PROOF: BUILD VERIFY: PASS / exit=0 — 2026-06-21.
        build 24 pages | tsc 0 errors | lint 0 errors | / → 307 | /insights → 307 | 5 public routes → 200.
      - Decision recorded in _migration/DECISIONS.md.

NEXT: North-path engine (see _migration/north-path-plan.md).
  Phase 1: Excise 2nd CRM remnants from 94-knowledge/schema.sql.
  Phase 2: Isolate vertical vocab → src/config/vertical.ts.
  Phase 3: Connector abstraction + Tier C availability/booking API.
