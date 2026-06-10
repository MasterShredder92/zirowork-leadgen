# ZiroWork Operator CRM

React 18 + Babel SPA. No bundler. Supabase live (Phase 2 in progress).
Internal operator CRM — not client-facing. See `94-knowledge/northstar-ideology.md`.

---

## Navigate First — No Skipping

1. Read this file (CLAUDE.md) — you are doing this now
2. Read root `CONTEXT.md` — routes your task to the correct folder
3. Read the target folder's `CONTEXT.md` — load list + guardrails
4. Load only the files listed there
5. Do the task. Nothing else.

**Cannot identify the correct folder? STOP AND ASK. Do not explore.**

---

## Non-Negotiable Rules

- **Do only what was asked.** No extra features, no cleanup, no "while I'm here."
- **Ask, don't assume.** Unclear? Stop and ask. Never fill gaps with defaults or guesses.
- **Load only what the task requires.** Each folder's CONTEXT.md has the load list.
- **Surgical edits only.** Touch only the file and lines the task requires.
- **Judgment is not permitted.** Rules are not suggestions. If not covered — stop and ask.

---

## Repo Tree

Folder number = CRM page nav position.

```
zirowork-command-center-speed-to-lead/
├── index.html              — SPA shell + <script> load order (CRITICAL: order matters)
├── CLAUDE.md               — this file (Layer 0)
├── CONTEXT.md              — task router (Layer 1)
│
├── 00-command-center/      window.CommandCenterView   | route: command-center
├── 01-clients/             window.ClientsView         | route: clients
├── 02-onboarding/          window.ClientOnboardingView| route: onboarding
├── 03-campaigns/           window.CampaignsView       | route: campaigns
├── 04-pages/               window.PagesView           | route: pages
├── 05-leads/               window.LeadsView           | route: leads
├── 06-conversations/       window.ConversationsView   | route: conversations
├── 07-escalations/         window.EscalationsView     | route: escalations
├── 08-bookings/            window.BookingsView        | route: bookings
├── 09-enrollments/         window.EnrollmentsView     | route: enrollments
├── 10-reporting/           window.ReportingView       | route: reporting
├── 11-automation-rules/    window.AutomationRulesView | route: automation-rules
├── 12-assets/              window.AssetsView          | route: assets
├── 13-integrations/        window.IntegrationsView    | route: integrations
├── 14-settings/            window.SettingsView        | route: settings
├── 15-insights/            window.InsightsView        | route: insights
├── 02-studio-map/          window.StudioMapView       | route: studio-map — NOT BUILT YET
│
├── 90-shell/               — Header, Router, sidebar, user-menu, workspace-overlay
├── 91-auth/                — Session.jsx (auth bypass, seeds globals)
├── 92-design/              — theme.js ⚠️ HIGH RISK, design-tokens, colors, icons
├── 93-hooks/               — use-local-data.js, use-studio-context.js, use-supabase-table.js (stub),
│                             use-form-state.js, use-is-mobile.js, use-lessons.js, use-students.js, use-pages.js
├── 94-knowledge/           — northstar-ideology.md, architecture.md, design-system.md, data-model.md
├── 96-public/              — favicons, icon.svg
│
├── client-portal/          — separate React SPA (client-facing, own deploy)
├── landing-pages/          — separate React SPA (marketing, own deploy)
├── legal/                  — static legal pages
└── 99-agents/              — Python agent backend (separate deployment, port 8000)
```

---

## Safety Gates

| File | Risk |
|---|---|
| `92-design/theme.js` | Breaks all themes globally — `window.T` used by every view |
| `index.html` script load order | New pages must load **before** `90-shell/Router.jsx` |
| `90-shell/Router.jsx renderMain()` | Duplicate route cases silently overwrite each other |
| `93-hooks/use-local-data.js` | `window.SEED_DATA` — all page views read from here |

---

## Key Globals

| Symbol | File | Purpose |
|---|---|---|
| `window.T` | `92-design/theme.js` | Theme tokens — used by every view |
| `window.SEED_DATA` | `93-hooks/use-local-data.js` | Dev seed data fallback |
| `window.currentUser` | `91-auth/Session.jsx` | `{ full_name, role, email }` |
| `window.currentOperator` | `91-auth/Session.jsx` | `{ name, label }` |
| `window.useOperatorContext` | `93-hooks/use-studio-context.js` | Operator identity hook |
| `window.useSupabaseTable` | `93-hooks/use-supabase-table.js` | Stub — warns + returns empty |
| `window.ComingSoon` | `90-shell/Header.jsx` | Fallback for unbuilt routes |
| `window.App` | `90-shell/Router.jsx` | Root component |
| `window.Root` | `91-auth/Session.jsx` | ReactDOM mount point |

---

## Quick Navigation

| Need | Go Here |
|---|---|
| Task routing | `CONTEXT.md` |
| Product vision + business model | `94-knowledge/northstar-ideology.md` |
| Design system | `94-knowledge/design-system.md` |
| Architecture | `94-knowledge/architecture.md` |
| Data model | `94-knowledge/data-model.md` |
| Seed data | `93-hooks/use-local-data.js` |
| Auth bypass | `91-auth/Session.jsx` |
| SPA routing | `90-shell/Router.jsx` |
| Sidebar nav | `90-shell/sidebar.jsx` |
| Agent backend | `99-agents/README.md` |
| Supabase credentials | `.env` (gitignored) |
