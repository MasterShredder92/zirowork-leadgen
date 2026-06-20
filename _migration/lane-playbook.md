# Phase 3 — Parallel View Port Playbook

Template proven on: `BookingsView` (commit `f879f40`, 0.36% render-diff).
One view = one staged set + Zach commit. The gate decides "passing," not the agent.

---

## Lane identity

| Lane | Worktree       | Branch   | Dev port | Gate env         |
|------|----------------|----------|----------|------------------|
| A    | `../zw-lane-a` | `lane-a` | 3010     | `NEXT_PORT=3010` |
| B    | `../zw-lane-b` | `lane-b` | 3020     | `NEXT_PORT=3020` |

### Dev server (once per session, from the worktree root)
```sh
PORT=3010 npm run dev    # Lane A
PORT=3020 npm run dev    # Lane B
# PowerShell: $env:PORT = "3010"; npm run dev
```
The gate does NOT need legacy (port 3001). Baseline PNGs are committed — run `compare`, never `baseline`.

---

## Per-view loop (repeat until lane list is empty)

### 1. Pick view
Take the next `not_started` view assigned to your lane (see **Initial assignment** below).
Never touch another lane's view or one already `passing`.

### 2. Read legacy source
`<NN>-<id>/<id>.jsx` — identify: hook used, color constants, write operations, interactivity level.

### 3. Classify: server vs client
| Has `useState` / event handlers / Supabase writes | `"use client"` |
| Static render only | Server component — no directive |

### 4. Spine edits (shared files — APPEND-ONLY, never restructure)

**`src/app/globals.css` `@theme` block:**
Add new tokens the view needs. One line per token. Dark default only unless legacy theme.js had a light value.
```css
--color-status-scheduled: #22C55E;   /* example pattern */
--color-program-piano:    #818CF8;
```
Never reorder, rename, or split existing blocks. Never add `[data-theme="light"]` without a legacy source value.

**`src/lib/derive/types.ts`:**
Extend the view's type with every field the component reads. All additions optional:
```ts
export type Booking = { id: string; status?: string | null; parent_name?: string | null; … };
```
Never remove or rename existing fields. Downstream callers only access the fields already there.

**Conflict protocol:** Additive edits always merge cleanly. If two lanes add the same token/field name in the same session, report to Zach before staging — don't resolve silently.

### 5. Create page wrapper
`src/app/(operator)/<id>/page.tsx` — always 5 lines:
```tsx
import <Name>View from "@/components/views/<Name>View";

export default function <Name>Page() {
  return <<Name>View />;
}
```

### 6. Create the view component
`src/components/views/<Name>View.tsx`

**Color token map — no exceptions:**
| Legacy | Component value |
|--------|----------------|
| `T.bg` | `"var(--color-bg)"` |
| `T.t1` … `T.t4` | `"var(--color-text-1)"` … `"var(--color-text-4)"` |
| `T.border` | `"var(--color-border)"` |
| `T.rowHover \|\| 'rgba(…)'` | `"var(--color-row-hover)"` |
| `T.hover` | `"var(--color-hover)"` |
| `statusColor(s)` → hex | `statusVar(s)` → `var(--color-status-<s>)` |
| `programColor(p)` → hex | `programVar(p)` → `var(--color-program-<p>)` |
| `hex + '1A'` (10% alpha badge) | `color-mix(in srgb, var(--color-<token>) 10%, transparent)` |
| `hex + '40'` (25% alpha border) | `color-mix(in srgb, var(--color-<token>) 25%, transparent)` |
| `hex + '0D'` (5% alpha bg) | `color-mix(in srgb, var(--color-<token>) 5%, transparent)` |

Zero hex literals. Zero Tailwind color utilities.

**Hook imports:**
```tsx
import { useBookings } from "@/hooks/tables";   // all table hooks are here
import { supabase } from "@/lib/supabase/client";  // only when the view writes to DB
```
Never use `window.sb` or `window.T`.

**Optimistic update pattern (for views with DB writes):**
```tsx
const { data: rawData } = useBookings();
const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});

const rows = (rawData ?? []).map((b) =>
  optimisticStatus[b.id] ? { ...b, status: optimisticStatus[b.id] } : b
);

async function markSomething(id: string, newVal: string) {
  setOptimisticStatus((prev) => ({ ...prev, [id]: newVal }));
  const { error } = await supabase.from("table").update({ col: newVal }).eq("id", id);
  if (error) {
    setOptimisticStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }
}
```
Never `setState` inside `useEffect` to mirror hook data — derive from `rawData` + override map. ESLint will flag the useEffect pattern; the derive pattern is clean.

**Row hover (client component):**
```tsx
onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach((td) => { td.style.background = "var(--color-row-hover)"; })}
onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach((td) => { td.style.background = "transparent"; })}
```

### 7. Run the gate
```sh
# PowerShell (from worktree root):
$env:NEXT_PORT = "3010"; node _migration/epic/GATES/render-diff.mjs compare <id>; $env:NEXT_PORT = ""
npx tsc --noEmit
npx eslint .
```

**Pass:** render-diff ≤ 1% (empty-state floor ~0.36%) + tsc 0 errors + eslint 0 errors.
**Fail:** STOP. Report what the diff image shows. Do NOT thrash or eyeball-fix.
Pre-existing warning in `OperatorShell.tsx` (`no-img-element`) is not your problem.

### 8. Stage and hand off — do NOT commit
```sh
git add src/app/(operator)/<id>/page.tsx \
        src/components/views/<Name>View.tsx \
        src/app/globals.css \
        src/lib/derive/types.ts   # only if you touched it
git status
```
Report to Zach: render-diff %, tsc/eslint status, staged files, any suppressed lint rule (with reason).
Zach reviews → commits → runs `node flip-state.mjs <id> passing` → you rebase → next view.

### 9. Rebase before next view
```sh
git fetch origin
git rebase origin/main
```
Spine edits are append-only, so rebase is clean. If there's a conflict on `globals.css` or `types.ts`, stop and report — the other lane added the same token/field name.

---

## Hard rules

- **WIP = 1 per lane.** One active view at a time. Finish + hand off before starting the next.
- **Zach is the commit funnel.** Never commit from a lane. Never push.
- **Empty-state baselines** are by design for data views. Tsc/eslint + "every token ref resolves" cover the badge/color code path that pixels can't.
- **One view = one staged set.** Never bundle two views. Never commit `next-env.d.ts`, `tsconfig.tsbuildinfo`.
- **Migration ≠ redesign.** Same behavior, same output, different code substrate. No new features.
- **Baseline coverage check before starting a view.** The 7 committed baselines cover each lane's first 3 views (A: reporting/pages/enrollments; B: settings/escalations/leads). Views 4+ (A: campaigns/automation-rules; B: integrations/conversations) have no baseline yet. Before porting one of these, run `node _migration/epic/GATES/render-diff.mjs baseline <id>` **from the main worktree** with legacy on :3001 — then commit the PNG before the lane runs `compare`. Without a committed baseline, `compare` exits 1 immediately.
- **No baseline regeneration in a lane.** Baselines are generated once from the main worktree (needs legacy on :3001); committed to main; lanes pull them via rebase.

---

## Initial assignment (simplest-first by LOC)

- **Lane A (port 3010):** reporting (166) → pages (148) → enrollments (207) → campaigns (287) → automation-rules (176)
- **Lane B (port 3020):** settings (190) → escalations (208) → leads (265) → integrations (209) → conversations (252)
- **Solo/last** (heavy or many hooks): command-center (194, 5 hooks) → studio-map (448) → clients (597) → onboarding
- Schools + dashboard surfaces: not here — they decompose during Phase 4 surface split.
