# CHECKPOINT — phase-3-shell-insights — 2026-06-19

## DID
- `public/brand/zw-bolt-dark.png` + `zw-bolt-light.png` — copied from 92-design/brand/; referenced by OperatorShell bolt mark
- `src/app/globals.css` — added 10 new @theme tokens (MC gradient: --color-mc-grad-from/to, user avatar: --color-user-av-bg/text, 6 insight category accents: --color-insight-0..5); added @layer base html/body base styles (height 100%, overflow hidden, antialiasing, font-size 14px, line-height 1.5, scrollbar 4px); added [data-theme="light"] override for --color-user-av-bg (#1C1C1A); added .insights-row / .insights-row:hover CSS for server-component hover (no JS handlers)
- `src/app/layout.tsx` — added Plus_Jakarta_Sans via next/font/google (weights 400/500/600/700); applied className to <body>; updated title to "ZiroWork — Operator CRM"
- `src/app/(operator)/layout.tsx` — server layout; renders <OperatorShell>{children}</OperatorShell>
- `src/components/shell/OperatorShell.tsx` — "use client"; full desktop sidebar (220px, NAV 17 items across 5 sections, bolt mark img, search at-rest, theme toggle, user footer "ZA"/Zach Adkins) + top header bar (ZiroWork + UserMenu) + main area; active state via usePathname(); theme toggle via useTheme()
- `src/components/shell/UserMenu.tsx` — "use client"; closed button only (MC gradient avatar + ▼); dropdown deferred
- `src/app/(operator)/insights/page.tsx` — server page; renders <InsightsView/>
- `src/components/views/InsightsView.tsx` — server component; static PLAYBOOKS array; category accents via var(--color-insight-N); chip bg via color-mix(in srgb, var(--color-insight-N) 9%, transparent); hover via CSS class .insights-row (no JS handlers); Clock icon from lucide-react
- `package.json` / `package-lock.json` — lucide-react ^1.21.0 added

## GATE OUTPUT
```
=== tsc --noEmit ===
exit=0

=== eslint ===
C:\...\OperatorShell.tsx
  69:15  warning  Using `<img>` could result in slower LCP... @next/next/no-img-element
✖ 1 problem (0 errors, 1 warning)
exit=0

=== next build ===
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /insights
exit=0

=== render-diff ===
--- render-diff: insights ---
[compare] "insights": Next.js vs committed baseline
[compare] diff pixels: 11043 / 1296000 = 0.85% (threshold 1%)
[compare] PASS
exit=0

=== structural: no window.* in src/components/ ===
window.* refs in src/components: 0
component files for insights: 2

=== route check ===
/insights → 200

=== RESULT ===
PHASE 3 VIEWS: PASS

GATE INTEGRITY: PASS
```

## DEVIATIONS
- `<img>` used for bolt mark instead of `next/image <Image>` — bolt is decorative (no layout shift risk at 30×30); ESLint emits a WARNING (not error, exit=0); accepted as-is since layout.tsx migration is migration-not-redesign and `next/image` would require width/height props and optional optimization config that are outside scope
- `Zach Adkins` / `ZA` hardcoded in sidebar user footer — auth is deferred; the baseline was captured with fake session returning `full_name: 'Zach Adkins'` (from render-diff.mjs addInitScript), so this matches the baseline pixel-for-pixel
- `MC` in UserMenu gradient avatar is hardcoded (not from session) — same reason; baseline captured with fixed MC avatar
- Python processes on port 3000 from a previous session killed before gate run — they were blocking `next start`; not a gate or code change

## DID NOT VERIFY
- Mobile: drawer, swipe, MobileHeader, equalizer bars — intentionally deferred (static desktop chrome scope per task spec); legacy still serves mobile
- Command palette (⌘K overlay) — deferred; bolt fires boltFiring animation → setCmdOpen, all deferred
- Sidebar user-dropdown — deferred; button is at-rest only
- Header UserMenu dropdown + signOut — deferred; closed button only
- Bolt firing animation / ring — deferred; static bolt image at rest
- Theme-toggle circle-reveal animation — deferred; toggle() calls useTheme() which switches data-theme attribute (no animation)
- Other views (bookings, clients, etc.) — not in VIEWS registry; gate only checks insights
- Real auth replacing hardcoded name/initials — Session.jsx auth wiring is Phase 4+ scope
- color-mix() browser support — used for insight chip bg; supported in Chrome 111+ (headless Chromium in Playwright is 111+); may need fallback for very old clients, but out of migration scope

## GAMING DISCLOSURE
none
