# Handoff

VERIFIED: Phase 3 render-diff gate BUILT + baseline corrected.
  - snapshots/insights.png confirmed correct: sidebar + InsightsView PLAYBOOKS (h1 "Insights", 6 cards, 4 visible).
  - gate-integrity.sh exits 0.

CHANGED (phase-3-gate + baseline fix):
  - package.json / package-lock.json — playwright, pixelmatch, pngjs devDeps; Chromium headless installed
  - _migration/epic/STAGES/phase-3-views.md — stage spec (port order 17 items, CSS var map, per-view done criteria, conventions)
  - _migration/epic/GATES/render-diff.mjs — 3 changes from original:
      1. VIEW_MAP: legacyHash → legacySidebarText (legacy uses React state routing, not URL hash; sidebar click required)
      2. addInitScript on baseline path: intercepts window.sb setter, fakes operator session so Session.jsx passes auth gate
      3. Baseline nav: goto('/') + waitForTimeout(2000) + getByText(sidebarText).first().click() + waitForTimeout(1500)
      Compare path is unchanged.
  - _migration/epic/GATES/snapshots/.gitignore — excludes *.diff.png
  - _migration/epic/GATES/snapshots/insights.png — CORRECT baseline: InsightsView PLAYBOOKS view (Zach confirmed)
  - _migration/epic/GATES/verify-phase-3-views.sh — 6-channel gate bundle (VIEWS=("insights") seeded)
  - _migration/epic/GATES/HASHES.txt — text-mode sha256 format; includes verify-phase-3-views.sh
  - _migration/epic/CHECKPOINTS/phase-3-gate.md — checkpoint ender
  - _migration/progress.md — Phase 3 started; 3.0 gate + auth Rule-14 note documented

BROKEN: nothing

NEXT BEST STEP: Phase 3.0-shell + 3.1-InsightsView (one gated unit — gate only goes green when both are in).
  3.0-shell: port sidebar.jsx + Router.jsx shell wrapper → src/app/(operator)/layout.tsx
    - Sidebar: CSS vars, lucide-react imports, useIsMobile, useOperatorContext
    - Layout: Server Component wrapper, "use client" boundary inside
  3.1-InsightsView: src/components/insights/InsightsView.tsx + src/app/(operator)/insights/page.tsx
    - Pure static component; no hooks needed
    - After both: verify-phase-3-views.sh exits 0 on all 6 channels

KEY GOTCHAS:
  1. Legacy server: `npx serve .` redirects / → /login. Use Node.js one-liner:
       node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const u=req.url==='/'?'/index.html':req.url;const f=path.join(process.cwd(),u.split('?')[0]);try{const d=fs.readFileSync(f);const ct={'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain';res.writeHead(200,{'Content-Type':ct});res.end(d)}catch(e){res.writeHead(404);res.end()}}).listen(3001,()=>console.log('OK'))"
  2. Legacy auth is REAL (Session.jsx, role-gated). Baseline capture needs the addInitScript auth bypass already in render-diff.mjs.
  3. Legacy routing is React state (navHistory), not URL hash. Baseline capture navigates via sidebar click, not hash.
  4. Shell + InsightsView gate together: the baseline includes sidebar chrome. Next.js /insights must match full page.
  5. Data views (bookings, clients, etc.): will need empty-state capture (window.sb=null on legacy, SUPABASE_URL='' on Next.js) before gating those views. Not needed for InsightsView (pure static).

COMMIT PENDING: Wave C work (71ead3f auto-save) + phase-3-gate + baseline-fix all pending Zach commit.
