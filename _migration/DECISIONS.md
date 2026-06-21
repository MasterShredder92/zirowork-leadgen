# Migration Decisions

Record of non-obvious choices made during the migration. Each entry: what was tried, what the data showed, and the final call.

---

## 2026-06-21 — RENDER-DIFF RETIRED (Phase 5 close)

App never shipped / zero customers → pixel-fidelity to the old app has no value.

**Deleted:**
- `_migration/epic/GATES/verify-phase-3-views.sh`
- `_migration/epic/GATES/render-diff.mjs`
- `_migration/epic/GATES/legacy-server.mjs`
- `_migration/epic/GATES/snapshots/`
- `96-public/`, `99-agents/`, `dashboard/`, `legal/`, `schools/` (root legacy SPAs)

**New definition of done:** `bash _migration/verify-build.sh` — clean-clone build + tsc + lint + routes serve. Fidelity is no longer gated.

**Action required:** Run `bash _migration/epic/GATES/gate-integrity.sh --update` and commit `HASHES.txt` (Zach only — agent never touches HASHES.txt).

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

## 2026-06-21 — Phase 5 design: gate decoupling from prod data

### The problem
Two Phase 4 gate checks couple to the live `adkins-music-lessons-omaha` slug row in the prod `client_pages` table:

1. **verify-phase-4.sh** `check_200 "/schools/adkins-music-lessons-omaha/piano"` — returns 200 only if the slug exists in the live DB.
2. **render-diff.mjs** `schools-piano` URL-nav entry — captures the baseline by hitting the same live slug.

Delete that row (or rename the slug) and both gates red for a non-migration reason. "Migration correct" and "prod data present" are conflated.

### Why not fixed now
The gate's one job today is to certify Phase 4. It does. Editing a passing gate mid-certification is churn on a frozen artifact. A half-fix (e.g. `check_not_500` on a fake slug in verify-phase-4.sh) drops happy-path render coverage without actually decoupling — the render-diff baseline still hits the live slug, so the prod-data dependency just moves one door over.

### Phase 5 design unit (do together, not piecemeal)
Decouple both checks onto a seeded fixture, not the live slug:

- **Fixture**: insert one deterministic row into a test schema (or seed the prod `client_pages` table with a stable `test-fixture` slug, never to be deleted). Fixture slug needs `school_name`, `instrument`, `agent_tenants` entry — enough for the landing page Server Component to render fully.
- **verify-phase-4.sh**: replace `check_200 ".../adkins-music-lessons-omaha/piano"` with `check_200 ".../test-fixture/piano"` against the fixture slug; OR replace with `check_not_500 "/schools/unknown-slug/piano"` (proves route handler runs + `notFound()` fires, no fixture needed) and let render-diff own "schools renders correctly."
- **render-diff.mjs**: update `schools-piano` URL-nav entry to hit the fixture slug, commit a new baseline PNG from fixture data.
- Do both changes in one commit so the decoupled gate is atomic and provably consistent.

### Status
Deferred to Phase 5. Phase 4 gate remains as-is — documented manual gate, adkins slug assumed stable during Phase 4 certification window.

---

## 2026-06-21 — Deferred defects: supabase client top-level throw + gate-blind schools routes

### Defect 1 — client.ts throws at import when env is absent

```ts
// src/lib/supabase/client.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;  // ! = type lie; undefined at runtime
export const supabase = createClient(url, anonKey);  // runs at module import
```

The `!` non-null assertion silences tsc; at runtime with no env it is `undefined` and `createClient` throws the moment the module is imported. All four schools routes import it transitively (`page.tsx → getSchoolBySlug → client.ts`), so `next build`'s page-data collection worker aborts env-less. Build completes with `.env.local` present — that is the gate's stated contract and the gate is not broken. But the throw-on-import is a latent landmine.

**Fix (deferred to `@supabase/ssr` tracked change):** lazy singleton — construct the client on first call, not at module load. The throw moves from import-time to use-time; build passes env-less, SSR functions throw only when actually invoked without credentials.

**This is not a Phase 4 blocker.** With `.env.local` present, `next build` passes exit 0 (22 pages, confirmed locally). Fix alongside the `@supabase/ssr` cookie-auth work as one atomic change.

### Defect 2 — verify-phase-4.sh schools serve checks are gate-blind on three sub-routes

The gate checks:
```
check_200 "/schools/adkins-music-lessons-omaha/piano"   # [slug]/[instrument]
```

Not checked:
- `/schools/adkins-music-lessons-omaha/signup`          # [slug]/signup
- `/schools/adkins-music-lessons-omaha/thank-you`       # [slug]/thank-you
- `/schools/adkins-music-lessons-omaha/confirm`         # [slug]/confirm

All three sub-routes exist in `src/app/(public)/schools/[slug]/` and are built (shown in `next build` route table), but the serve gate doesn't exercise them. A broken sub-route would not trip the gate today.

**Fix (deferred to Phase 5 gate-decouple unit):** add `check_200` (or `check_not_500` if decoupled to fixture slug) for all three sub-routes in the same commit that decouples the main schools check from the live slug. Doing it piecemeal before the decouple just adds three more prod-data-coupled checks. Do all four together.

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
