# ZiroWork — Architecture Reference

Component patterns, theme system, navigation routing, and design decisions for the Music Academy OS.

---

## SKIP THIS FILE UNLESS

The task specifically involves one of these:
- **Theme tokens** — colors, spacing, `window.T`, light/dark values
- **Status colors** — `getStudentStatusColors`, `getBadgeColors`, badge patterns
- **Navigation** — adding/changing routes, the renderMain() switch, view keys
- **Drag-and-drop** — any component using HTML5 drag events

For a routine component edit (layout, text, logic) — you do not need this file. Close it and proceed.

---

## GUARDRAILS — READ BEFORE TOUCHING ANY CODE

- **Edit only the file and lines the task specifies.** Do not touch adjacent code, comments, or formatting.
- **Do not refactor things that aren't broken.** Match existing style even if you'd do it differently.
- **Follow the Code Rules section below. No exceptions.** Every component binds to window. No flattening Supabase data. No god files.
- **If the task is ambiguous — stop and ask.** Do not fill in scope gaps with your own judgment.
- **No new abstractions.** If it wasn't asked for, don't build it.

---

## Stack

- React 18 + Babel (inline JSX, no bundler — loaded via `<script type="text/babel">`)
- Dual light/dark theme via `theme.js` → `window.T`
- Font: Plus Jakarta Sans
- No build step. Open `index.html` directly in a browser or serve with any static server.

---

## Code Rules

These apply to every file in this project. No exceptions.

**1. Window binding — required on every file**
There is no bundler, so there are no imports. `window` is the module system. Every component, hook, or utility must expose itself at the bottom of its file or nothing else can use it.
```js
window.MyComponent = MyComponent;
```
If it's not on `window`, it doesn't exist to the rest of the app.

**2. Supabase data is relational — keep it that way**
Supabase returns nested JSON (e.g. `family.students[0].lessons`). Never write code that flattens it back into a flat array. Consume the shape Supabase gives you.

**3. One file, one job**
Don't combine unrelated features into one file. A view is a view. A hook is a hook. A utility is a utility. If a file does two things, split it.

**4. Section anchors in multi-component files**
Any file with more than one component or hook gets a single-line anchor before each one:
```js
// ── ComponentName ──────────────────────────────────────────────────────
```
No paragraphs, no block comments — just the anchor. It's a jump point for scanning and regex.

---

## Folder Governance

Repo is organized as numbered CRM nav order. Each folder = one nav item.

```
00-dashboard/   01-schedule/   03-leads/      04-families/   05-students/
06-teachers/    07-services/   08-invoices/   09-payroll/    10-financials/
11-lifecycle/   12-recruitment/ 13-reports/   14-settings/   15-insights/
90-shell/       91-auth/       92-design/     93-hooks/      94-knowledge/
```

Full tree with `window.X` globals and route keys → root `CLAUDE.md`.

---

## File Routing Map

| File | Role |
|---|---|
| `index.html` | App shell — script loader, CSS vars, `<div id="root">` |
| `92-design/theme.js` | Theme tokens, `window.toggleTheme()`, pixel-crawl animation |
| `90-shell/sidebar.jsx` | Nav, command palette, theme toggle |
| `90-shell/Router.jsx` | `renderMain()` switch — maps route keys to window globals |
| `90-shell/Header.jsx` | Mobile top bar |
| `90-shell/workspace-overlay.jsx` | Shared overlay/modal shell |
| `00-dashboard/dashboard.jsx` | Dashboard view + DSF canvas |
| `01-schedule/calendar.jsx` | Weekly schedule grid |
| `03-leads/leads.jsx` | Leads pipeline canvas |
| `04-families/families.jsx` | Families table + drawer entry point |
| `05-students/student-roster.jsx` | Studio-wide student table |
| `05-students/student-profile.jsx` | Student profile, lessons, notes tabs |
| `06-teachers/teachers.jsx` | Teachers CRM view |
| `07-services/services.jsx` | Service catalog + pricing config |
| `08-invoices/invoices.jsx` | Invoice table + status badges |
| `09-payroll/payroll.jsx` | Payroll tracker |
| `10-financials/financials.jsx` | Financials dashboard |
| `11-lifecycle/lifecycle.jsx` | Visual lifecycle canvas |
| `13-reports/reports.jsx` | Reports grid |
| `14-settings/settings.jsx` | Studio settings |
| `92-design/icons.jsx` | Lucide React icon re-exports |

---

## Navigation / Views

| View key | Component | Source |
|---|---|---|
| `dashboard` | `window.DashboardView` | `00-dashboard/dashboard.jsx` |
| `calendar` | `window.CalendarView` | `01-schedule/calendar.jsx` |
| `leads` | `window.LeadsView` | `03-leads/leads.jsx` |
| `families` | `window.FamiliesView` | `04-families/families.jsx` |
| `student-profile` | `window.StudentDetailPage` | `05-students/student-profile.jsx` |
| `teachers` | `window.TeachersView` | `06-teachers/teachers.jsx` |
| `services` | `window.ServicesView` | `07-services/services.jsx` |
| `invoices` | `window.InvoicesView` | `08-invoices/invoices.jsx` |
| `payroll` | `window.PayrollView` | `09-payroll/payroll.jsx` |
| `financials` | `window.FinancialsView` | `10-financials/financials.jsx` |
| `lifecycle` | `window.LifecycleView` | `11-lifecycle/lifecycle.jsx` |
| `recruitment` | `window.RecruitmentView` | `12-recruitment/recruitment.jsx` (stub) |
| `reports` | `window.ReportsView` | `13-reports/reports.jsx` |
| `settings` | `window.SettingsView` | `14-settings/settings.jsx` |
| `insights` | `window.InsightsView` | `15-insights/insights.jsx` |
| `studio-map` | `ComingSoon` | stub (02-studio-map/ not yet built) |

---

## Theme System

All components access theme via: `const T = window.T || {};`

**Token reference:**

| Token | Dark | Light | Role |
|---|---|---|---|
| `T.t1` | `#F5F4F1` | `#1C1C1A` | Primary text |
| `T.t2` | `#B0ADA9` | `#4A4A48` | Secondary text |
| `T.t3` | `#7A7773` | `#717170` | Muted text |
| `T.t4` | `#565350` | `#8C8C8A` | Subtle text |
| `T.bg` | `#17161B` | `#FAFAF8` | Page background |
| `T.cardBg` | `#21202A` | `#FFFFFF` | Card background |
| `T.sidebarBg` | `#0F0E13` | `#F2F1EE` | Sidebar background |
| `T.border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` | Borders |
| `T.borderMed` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.11)` | Medium borders |
| `T.hover` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.04)` | Hover bg |
| `T.accent` | `#E04D27` | `#C84520` | Accent color |
| `T.isDark` | `true` | `false` | Theme boolean |

Toggle: `window.toggleTheme()` — triggers pixel-crawl animation, fires `zw-theme-changed` event.

---

## Component Patterns

### Theme-aware status badge colors
```js
function getStatusColors(isDark) {
  return isDark ? {
    active: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
    // ...
  } : {
    active: { bg: '#D1F4E8', text: '#034636' },
    // ...
  };
}
const STATUS_COLORS = getStatusColors(T.isDark);
```
**Never hardcode hex status colors.** Always use a theme-aware function. `getStudentStatusColors` is exported as `window.getStudentStatusColors` from `05-students/student-profile.jsx`.

### Drag-and-drop components
Any component using HTML5 drag-and-drop **must be defined at module scope**, not inside a parent component. If defined inside, React unmounts/remounts DOM nodes on every render and kills the drag mid-flight.

Use `dataTransfer.setData/getData` for ID handoff. Direct DOM manipulation for visual feedback to avoid re-renders during drag.

### Window globals pattern
External `.jsx` files expose components globally. Always check before use:
```js
window.FamiliesView ? React.createElement(window.FamiliesView, props) : <ComingSoon />
```

---

## Leads Pipeline

- Pipeline stages (in order): `new` → `contacted` → `qualified` → `trial_scheduled` → `trial_complete`
- Exit events (not stages): `enrolled` (creates Student record), `lost` (archived with reason)
- Board only shows open leads. Closed accessible via "Show Closed" toggle.
- `daysInStage` is always server-computed from `stage_entered_at`.
- Stale indicator: amber dot on cards with `daysInStage >= 5`.

---

## Key Design Decisions

### Light theme text contrast
All gray text was darkened for WCAG AA compliance:
- `t3: #717170` — 4.8:1 contrast (was `#ABABAB` at 2.3:1 — failing)
- `t4: #8C8C8A` — 3.2:1 contrast (was `#C4C4C4`)

### FamiliesView — 04-families/families.jsx
Active `FamiliesView` lives at `04-families/families.jsx`. Edit that file only.

### `getBadgeColors` shared function
Defined inline in `index.html`. Used by the inline family detail billing tab. Do not redefine locally.

### `getStudentStatusColors` shared function
Exported from `05-students/student-profile.jsx` as `window.getStudentStatusColors`. Used by `04-families/family-roster.jsx`. Do not redefine locally.
