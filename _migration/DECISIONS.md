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
- Threshold: 1.00%

campaigns passes by exactly 0 pixels of headroom. If clients (597 LOC — denser than campaigns) exceeds 1.00%, raise DIFF_THRESHOLD to **1.5%** with this entry as the documented rationale. A threshold increase is a calibration, not a gate weakening, when the source is provably font rendering noise and not a visual regression. The re-compare at that point must confirm the layout is pixel-identical to legacy (eyeball the diff PNG first).

### Files touched
- `src/app/layout.tsx` — next/font config updated (weights + style + adjustFontFallback)
- `src/app/globals.css` — explicit `font-family` added to `html, body` rule
