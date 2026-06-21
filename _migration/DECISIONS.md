# Migration Decisions

Record of non-obvious choices made during the migration. Each entry: what was tried, what the data showed, and the final call.

---

## 2026-06-20 — Font floor: why render-diff sits at 1.00% for text-dense views

### The symptom
Render-diff floors at ~0.36% for shell views (sparse text), and climbs to 1.00% for text-dense views (campaigns = 287 LOC legacy, command-center = similar). That 1.00% is exactly the gate threshold — so text-denser views risk false reds.

### Why the delta exists
Two different font load paths, same machine, same Playwright Chromium:

- **Legacy baseline**: Google Fonts CDN `<link>` — `Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`
- **Next.js compare**: `next/font/google` — self-hosted, subsetted to `["latin"]`, originally weights 400–700 only

Different font bytes/metrics → per-glyph sub-pixel deltas → scales with glyph count. pixelmatch at threshold 0.1 catches these even with includeAA=false.

### What was tried

**Step A — tune next/font config to match legacy's request** (2026-06-20):
```ts
Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],  // +300
  style: ["normal", "italic"],                   // +italic 400
  display: "swap",
  adjustFontFallback: false,                     // drop size-adjust injection
})
```
Result: 12944 / 1296000 = **1.00%** — identical to pre-fix. Zero effect. Reason: campaigns text uses weights 500–700 only; adding 300/italic doesn't change rasterized output. `adjustFontFallback` only affects the fallback font (not the loaded font).

**Step B — replace next/font with legacy's exact CDN `<link>`** (2026-06-20):
Loaded the font via CDN in Next's `<head>`, removed next/font entirely, set `font-family` explicitly in globals.css body rule.
Result: 13038 / 1296000 = **1.01% FAIL** — slightly worse. Reason: CDN font load has network round-trip; `networkidle` + 1500ms settle doesn't guarantee full font rasterization before screenshot. next/font's self-hosting is same-origin and synchronous — it's actually more reliable for screenshot capture.

**Verdict**: Reverted to next/font Step A config. That config remains at 1.00% PASS.

### The floor is irreducible (for now)
The 1.00% delta for text-dense views comes from CDN-bytes vs. next/font-self-hosted-bytes at the rasterization level. Both produce correct, identical-looking output to the human eye. The difference is sub-pixel hinting noise that accumulates with glyph count.

**This is not a visual regression. The font is correct.**

Confirmed: `font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif` is also set on `html, body` in globals.css as an explicit declaration (belt-and-suspenders alongside next/font's className).

### Gate status
- Shell/sparse views: ~0.36%
- Text-dense views (campaigns, command-center): 1.00%
- clients (597 LOC): **0.36%** — same as shell floor
- Threshold: 1.00% — permanently

### Decision
Global `DIFF_THRESHOLD_PCT` stays at **1.0** — permanently. Raising it loosens the gate for *every* view (including 0.36% shell views), so a real ~1.4% regression anywhere would pass silently. That is exactly the failure the gate exists to prevent.

If a view's empty-state diff ever genuinely exceeds 1.0%, the order is: (1) eyeball its diff PNG — concentrated region = real regression, fix it; scattered glyph-edge speckle = noise; (2) only if PNG-proven noise, add a **per-view** tolerance for that one view with the PNG committed as evidence; the global 1.0% is unchanged. Never a global raise.

Note: clients (597 LOC) landed at 0.36% — gate diff tracks rendered glyph density in the anon empty state, not file size. The "denser LOC → higher diff" assumption was wrong.

### Files touched
- `src/app/layout.tsx` — next/font config updated (weights + style + adjustFontFallback)
- `src/app/globals.css` — explicit `font-family` added to `html, body` rule

---

## 2026-06-21 — Phase 4 per-entry thresholds: schools-piano at 4.0%, others at global

### The problem
Phase 4 committed `diffThresholdPct: 5.0` on all three URL-nav views with the comment
"antialiasing differences." Two of the three didn't need it at all; one had an imprecise
value and an inaccurate label.

### What the diff PNGs show
Eyeballed all three committed diff PNGs:

- **schools-piano** (3.41%): diff is 100% concentrated in text regions — hero headline,
  subhead, button, nav phone number, testimonial body. Zero structural/layout delta.
  Pattern is scattered glyph-edge speckle identical to the operator SPA font-metric noise
  documented above, but larger magnitude because this is CDN React 18 Babel CSR (legacy)
  vs Next.js React 19 SSR — bigger cross-engine rasterization gap.
- **onboard** (0.42%): light scattered text speckle. No layout change. Passes global 1.0%.
- **dashboard-preview** (0.31%): near-invisible noise. Passes global 1.0%.

### Why "antialiasing" is the wrong label
`pixelmatch` runs with no `includeAA` key → default `false`, which **excludes** AA pixels
from the count. So the 3.41% cannot be antialiasing — those pixels are not counted.
This is font-hinting/metric divergence: different font bytes at the rasterization level
produce per-glyph sub-pixel deltas that accumulate with glyph count.

### Fix
- `onboard` + `dashboard-preview`: removed `diffThresholdPct` override — both pass global 1.0%.
- `schools-piano`: threshold set to **4.0** (measured 3.41% + 0.59% margin). PNG diff
  committed as evidence; text-only concentration confirmed by visual inspection.

### Red-test (rule 15)
Temporarily set schools-piano threshold to 3.0, ran compare:
```
diff pixels: 44215 / 1296000 = 3.41% (threshold 3%)
FAIL: diff 3.41% exceeds threshold.   EXIT: 1
```
Gate can go red. Restored to 4.0 → PASS.

### Files touched
- `_migration/epic/GATES/render-diff.mjs` — corrected thresholds + accurate comment
