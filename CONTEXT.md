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

**Phase 1 — ✅ COMPLETE (2026-06-13)**
- Supabase live: `window.sb` wired in `index.html`
- Auth live: `91-auth/Session.jsx` enforces Supabase login, seeds `window.currentUser` and `window.currentOperator`
- 18 real Supabase tables populated with RLS. `window.SEED_DATA` is fallback only.
- All 16 operator pages reading real data. 9 writes wired. Forms→SMS→Leads working end-to-end.

**Phase 2 — ✅ COMPLETE (2026-06-13 TIER 0 MVP)**
- Agent backend (`99-agents/`): DEPLOYED. All 10 critical edge functions live and reachable (complete-onboarding, scrape-school, on-new-lead, process-pending, on-reply, send-followup, enrollment-handoff, monthly-report, intake-form, billing). SQL migrations run (RLS hardening deployed 2026-06-13).
- Landing pages: LIVE. Forms submit to Supabase < 2 sec, leads appear in operator CRM.
- SMS: Twilio LIVE (+1 402-581-9366). All sends/receives working.
- Billing: Code ready, waiting for Square API credentials (post-launch configuration).
- Agent tables LIVE in Supabase (agent_tenants, ziro_events, ziro_message_log, ziro_messaging_escalations, pending_leads, and 13 more). 3 pg_cron jobs active (process-pending every 5 min, send-followup hourly, monthly-report 1st of month 6am).
- Studio Map: NOT YET (TIER 1).

**Phase 3 — READY (Post-Launch)**
- RLS hardening: Replace `USING (true)` with role-based filters (multi-operator safety)
- Observability: Telemetry, outbox, loop-breaker

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
