# 93-hooks — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Data hooks — shared React hooks for data access, form state, and utility. Used across all page views.

## Files in this folder
```
use-local-data.js      — ⚠️ exports window.SEED_DATA (all page views read from here as fallback)
use-studio-context.js  — exports window.useOperatorContext (operator identity hook)
use-supabase-table.js  — STUB: warns + returns empty. Do NOT use for real data reads.
use-form-state.js      — generic form state management hook
use-is-mobile.js       — responsive breakpoint detection
use-lessons.js         — lesson data hook (reads Supabase)
use-students.js        — student data hook (reads Supabase)
use-pages.js           — landing pages data hook (reads Supabase)
```

## Enter ONLY if
Your task explicitly names: seed data, a specific hook, `window.SEED_DATA`, `window.useOperatorContext`, or data wiring for a view.

## Do NOT enter if
- Task involves a specific page view's UI → go to that folder
- Task involves Supabase credentials → see `.env`
- Task involves the auth globals → go to `91-auth/Session.jsx`

## Load rules by sub-task
| Task | Load |
|---|---|
| Seed data for a view | `use-local-data.js` only |
| Operator identity | `use-studio-context.js` only |
| Form state | `use-form-state.js` only |
| Mobile detection | `use-is-mobile.js` only |
| Lesson data | `use-lessons.js` only |
| Student data | `use-students.js` only |
| Landing page data | `use-pages.js` only |
| Wire a new Supabase table | Read `94-knowledge/data-model.md` first, then create or edit the relevant hook here |

## Hard stop
`use-local-data.js` seeds `window.SEED_DATA` which all 16 page views read. Change its shape carefully.
`use-supabase-table.js` is a stub — it warns and returns empty. It is NOT for real Supabase reads. Use specific hooks instead.
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
