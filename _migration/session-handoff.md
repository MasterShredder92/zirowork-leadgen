# Handoff

VERIFIED: Phase 3 shell + InsightsView COMPLETE.
  - verify-phase-3-views.sh exits 0: tsc+eslint+build (channels 1-3) + render-diff 0.85% (channel 4) + structural 0 window.* refs (channel 5) + /insights→200 (channel 6).
  - gate-integrity.sh exits 0.
  - CHECKPOINT written: _migration/epic/CHECKPOINTS/phase-3-shell-insights.md

CHANGED (phase-3-shell-insights):
  - public/brand/ — zw-bolt-dark.png + zw-bolt-light.png (copied from 92-design/brand/)
  - src/app/globals.css — 10 new @theme tokens (MC gradient, user avatar bg/text, 6 insight category accents); @layer base html/body base styles + scrollbar; .insights-row :hover class
  - src/app/layout.tsx — Plus_Jakarta_Sans via next/font/google (400/500/600/700); title updated
  - src/app/(operator)/layout.tsx — NEW: server layout wrapping OperatorShell
  - src/components/shell/OperatorShell.tsx — NEW: "use client"; desktop sidebar + header + main; usePathname active state; useTheme toggle; 17 nav items
  - src/components/shell/UserMenu.tsx — NEW: "use client"; closed button (MC gradient avatar + ▼); dropdown deferred
  - src/app/(operator)/insights/page.tsx — NEW: server page; renders InsightsView
  - src/components/views/InsightsView.tsx — NEW: server component; 6 PLAYBOOKS; CSS :hover; color-mix chip bg; no JS handlers
  - package.json / package-lock.json — lucide-react ^1.21.0

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

NEXT BEST STEP: Phase 3.2 — port next view.
  PROCESS:
    1. Start legacy server (Node.js one-liner from previous handoff, port 3001)
    2. Start Next.js dev server (npm run dev, port 3000)
    3. Run baseline: node _migration/epic/GATES/render-diff.mjs baseline <view-name>
    4. Add view to VIEWS array in verify-phase-3-views.sh
    5. Create src/app/(operator)/<view>/page.tsx + src/components/views/<ViewName>View.tsx
    6. Run gate: bash _migration/epic/GATES/verify-phase-3-views.sh
    7. Iterate until exit 0

  CANDIDATE VIEWS (simplest first — no live data needed):
    - reporting, studio-map (likely static/placeholder)
    - bookings, escalations, leads (data views — need empty-state baseline capture with window.sb=null)
    - command-center (most complex — requires empty-state baseline)

KEY GOTCHAS:
  1. Port 3000 may have lingering Python processes from previous sessions — check + kill before running gate.
  2. Legacy server: use Node.js one-liner (not npx serve — redirects / to /login):
       node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const u=req.url==='/'?'/index.html':req.url;const f=path.join(process.cwd(),u.split('?')[0]);try{const d=fs.readFileSync(f);const ct={'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain';res.writeHead(200,{'Content-Type':ct});res.end(d)}catch(e){res.writeHead(404);res.end()}}).listen(3001,()=>console.log('OK'))"
  3. Data views: baseline must be captured with window.sb=null on legacy side (empty state), and SUPABASE_URL='' on Next.js side to avoid real data differences.
  4. Shell is already ported — next views ONLY need page.tsx + ViewName.tsx; no shell changes needed unless fixing debt.

COMMIT PENDING: all of the above changes are uncommitted.
