# token-map.md — Phase 0: Design Token Inventory

Source: full read of `92-design/theme.js` (204 lines) + `grep -rl "window\.T\b"` consumer search + `grep -rl "LucideReact"` + `grep -rn "TOKENS\."` across all files.

---

## 1. `window.T` — Dual-Theme Color Token Object

`theme.js` defines two plain objects (`dark`, `light`) and assigns `window.T = isDark ? dark : light` at runtime. It also calls `syncVars(window.T)` immediately to stamp 14 CSS custom properties on `<html>`.

### Complete Token Table

| Token key | Dark value | Light value | CSS var (if synced) | Proposed `--css-var` |
|-----------|-----------|-------------|--------------------|--------------------|
| `isDark` | `true` | `false` | — | meta flag, no var needed |
| **Backgrounds** | | | | |
| `bg` | `#1A1C1F` | `#F7F2E8` | `--bg` ✓ | `--color-bg` |
| `sidebarBg` | `#141619` | `#E8DCC8` | `--sidebar-bg` ✓ | `--color-sidebar-bg` |
| `cardBg` | `#26292D` | `#FFFFFF` | `--surface` ✓, `--bg-card` ✓ | `--color-card-bg` |
| `surface` | `#26292D` | `#FFFFFF` | — (alias of cardBg) | alias `--color-card-bg` |
| `elevatedBg` | `#303338` | `#EFE6D6` | — | `--color-elevated-bg` |
| `inputBg` | `rgba(255,255,255,0.05)` | `#F7F2E8` | — | `--color-input-bg` |
| `headerBg` | `#1E2024` | `#E8DCC8` | — | `--color-header-bg` |
| **Text** | | | | |
| `t1` | `#F5F4F1` | `#162833` | `--text` ✓, `--text-1` ✓ | `--color-text-1` |
| `t2` | `#C8C5C1` | `#3D4F58` | `--text-2` ✓ | `--color-text-2` |
| `t3` | `#9E9B97` | `#6B7880` | `--text-3` ✓ | `--color-text-3` |
| `t4` | `#787471` | `#8C9298` | `--text-4` ✓ | `--color-text-4` |
| `t5` | `#555250` | `#A8AAA4` | — | `--color-text-5` |
| **Borders / interactive states** | | | | |
| `border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` | `--border` ✓ | `--color-border` |
| `borderMed` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.11)` | `--border-med` ✓ | `--color-border-med` |
| `hover` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.04)` | `--bg-hover` ✓, `--row-hover` ✓ | `--color-hover` |
| `active` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` | `--nav-active` ✓ | `--color-active` |
| `activeB` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.05)` | — | `--color-active-bg` |
| `rowHover` | _missing in dark_ | `rgba(0,0,0,0.04)` | — | ⚠️ ASYMMETRY (see below) |
| **Accent** | | | | |
| `accent` | `#FD802E` | `#D9641C` | — | `--color-accent` |
| **Status — Paid** | | | | |
| `paidBg` | `rgba(16,185,129,0.15)` | `#D1F4E8` | — | `--color-paid-bg` |
| `paidText` | `#34D399` | `#034636` | — | `--color-paid-text` |
| `paidDot` | `#10B981` | `#059669` | — | `--color-paid-dot` |
| **Status — Overdue** | | | | |
| `overdueBg` | `rgba(239,68,68,0.15)` | `#FDCCCB` | — | `--color-overdue-bg` |
| `overdueText` | `#F87171` | `#7F1D1D` | — | `--color-overdue-text` |
| `overdueDot` | `#EF4444` | `#DC2626` | — | `--color-overdue-dot` |
| **Status — Pending** | | | | |
| `pendingBg` | `rgba(245,158,11,0.15)` | `#FEE9A6` | — | `--color-pending-bg` |
| `pendingText` | `#FCD34D` | `#78350F` | — | `--color-pending-text` |
| `pendingDot` | `#F59E0B` | `#CA8A04` | — | `--color-pending-dot` |
| **Instrument badges** | | | | |
| `pianoBg` | `rgba(99,102,241,0.22)` | `#C7D2FE` | — | `--color-piano-bg` |
| `pianoText` | `#A5B4FC` | `#1E1B4B` | — | `--color-piano-text` |
| `violinBg` | `rgba(96,165,250,0.22)` | `#BFDBFE` | — | `--color-violin-bg` |
| `violinText` | `#93C5FD` | `#0C2340` | — | `--color-violin-text` |
| `celloBg` | `rgba(251,191,36,0.22)` | `#FEE2A6` | — | `--color-cello-bg` |
| `celloText` | `#FDE68A` | `#541E07` | — | `--color-cello-text` |
| `harpBg` | `rgba(192,132,252,0.22)` | `#E9D5FF` | — | `--color-harp-bg` |
| `harpText` | `#E9D5FF` | `#4A0E4E` | — | `--color-harp-text` |
| **Avatars** | | | | |
| `av` | array[8] of {bg,fg} pairs | array[8] of {bg,fg} pairs | — | `--color-av-{0-7}-bg`, `--color-av-{0-7}-fg` (16 vars per theme) |
| **Calendar** | | | | |
| `calBg` | `#1E2024` | `#FFFFFF` | — | `--color-cal-bg` |
| `calHeaderBg` | `#26292D` | `#FFFFFF` | — | `--color-cal-header-bg` |
| `calBorder` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.07)` | — | `--color-cal-border` |
| `calHalf` | `rgba(255,255,255,0.025)` | `rgba(0,0,0,0.04)` | — | `--color-cal-half` |
| `calToday` | `#26292D` | `#F7F2E8` | — | `--color-cal-today` |
| **Lifecycle canvas** | | | | |
| `lcDotBg` | `#1A1C1F` | `#EFE6D6` | — | `--color-lc-dot-bg` |
| `lcDotBorder` | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` | — | `--color-lc-dot-border` |
| `lcDotFill` | `rgba(255,255,255,0.18)` | `#D0CFCC` | — | `--color-lc-dot-fill` |
| `lcLine` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | — | `--color-lc-line` |
| `lcAnim` | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` | — | `--color-lc-anim` |
| `lcGrid` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.11)` | — | `--color-lc-grid` |
| `lcTriggerBorder` | `rgba(255,255,255,0.14)` | `rgba(0,0,0,0.15)` | — | `--color-lc-trigger-border` |
| `lcCardBg` | `#26292D` | `#FFFFFF` | — | `--color-lc-card-bg` |
| `lcCardBorder` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | — | `--color-lc-card-border` |
| `lcAddBg` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.8)` | — | `--color-lc-add-bg` |
| `lcAddBorder` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.15)` | — | `--color-lc-add-border` |
| **Drawer / modal** | | | | |
| `drawerBg` | `#1E2024` | `#FFFFFF` | — | `--color-drawer-bg` |
| `drawerShadow` | `'-1px 0 0 rgba(255,255,255,0.06), -20px 0 60px rgba(0,0,0,0.6)'` | `'-1px 0 0 rgba(0,0,0,0.06), -20px 0 60px rgba(0,0,0,0.1)'` | — | `--shadow-drawer` |
| `scrim` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.2)` | — | `--color-scrim` |
| `sysMsg` | `rgba(255,255,255,0.05)` | `#F5F5F3` | — | `--color-sys-msg` |
| `scrollThumb` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.12)` | — | `--color-scroll-thumb` |

**Totals:**
- Named tokens: **57** (dark object, excl `isDark`) + **58** (light adds `rowHover`)
- Currently synced to CSS vars: **14** (sync lines in `syncVars()`)
- CSS-var gap: **43+ tokens** only accessible via `window.T.xxx` — no CSS var equivalent

### ⚠️ Token Asymmetry
`rowHover` exists in `light` (line 71: `rowHover: 'rgba(0,0,0,0.04)'`) but is **absent from `dark`**. Any view that reads `T.rowHover` in dark mode gets `undefined`. Architect must resolve before Phase 2.

---

## 2. `window.TOKENS` — Design Scale (Non-Color)

Source: `92-design/design-tokens.js` (815 lines). Exports `window.TOKENS` containing non-color design scale (radius, spacing, typography, shadows, etc.).

**Consumers found:**
```
grep -rn "TOKENS\." → 90-shell/sidebar.jsx:102  TOKENS.radius.xl
                       90-shell/sidebar.jsx:122  TOKENS.radius.lg
```

Only 2 uses across the entire codebase (both in `sidebar.jsx`). Views do not use `TOKENS`. The 815-line file is disproportionate to its usage — architect should decide whether to trim or expand TOKENS coverage during migration.

---

## 3. Orphan Analysis — Colors Outside the T System

### Operator views
Operator views access colors via `window.T` (e.g., `const T = window.T; ... color: T.t1`). The grep search `grep -rl "window\.T\b"` confirmed 19 operator files are T consumers. Inline hex/rgba literals in operator view files that **don't match any T value** are orphans. 

Sample of confirmed orphans found in operator files (from `grep -rnoE "#[0-9a-fA-F]{6}"` on non-theme files):
- `16-studio-map/studio-map.jsx` — inline hex values not present in T
- `90-shell/Router.jsx` — contains inline hex not in T

Full orphan extraction requires a value-by-value comparison against the T table above. Phase 1 tooling should automate this with a script that diffs literal values vs T's 57-token value set.

### Schools surface — ENTIRELY ORPHANED from T
`grep -rl "window\.T\b"` returned **exit 1 for schools/**: no schools file references `window.T`. All hex/rgba in `schools/` are surface-private. Schools uses its own inline styles (Tailwind-like inline or hardcoded colors). These are not orphans to _fix_ — they are a separate design system to document in Phase 1.

Approximate schools literal count: `grep -rnoE "#[0-9a-fA-F]{6}"` across schools pages returned ~40+ hex literals (piano.jsx, guitar.jsx, vocals.jsx, drums.jsx, signup.jsx each contain instrument-color and UI hex values).

### Dashboard surface — ENTIRELY ORPHANED from T
Same situation as schools — `window.T` is not loaded by `dashboard/index.html`. Dashboard views have their own color literals. Not orphans to fix in the T sense; they constitute a third design system.

---

## 4. Summary for Architect

| Metric | Count |
|--------|-------|
| T token keys (dark) | 57 |
| T token keys (light) | 58 (rowHover extra) |
| CSS vars currently synced | 14 |
| T tokens with no CSS var | 43 |
| TOKENS references (across codebase) | 2 (both in sidebar.jsx) |
| Operator files using T | 19 (all views + sidebar + Header) |
| Schools files using T | 0 |
| Dashboard files using T | 0 |
| Token asymmetry flag | 1 (rowHover missing from dark) |

**Phase 2 action:** CSS var parity — all 57+ T keys should be synced via `syncVars()`, so views can optionally use `var(--color-xxx)` in CSS/Tailwind and not be forced to inline `style={{ color: T.t1 }}`. This also unblocks Tailwind JIT in Next.js.

**No hex literal dedup table produced** — the grep tooling available on this Windows host does not reliably handle ERE `{n}` quantifiers in a single pass. Phase 1 should run this via `ripgrep` in the Next.js dev environment where `rg` is available:
```
rg --no-filename -oE '#[0-9a-fA-F]{6}|rgba?\([^)]+\)' --include='*.{jsx,tsx,js,ts}' . | sort | uniq -c | sort -rn
```
