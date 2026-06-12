# ZiroWork — Architecture Reference

> Keep this in sync: update this file whenever the operator folder structure, routing, globals, or surfaces change. Ground truth = root `CLAUDE.md`.

Component patterns, theme system, navigation routing, data layer, and design decisions for the ZiroWork Operator CRM.

---

## SKIP THIS FILE UNLESS

The task specifically involves one of these:
- **Theme tokens** — colors, spacing, `window.T`, light/dark values
- **Status / badge colors** — theme-aware badge patterns
- **Navigation** — adding/changing routes, the `renderMain()` switch, view keys
- **Data layer** — hooks, `window.SEED_DATA` fallback, live Supabase wiring
- **Surfaces** — the public `schools/` / `dashboard/` apps, `onboard.html`, or `vercel.json` routing

For a routine component edit (layout, text, logic) — you do not need this file. Close it and proceed.

---

## GUARDRAILS — READ BEFORE TOUCHING ANY CODE

- **Edit only the file and lines the task specifies.** Do not touch adjacent code, comments, or formatting.
- **Do not refactor things that aren't broken.** Match existing style even if you'd do it differently.
- **Follow the Code Rules section below. No exceptions.** Every view/hook/util binds to `window`. No god files.
- **If the task is ambiguous — stop and ask.** Do not fill in scope gaps with your own judgment.
- **No new abstractions.** If it wasn't asked for, don't build it.

---

## Stack

- React 18 + Babel (inline JSX, no bundler — loaded via `<script type="text/babel">`)
- Dual light/dark theme via `92-design/theme.js` → `window.T`
- Font: Plus Jakarta Sans
- Data: async hooks over the live Supabase JS client (`window.sb`), with `window.SEED_DATA` as a no-credentials dev fallback
- No build step. Open `index.html` directly in a browser or serve with any static server.

---

## No-Bundler / Global-Scope Model

There is **no bundler and no import system**. Every script is loaded in order by `index.html` and `window` is the module system.

- Plain `.js` files (theme, design tokens, hooks) load as ordinary `<script>` and run immediately.
- `.jsx` view/shell files load as `<script type="text/babel">` and are transpiled in the browser by `@babel/standalone`.
- Each file must expose what it provides on `window` at the bottom, or nothing else can reach it.

**Script load order matters** (see `index.html`):
1. React / ReactDOM / Babel standalone (CDN)
2. `92-design/theme.js`, `92-design/design-tokens.js`, `92-design/icons.jsx`
3. `vis-network` (Studio Map) + Supabase client (`window.sb` is created here)
4. `93-hooks/*` data layer
5. `92-design/design-tweaks.jsx`
6. `90-shell/sidebar.jsx`, `workspace-overlay.jsx`, `user-menu.jsx`
7. Every numbered view `00-command-center … 16-studio-map`
8. **Last:** `90-shell/Header.jsx`, `90-shell/Router.jsx`, `91-auth/Session.jsx`

New page views must load **before** `90-shell/Router.jsx`, or their `window.<X>View` will be undefined when `renderMain()` runs.

---

## Code Rules

These apply to every file in this project. No exceptions.

**1. Window binding — required on every file**
No bundler, no imports. Every component, hook, or utility must expose itself at the bottom of its file:
```js
window.MyComponent = MyComponent;
```
If it's not on `window`, it doesn't exist to the rest of the app.

**2. Supabase data is relational — keep it that way**
Supabase returns the row shape you select. Don't flatten nested/related data back into a flat array — consume the shape Supabase gives you.

**3. One file, one job**
A view is a view. A hook is a hook. A utility is a utility. If a file does two things, split it.

**4. Section anchors in multi-component files**
Any file with more than one component or hook gets a single-line anchor before each one:
```js
// ── ComponentName ──────────────────────────────────────────────────────
```
No paragraphs, no block comments — just the anchor. A jump point for scanning and regex.

---

## Folder Governance (the ICM numbered-folder structure)

The operator app is organized as numbered folders in CRM nav order — **one folder per nav item**. Each numbered folder exports a single `window.<Name>View` consumed by the router. (Folder number = sidebar position.)

```
00-command-center/   window.CommandCenterView      route: command-center
01-clients/          window.ClientsView            route: clients
02-onboarding/       window.ClientOnboardingView   route: onboarding
03-campaigns/        window.CampaignsView          route: campaigns
04-pages/            window.PagesView              route: pages
05-leads/            window.LeadsView              route: leads
06-conversations/    window.ConversationsView      route: conversations
07-escalations/      window.EscalationsView        route: escalations
08-bookings/         window.BookingsView           route: bookings
09-enrollments/      window.EnrollmentsView        route: enrollments
10-reporting/        window.ReportingView          route: reporting
11-automation-rules/ window.AutomationRulesView    route: automation-rules
13-integrations/     window.IntegrationsView       route: integrations
14-settings/         window.SettingsView           route: settings
15-insights/         window.InsightsView           route: insights
16-studio-map/       window.StudioMapView          route: studio-map

90-shell/   91-auth/   92-design/   93-hooks/   94-knowledge/   96-public/
```

Full tree with every `window.X` global and route key → root `CLAUDE.md`.

> Note: the root `CLAUDE.md` repo tree labels Studio Map as `02-studio-map/ — NOT BUILT YET`, while `index.html` loads it from `16-studio-map/studio-map.jsx` and the router maps `studio-map → window.StudioMapView`. `16-studio-map/` is the path the app actually loads. `UNVERIFIED`: build/wiring completeness of the Studio Map view.

---

## File Routing Map

| File | Role |
|---|---|
| `index.html` | Operator SPA shell — script loader, CSS vars, `window.sb` init, `<div id="root">` |
| `92-design/theme.js` | Theme tokens → `window.T`, `window.toggleTheme()`, fires `zw-theme-changed` |
| `92-design/design-tokens.js` | Shared design primitives |
| `92-design/design-tweaks.jsx` | Tweaks panel (`window.useTweaks`, `TweaksPanel`, accent picker) |
| `92-design/icons.jsx` | Lucide React icon re-exports (`window.LucideReact`) |
| `90-shell/sidebar.jsx` | Sidebar nav |
| `90-shell/Header.jsx` | Mobile header (`window.MobileHeader`) + `window.ComingSoon` fallback |
| `90-shell/user-menu.jsx` | User menu (`window.UserMenu`) |
| `90-shell/workspace-overlay.jsx` | Shared overlay/modal shell |
| `90-shell/Router.jsx` | `window.App` — state-based nav, `renderMain()` switch |
| `91-auth/Session.jsx` | `window.Root` mount point; seeds `window.currentUser` / `window.currentOperator` (Phase 1: no auth) |
| `93-hooks/use-local-data.js` | `window.SEED_DATA` + the `useClients`/`useLeads`/… data hooks |
| `00-command-center … 16-studio-map` | One view file per numbered folder |

---

## Navigation / Routing

Routing is **state-based, not URL-based.** `window.App` (`90-shell/Router.jsx`) holds a `navHistory` stack in `useState`; the current view is the top of the stack. There is no router library and no URL hash.

- `nav(view)` pushes a route key; `goBack()` pops it (also wired to a mobile left-edge swipe).
- Every view receives an `onNavigate` prop (the `nav` function).
- `renderMain()` is a `switch (view)` mapping each route key to its global, with a `ComingSoon` fallback when the view global is missing:

```js
case 'leads': return window.LeadsView
  ? React.createElement(window.LeadsView, { onNavigate: nav })
  : React.createElement(window.ComingSoon, { label: 'Leads' });
```

Adding a route = load the view file before `Router.jsx`, add a `case` in `renderMain()`, add a sidebar entry, and add a `MOBILE_TITLES` entry. Duplicate `case` keys silently overwrite each other.

| View key | Component | Source |
|---|---|---|
| `command-center` | `window.CommandCenterView` | `00-command-center/command-center.jsx` |
| `clients` | `window.ClientsView` | `01-clients/clients.jsx` |
| `onboarding` | `window.ClientOnboardingView` | `02-onboarding/onboarding.jsx` |
| `campaigns` | `window.CampaignsView` | `03-campaigns/campaigns.jsx` |
| `pages` | `window.PagesView` | `04-pages/pages.jsx` |
| `leads` | `window.LeadsView` | `05-leads/leads.jsx` |
| `conversations` | `window.ConversationsView` | `06-conversations/conversations.jsx` |
| `escalations` | `window.EscalationsView` | `07-escalations/escalations.jsx` |
| `bookings` | `window.BookingsView` | `08-bookings/bookings.jsx` |
| `enrollments` | `window.EnrollmentsView` | `09-enrollments/enrollments.jsx` |
| `reporting` | `window.ReportingView` | `10-reporting/reporting.jsx` |
| `automation-rules` | `window.AutomationRulesView` | `11-automation-rules/automation-rules.jsx` |
| `integrations` | `window.IntegrationsView` | `13-integrations/integrations.jsx` |
| `settings` | `window.SettingsView` | `14-settings/settings.jsx` |
| `insights` | `window.InsightsView` | `15-insights/insights.jsx` |
| `studio-map` | `window.StudioMapView` | `16-studio-map/studio-map.jsx` |

---

## Data Layer

Defined in `93-hooks/use-local-data.js`. Each table has a hook (`useClients`, `useCampaigns`, `useLeads`, `useConversations`, `useEscalations`, `useBookings`, `useEnrollments`, `useOperatorTasks`, `useClientReports`, `useAutomationRules`, `useIntegrations`), all exposed on `window`.

Every hook is built on `_useTable(table, seedKey, filters)`, which:
- If `window.sb` is **absent** (dev, no credentials) → returns filtered rows from `window.SEED_DATA[seedKey]`.
- If `window.sb` is **present** → selects from the live Supabase table (`order('created_at', desc)`, optional `.eq()` filters).
- Returns `{ data, loading, error, refetch }`.

Views consume them directly, e.g. `const leads = useLeads().data || [];`. Some views (e.g. Command Center KPIs) also issue ad-hoc `window.sb.from(...)` count queries for live aggregates.

---

## Theme System

All components access theme via: `const T = window.T || {};`

`92-design/theme.js` builds a `dark` and `light` token object, picks one from `localStorage('zw-theme')` (default dark), and assigns it to `window.T`. `window.toggleTheme()` swaps the theme and fires a `zw-theme-changed` event; `window.App` listens and force-updates on it. CSS `:root` variables in `index.html` mirror the same palette for non-React surfaces and `prefers-color-scheme`.

**Representative tokens (dark):**

| Token | Value | Role |
|---|---|---|
| `T.isDark` | `true` / `false` | Theme boolean |
| `T.bg` | `#162833` | Page background |
| `T.sidebarBg` | `#0F1E27` | Sidebar background |
| `T.cardBg` / `T.surface` | `#233D4C` | Card / surface |
| `T.t1` | `#F5F4F1` | Primary text |
| `T.t2` | `#B0ADA9` | Secondary text |
| `T.t3` | `#7A7773` | Muted text |
| `T.t4` | `#565350` | Subtle text |
| `T.border` | `rgba(255,255,255,0.08)` | Borders |
| `T.borderMed` | `rgba(255,255,255,0.12)` | Medium borders |
| `T.hover` | `rgba(255,255,255,0.05)` | Hover bg |
| `T.accent` | `#FD802E` | Accent color |

`theme.js` also defines status-badge, instrument-badge, avatar, and calendar token groups; read the file for the full set and the light-mode values. `UNVERIFIED`: exact light-mode hex for every token (read `theme.js` directly before relying on a specific value).

---

## Component Patterns

### Standard view signature
```js
function LeadsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const leads = useLeads().data || [];
  // ...
}
window.LeadsView = LeadsView;
```
Views read theme from `window.T`, icons from `window.LucideReact`, data from the `93-hooks` hooks, and navigate via the injected `onNavigate`. Mutations write optimistically to local state, then persist via `window.sb` when present.

### Theme-aware status / badge colors
Never hardcode hex status colors inside a view. Use the badge token groups on `window.T` (e.g. `T.paidBg`/`T.paidText`, `T.pendingBg`/`T.pendingText`) or a theme-aware helper keyed on `T.isDark`, so both themes stay legible.

### Window globals pattern
External `.jsx` files expose components globally. Always guard before use:
```js
window.LeadsView
  ? React.createElement(window.LeadsView, props)
  : React.createElement(window.ComingSoon, { label: 'Leads' });
```

---

## Surfaces

The operator CRM (`index.html`) is one of several independently-routed surfaces in this repo. Routing for the public surfaces is configured in `vercel.json`:

```json
{ "rewrites": [
  { "source": "/schools/:path*",   "destination": "/schools/index.html" },
  { "source": "/dashboard",        "destination": "/dashboard/index.html" },
  { "source": "/dashboard/:path*", "destination": "/dashboard/index.html" }
]}
```

| Surface | Path | Audience | Role |
|---|---|---|---|
| Operator CRM | `index.html` | Internal operators | The numbered-folder app this doc describes |
| Client dashboard / portal | `dashboard/` (React SPA, own `index.html` + `app.jsx`) | Clients (music schools) | Client-facing portal; rewritten by `vercel.json` |
| Public school pages | `schools/` (React SPA, own `index.html` + `app.jsx`, `pages/`, `widgets/`) | Prospective students/parents | Public, slug-based lead-gen / booking landing pages |
| Onboarding | `onboard.html` (standalone) | New clients | Client self-setup form |

> The root repo also contains separate `client-portal/` and `landing-pages/` SPAs with their own deploys (see root `CLAUDE.md`). `UNVERIFIED`: the exact relationship between `dashboard/`/`schools/` here and those top-level `client-portal/`/`landing-pages/` directories — confirm before treating them as the same surface.

---

## Key Globals

| Symbol | File | Purpose |
|---|---|---|
| `window.T` | `92-design/theme.js` | Theme tokens — used by every view |
| `window.toggleTheme` | `92-design/theme.js` | Swap theme, fire `zw-theme-changed` |
| `window.SEED_DATA` | `93-hooks/use-local-data.js` | Dev seed-data fallback |
| `window.sb` | `index.html` | Supabase JS client |
| `window.currentUser` / `window.currentOperator` | `91-auth/Session.jsx` | Identity (Phase 1: hardcoded, no auth) |
| `window.App` | `90-shell/Router.jsx` | Root component (state-based nav) |
| `window.Root` | `91-auth/Session.jsx` | ReactDOM mount point |
| `window.ComingSoon` | `90-shell/Header.jsx` | Fallback for missing/unbuilt views |

---

## Phase Status

- **Phase 1 — no auth.** `91-auth/Session.jsx` seeds a hardcoded operator and renders straight into the app.
- **Phase 2 — Supabase live.** Data hooks read live tables when `window.sb` is configured (it is, in `index.html`), falling back to `SEED_DATA` only when absent. `UNVERIFIED`: which views are fully wired to live tables vs. still reading seed data.
