# ZiroWork Lead-Gen Platform

React 18 + Babel SPAs. No bundler. Supabase live.
**ONE repo** (`github.com/MasterShredder92/zirowork-leadgen`), **ONE Vercel project** (Root Directory `.`).
Surfaces, all in this repo, routed by root `vercel.json`:
operator CRM (`/`) · student landing pages (`/schools`) · client portal (`/dashboard`) · public self-serve onboarding (`/onboarding` → `onboard.html`).
Doctrine / SSOT: `ZiroWork-Client-Flow` + `94-knowledge/northstar-ideology.md`.

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

## Keep Docs In Sync (anti-stale)

These docs describe the repo and MUST be updated in the **same change** that makes them stale — that's part of "done," not optional:

| If you change… | Update… |
|---|---|
| operator folder structure, routing, globals, or surfaces | this `CLAUDE.md` (tree + tables) + `94-knowledge/architecture.md` |
| `schools/` · `dashboard/` · `onboard.html` · `vercel.json` routing | this `CLAUDE.md` + `README.md` |
| edge functions / backend layout in `99-agents/` | `99-agents/CONTEXT.md` (never alter agent names, voice, or brand speak) |
| a folder's files or load list | that folder's `CONTEXT.md` |

Each of these docs carries a `> Keep this in sync:` header. **A stale doc is a defect.**

---

## Branding Gate (never ship a page without it)

Every HTML entry point — operator, `schools`, `dashboard`, `onboard.html`, and **any new page/surface** — MUST include the ZiroWork favicon set + brand assets. Not optional. A page without ZiroWork branding is **NOT done**.

```html
<link rel="icon" href="/96-public/favicon.ico?v=3" sizes="any">
<link rel="icon" href="/96-public/icon.svg?v=3" type="image/svg+xml">
<link rel="apple-touch-icon" href="/96-public/apple-touch-icon.png?v=3">
```

Brand assets live in `96-public/`. (Operator `index.html` is served at `/` so it uses relative `96-public/...`; every other surface uses absolute `/96-public/...`.)

---

## Repo Tree

One repo, one Vercel project (root dir `.`). Operator folder number = CRM sidebar nav position.

```
zirowork-leadgen/
│
│  OPERATOR CRM — served at /  (internal; numbered folder = sidebar position)
├── index.html              — operator SPA shell + <script> load order (CRITICAL: order matters)
├── 00-command-center/      window.CommandCenterView   | route: command-center
├── 01-clients/             window.ClientsView         | route: clients
├── 02-onboarding/          window.ClientOnboardingView| route: onboarding  (also powers onboard.html)
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
├── 16-studio-map/          window.StudioMapView       | route: studio-map
├── 90-shell/               — Header, Router, sidebar, user-menu, workspace-overlay
├── 91-auth/                — Session.jsx (auth bypass, seeds globals)
├── 92-design/              — theme.js ⚠️ HIGH RISK, design-tokens, design-tweaks, icons
├── 93-hooks/               — use-local-data.js, use-studio-context.js, use-supabase-table.js (stub), use-is-mobile.js, use-pages.js …
├── 96-public/              — favicons, icon.svg
│
│  PUBLIC SURFACES — same Vercel project, routed by vercel.json
├── schools/                — student landing pages  → /schools/{slug}/{instrument}
├── dashboard/              — client portal           → /dashboard
├── onboard.html            — public self-serve onboarding, served at /onboarding (renders 02-onboarding OnboardForm)
├── onboarding/             — scaffold (future onboarding section — empty)
├── www/                    — scaffold (future marketing site — empty)
├── legal/                  — static legal pages
│
│  BACKEND & DOCS — not served to the browser
├── 99-agents/              — Python / Supabase edge-function backend
├── 94-knowledge/           — reference docs (architecture, data-model, design-system, northstar …)
├── ZiroWork-Client-Flow    — single source of truth / doctrine (markdown, no extension)
├── MASTER_PLAN.md          — launch execution plan
├── .brain/                 — session memory + logs
│
├── vercel.json             — rewrites /schools + /dashboard; operator served at /
├── CLAUDE.md               — this file (Layer 0 router)
└── CONTEXT.md              — task router (Layer 1)
```

---

## Safety Gates

| File | Risk |
|---|---|
| `92-design/theme.js` | Breaks all themes globally — `window.T` used by every view |
| `index.html` script load order | New pages must load **before** `90-shell/Router.jsx` |
| `90-shell/Router.jsx renderMain()` | Duplicate route cases silently overwrite each other |
| `93-hooks/use-local-data.js` | `window.SEED_DATA` — all page views read from here |
| `vercel.json` (root) | Wrong/removed rewrite 404s `/schools` or `/dashboard` |
| `onboard.html` ↔ `02-onboarding/onboard-form.jsx` | Form shared by CRM onboarding view AND public onboard.html — edits hit both |
| `schools/index.html`, `dashboard/index.html` | Script `src`s are absolute (`/schools/…`, `/dashboard/…`) — keep the prefix or assets 404 |

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
| Single source of truth (doctrine) | `ZiroWork-Client-Flow` |
| Design system | `94-knowledge/design-system.md` |
| Architecture | `94-knowledge/architecture.md` |
| Data model | `94-knowledge/data-model.md` |
| Seed data | `93-hooks/use-local-data.js` |
| Auth bypass | `91-auth/Session.jsx` |
| SPA routing (operator) | `90-shell/Router.jsx` |
| Sidebar nav | `90-shell/sidebar.jsx` |
| Student landing pages | `schools/` → /schools/{slug}/{instrument} |
| Client portal | `dashboard/` → /dashboard |
| Public onboarding form | `onboard.html` + `02-onboarding/onboard-form.jsx` |
| Deploy / routing | root `vercel.json` (one Vercel project, root dir `.`) |
| Agent backend | `99-agents/README.md` |
| Supabase credentials + live access | `.env` (gitignored) — see **Live Supabase Access** below |
```

---

## Live Supabase Access

**All live credentials live in `.env`** (gitignored — never committed, never deployed; edge functions read their own secrets from the Supabase dashboard). Project ref `txpgyuetfsrzfxxopwzf`. This is the SSOT pointer — agents pull the actual values from `.env`, never from a committed file.

| To do… | Use (from `.env`) | Notes |
|---|---|---|
| Read/write table rows | `SUPABASE_URL` + `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) via PostgREST `/rest/v1/` | RLS is open in Phase 2 |
| Call an edge function / pg_cron | `SUPABASE_SECRET_KEY` (`sb_secret_…`) as `Authorization: Bearer` | ⚠ This project migrated to new keys — the legacy `service_role` JWT returns **401** from functions |
| Run SQL / DDL (create/alter/drop) | `SUPABASE_MGMT_TOKEN` → `POST https://api.supabase.com/v1/projects/txpgyuetfsrzfxxopwzf/database/query`, body `{"query":"…"}` | PostgREST cannot run DDL; the CLI is also logged in |
| Deploy an edge function | `supabase functions deploy <name> --project-ref txpgyuetfsrzfxxopwzf` | CLI session already authenticated |

**Never** paste these secrets into committed files — only `.env` holds them.
