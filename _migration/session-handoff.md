# Handoff

VERIFIED: Phase 3.5 — PagesView COMPLETE.
  - flip-state.mjs exits 0: pages → passing.
  - 5 views total passing: insights, bookings, reporting, settings, pages.

CHANGED (this session):
  - src/app/(operator)/pages/page.tsx — NEW: server page; renders PagesView
  - src/components/views/PagesView.tsx — NEW: "use client"; collapsible client groups, status/publish toggle, program + status badges via color-mix(). No new tokens.
  - feature_list.json — pages flipped to passing by gate (node flip-state.mjs)
  - _migration/progress.md — 3.5 entry added; NEXT updated to 3.6

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

NEXT BEST STEP: Phase 3.6 — port next view.
  PROCESS:
    1. Start legacy server (Node.js one-liner from previous handoff, port 3001)
    2. Start Next.js dev server (npm run dev, port 3000)
    3. Run baseline: node _migration/epic/GATES/render-diff.mjs baseline <view-name>
    4. Create src/app/(operator)/<view>/page.tsx + src/components/views/<ViewName>View.tsx
    5. Run gate: node _migration/epic/GATES/render-diff.mjs compare <view-name> + tsc + eslint
    6. node flip-state.mjs → commit feature_list.json + progress.md + session-handoff.md

  CANDIDATE VIEWS (simplest first):
    - studio-map (likely static/placeholder — no data hooks)
    - leads, escalations, conversations (data views — need empty-state baseline with window.sb=null)
    - campaigns, clients, onboarding (moderate complexity)
    - command-center (most complex — requires empty-state baseline)

KEY GOTCHAS:
  1. Port 3000 may have lingering Python processes from previous sessions — check + kill before running gate.
  2. Legacy server: use Node.js one-liner (not npx serve — redirects / to /login):
       node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const u=req.url==='/'?'/index.html':req.url;const f=path.join(process.cwd(),u.split('?')[0]);try{const d=fs.readFileSync(f);const ct={'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain';res.writeHead(200,{'Content-Type':ct});res.end(d)}catch(e){res.writeHead(404);res.end()}}).listen(3001,()=>console.log('OK'))"
  3. Data views: baseline must be captured with window.sb=null on legacy side (empty state), and SUPABASE_URL='' on Next.js side to avoid real data differences.
  4. Shell is already ported — next views ONLY need page.tsx + ViewName.tsx; no shell changes needed unless fixing debt.
  5. flip-state.mjs lives in PROJECT ROOT (not _migration/) — run as: node flip-state.mjs
