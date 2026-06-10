# ZiroWork Operator CRM — Task Router (Layer 1)

## Routing

| Task | Load | Do NOT Load |
|---|---|---|
| Edit a page view (routes 00–15) | Go to `<NN>-<feature>/` → read its CONTEXT.md → load only the listed `.jsx` | All other views |
| Edit shell / auth / hooks | Go to `90-shell/`, `91-auth/`, or `93-hooks/` → read CONTEXT.md first | Views, knowledge |
| Edit seed data | `93-hooks/use-local-data.js` only | All views |
| New page view | `94-knowledge/design-system.md` + existing page stub | Old docs, sibling views |
| Wire real Supabase data | `94-knowledge/data-model.md` → target hook | Other knowledge files |
| Fix theme / tokens | `92-design/theme.js` + `92-design/CONTEXT.md` | Views, other 94-knowledge |
| Mobile work | `94-knowledge/design-system.md` + target folder file | Other docs |
| Understand the product | `94-knowledge/northstar-ideology.md` | — |
| Agent backend work | `99-agents/CONTEXT.md` first | Frontend files |

**Rule: for any page in 00–15, load only that folder's files. Do not load sibling folders.**

---

## Phase Status

**Phase 1 — COMPLETE**
- Supabase live: `window.sb` wired in `index.html`
- Auth bypassed: `91-auth/Session.jsx` seeds `window.currentUser` and `window.currentOperator`
- 13 real Supabase tables populated. `window.SEED_DATA` is fallback only.
- All 16 pages reading real data. 9 writes wired.

**Phase 2 — IN PROGRESS**
- Agent backend (`99-agents/`): code written, not yet deployed. SQL migrations updated (old codenames replaced with ziro_* naming). Migrations NOT yet run.
- Studio Map: researched (vis-network via CDN). Not yet built.
- Agent tables not in Supabase yet — run `99-agents/database/migrations/` in order to create them.

---

## Safety Gates

| File | Risk |
|---|---|
| `92-design/theme.js` | Breaks both light + dark themes globally |
| `index.html` script load order | New pages must load before `90-shell/Router.jsx` |
| `90-shell/Router.jsx renderMain()` | Duplicate cases silently overwrite — audit before adding routes |
| `window.T` in `92-design/theme.js` | Used by every view globally |
| `window.SEED_DATA` in `93-hooks/use-local-data.js` | All 16 page views read from here |
| `window.currentUser` / `window.currentOperator` | Set by `91-auth/Session.jsx`, read by shell + settings |

---

## Key Globals

| Symbol | File | Purpose |
|---|---|---|
| `window.T` | `92-design/theme.js` | Theme tokens (colors, spacing) — used everywhere |
| `window.SEED_DATA` | `93-hooks/use-local-data.js` | Dev seed data for all views |
| `window.currentUser` | `91-auth/Session.jsx` | `{ full_name, role, email }` |
| `window.currentOperator` | `91-auth/Session.jsx` | `{ name, label }` |
| `window.useOperatorContext` | `93-hooks/use-studio-context.js` | Operator identity hook |
| `window.useSupabaseTable` | `93-hooks/use-supabase-table.js` | Stub — warns + returns empty |
| `window.ComingSoon` | `90-shell/Header.jsx` | Fallback for unbuilt routes |
| `window.App` | `90-shell/Router.jsx` | Root component |
| `window.Root` | `91-auth/Session.jsx` | ReactDOM mount point |

**Credentials:** See `.env` (gitignored).
