> **SUPERSEDED (Phase 1+).** Component work now happens in `src/` under Next.js App Router. Steps below describe editing the pre-migration Babel/`window.*` app. See `/CLAUDE.md` for current approach and phase gates.

# 01 — Edit Component

Editing or fixing a `.jsx` component or a section of `index.html`.

---

## Why this guide exists

No bundler. No imports. Everything runs through `window` globals and sequential `<script>` tags. One wrong edit — a hardcoded color, a component defined inside a parent, a duplicate switch case — breaks silently with no error until you open the browser. This guide prevents that.

---

## Load before starting

| Resource | Load When | Why |
|---|---|---|
| `.brain/current-state.md` | Always | What's broken, what's in progress — don't start blind |
| Target folder `CONTEXT.md` (e.g. `04-families/CONTEXT.md`) | Always | Hard stop rules and cross-load table for the folder being edited |
| `94-knowledge/architecture.md` | Only if task touches theme, status colors, nav routing, or drag-and-drop | Theme tokens, shared globals, drag-and-drop module-scope rule |

**SKIP `94-knowledge/architecture.md`** for routine layout, text, or logic changes — root `CLAUDE.md` Safety Gates already cover the shared exports you need to know about.

Do NOT load `session-log.md` — that's history, not instructions.

---

## Process

1. Root `CLAUDE.md` → repo tree → confirm which file owns the component. If inline in `index.html`, it's in the bottom half of that file.
2. Read the target folder's `CONTEXT.md` — hard stop rules + any allowed cross-loads apply immediately. Do not open the target file until this is read.
3. Read the target file before touching anything. Never edit blind.
4. Make only the change that was asked. Do not clean up adjacent code.
5. Theme changes → use tokens from `window.T`. Never hardcode hex colors. (See `94-knowledge/architecture.md` → Theme System if loaded.)
6. Status color changes → use `window.getStudentStatusColors` for student statuses, `window.getBadgeColors` for family/billing statuses. Both are shared globals — do not redefine locally.
7. Drag-and-drop components → must be defined at module scope, not inside a parent component. React remounts on every render and kills the drag mid-flight.
8. Verify the change in browser — open `index.html`, navigate to the affected view, confirm it renders.
9. Close the session via `how-to/session-close/CONTEXT.md`.

**STOP before editing `index.html` renderMain() switch:** check for duplicate case entries before and after your change. Duplicates silently overwrite the correct handler.

---

## Done when

- Target file edited, nothing else touched
- Affected view renders correctly in browser
- Session closed via `how-to/session-close/`
