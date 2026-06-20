# Handoff

VERIFIED: Phase 3 render-diff gate BUILT + RED-TEST PASSED.
  - verify-phase-3-views.sh exits 1 on 3 channels (render-diff 99.43% diff, structural, route) — proves gate goes red before any view is ported.
  - gate-integrity.sh exits 0.

CHANGED (this session — phase-3-gate):
  - package.json / package-lock.json — added playwright, pixelmatch, pngjs devDeps; Chromium headless installed
  - _migration/epic/STAGES/phase-3-views.md — stage spec (port order 17 items, CSS var map, per-view done criteria, conventions)
  - _migration/epic/GATES/render-diff.mjs — baseline generator + compare script (Playwright + pixelmatch; 1440×900; 1% threshold)
  - _migration/epic/GATES/snapshots/.gitignore — excludes *.diff.png, keeps baseline PNGs
  - _migration/epic/GATES/snapshots/insights.png — InsightsView baseline from legacy app (1440×900, real content confirmed)
  - _migration/epic/GATES/verify-phase-3-views.sh — 6-channel gate bundle (VIEWS=("insights") seeded)
  - _migration/epic/GATES/HASHES.txt — updated to include verify-phase-3-views.sh; corrected to text-mode format
  - _migration/epic/CHECKPOINTS/phase-3-gate.md — checkpoint ender written
  - _migration/progress.md — updated to Phase 3; 3.0 gate documented
  - _migration/session-handoff.md — this file

BROKEN: nothing

NEXT BEST STEP: Phase 3.0-shell — port the operator shell layout into Next.js.
  Files to port: 90-shell/sidebar.jsx + Router.jsx shell → src/app/(operator)/layout.tsx
  Then: 3.1 InsightsView → src/components/insights/InsightsView.tsx + src/app/(operator)/insights/page.tsx
  After InsightsView: verify-phase-3-views.sh should exit 0 on all 6 channels.
  See _migration/epic/STAGES/phase-3-views.md for full spec.

KEY GOTCHA: Legacy static server `npx serve .` redirects / → /login on this system.
  For baseline generation of future views, use this Node.js server snippet (run from repo root):
    node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const u=req.url==='/'?'/index.html':req.url;const f=path.join(process.cwd(),u.split('?')[0]);try{const d=fs.readFileSync(f);const ct={'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain';res.writeHead(200,{'Content-Type':ct});res.end(d)}catch(e){res.writeHead(404);res.end()}}).listen(3001,()=>console.log('OK'))"
  Then: node _migration/epic/GATES/render-diff.mjs baseline <view>
  Then: kill that server. Commit the PNG.

COMMIT PENDING: Wave C work (71ead3f auto-save) + phase-3-gate work both pending Zach commit.
