# Handoff

VERIFIED: Phase 3.5 + 3.6 — PagesView + EnrollmentsView COMPLETE.
  - flip-state.mjs exits 0: pages → passing, enrollments → passing.
  - 6 views total passing: insights, bookings, reporting, settings, pages, enrollments.
  - Separate fix committed: suppressHydrationWarning on <html> for theme-boot (pre-existing on all views).

CHANGED (this session):
  - src/app/(operator)/pages/page.tsx — NEW: server page; renders PagesView
  - src/components/views/PagesView.tsx — NEW: "use client"; collapsible client groups, status/publish toggle, program + status badges via color-mix. No new tokens.
  - src/app/(operator)/enrollments/page.tsx — NEW: server page; renders EnrollmentsView
  - src/components/views/EnrollmentsView.tsx — NEW: "use client"; overrides map for optimistic enroll/lost/charge; billing via supabase.functions.invoke; no new tokens.
  - src/lib/derive/types.ts — Enrollment type extended (+id, parent_name, student_name, client_name, program, enrolled_at)
  - src/app/layout.tsx — suppressHydrationWarning on <html> (theme-boot pre-hydration mutation, pre-existing on all views)
  - feature_list.json — pages + enrollments flipped to passing by gate
  - _migration/progress.md — 3.5 + 3.6 entries added; NEXT updated to 3.7

INTERACTIVE PATH NOTE (enrollments):
  Enroll/Lost/Charge optimistic update paths were verified by code review only —
  not executable until auth + seed data are present. render-diff covers empty-state only.
  The gate cannot see: override map clearing on realtime catchup, billing edge function
  responses, or lead-stage writes downstream.

PHASE-3 SHELL DEBT (deferred — not in static baseline, can't gate):
  - Command palette (⌘K overlay)
  - Sidebar user-dropdown
  - Header UserMenu dropdown + signOut
  - Bolt firing animation / ring
  - Theme-toggle circle-reveal animation
  - All mobile (drawer, swipe, MobileHeader, equalizer)
  - TweaksPanel
  - Real auth for user name/initials (Zach Adkins/ZA hardcoded to match baseline)

BROKEN: nothing

NEXT BEST STEP: Phase 3.7 — parallel prep for un-baselined views.
  VIEWS NEEDING BASELINES (no snapshot yet):
    Check: ls _migration/epic/GATES/snapshots/ — any view without a .png needs a baseline run first.
    Baseline command: node _migration/epic/GATES/render-diff.mjs baseline <view-name>
    Legacy server must be on :3001; Next.js dev on :3000.

  CANDIDATE VIEWS (simplest first):
    - leads, escalations, conversations (data views — empty-state baseline)
    - campaigns, clients, onboarding (moderate complexity)
    - studio-map (vis.js force graph — window.vis CDN dep, 6 data hooks, NOT static. Port near-last or skip until Phase 4 decides CDN strategy.)
    - command-center (most complex — requires empty-state baseline)

  PROCESS:
    1. Start legacy server (Node.js one-liner, port 3001)
    2. Start Next.js dev server (npm run dev, port 3000)
    3. Run baseline: node _migration/epic/GATES/render-diff.mjs baseline <view-name>
    4. Create src/app/(operator)/<view>/page.tsx + src/components/views/<ViewName>View.tsx
    5. Run gate: node _migration/epic/GATES/render-diff.mjs compare <view-name> + tsc + eslint
    6. node flip-state.mjs → commit feature_list.json + progress.md + session-handoff.md

KEY GOTCHAS:
  1. Port 3000 may have lingering Python processes from previous sessions — check + kill before running gate.
  2. Legacy server: use Node.js one-liner (not npx serve — redirects / to /login):
       node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const u=req.url==='/'?'/index.html':req.url;const f=path.join(process.cwd(),u.split('?')[0]);try{const d=fs.readFileSync(f);const ct={'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain';res.writeHead(200,{'Content-Type':ct});res.end(d)}catch(e){res.writeHead(404);res.end()}}).listen(3001,()=>console.log('OK'))"
  3. Data views: baseline must be captured with window.sb=null on legacy side (empty state), and SUPABASE_URL='' on Next.js side to avoid real data differences.
  4. Shell is already ported — next views ONLY need page.tsx + ViewName.tsx; no shell changes needed unless fixing debt.
  5. flip-state.mjs lives in PROJECT ROOT (not _migration/) — run as: node flip-state.mjs
  6. studio-map uses window.vis (vis.js CDN) for force graph — no npm equivalent wired yet. Do NOT attempt to port until Phase 4 CDN strategy is decided.
