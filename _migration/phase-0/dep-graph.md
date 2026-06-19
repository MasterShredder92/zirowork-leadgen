# dep-graph.md — Phase 0: Global Dependency Graph

Source: `grep -rnE 'window\.[A-Za-z0-9_]+ *= ' --include=*.jsx --include=*.js .` + `Object.assign(window,…)` patterns confirmed by file reads. Load order from markup greps of the 3 `index.html` files.

---

## 1. Define List — All `window.*` Globals

### Operator CRM surface (loaded by root `index.html`)

| Global | Defining File | Load Line |
|--------|--------------|-----------|
| `T` | `92-design/theme.js` | 19 |
| `THEME_DARK` | `92-design/theme.js` | 19 |
| `toggleTheme` | `92-design/theme.js` | 19 |
| `TOKENS` | `92-design/design-tokens.js` | 20 |
| `LucideReact` | `92-design/icons.jsx` | 21 |
| `SEED_DATA` | `93-hooks/use-local-data.js` | 132 |
| `useClients` | `93-hooks/use-local-data.js` | 132 |
| `useCampaigns` | `93-hooks/use-local-data.js` | 132 |
| `useLeads` | `93-hooks/use-local-data.js` | 132 |
| `useConversations` | `93-hooks/use-local-data.js` | 132 |
| `useEscalations` | `93-hooks/use-local-data.js` | 132 |
| `useBookings` | `93-hooks/use-local-data.js` | 132 |
| `useEnrollments` | `93-hooks/use-local-data.js` | 132 |
| `useOperatorTasks` | `93-hooks/use-local-data.js` | 132 |
| `useClientReports` | `93-hooks/use-local-data.js` | 132 |
| `useAutomationRules` | `93-hooks/use-local-data.js` | 132 |
| `useIntegrations` | `93-hooks/use-local-data.js` | 132 |
| `useAgentTenants` | `93-hooks/use-local-data.js` | 132 |
| `deriveIntegrations` | `93-hooks/use-local-data.js` | 132 |
| `useRollups` | `93-hooks/use-local-data.js` | 132 |
| `deriveRollups` | `93-hooks/use-local-data.js` | 132 |
| `EMPTY_CLIENT_ROLLUP` | `93-hooks/use-local-data.js` | 132 |
| `EMPTY_CAMPAIGN_ROLLUP` | `93-hooks/use-local-data.js` | 132 |
| `usePageFunnel` | `93-hooks/use-local-data.js` | 132 |
| `derivePageFunnel` | `93-hooks/use-local-data.js` | 132 |
| `useOperatorContext` | `93-hooks/use-studio-context.js` | 133 |
| `useStudioContext` | `93-hooks/use-studio-context.js` | 133 |
| `useSupabaseTable` | `93-hooks/use-supabase-table.js` | 134 |
| `useIsMobile` | `93-hooks/use-is-mobile.js` | 135 |
| `usePages` | `93-hooks/use-pages.js` | 136 |
| `UserMenu` | `90-shell/user-menu.jsx` | 144 |
| `WorkspaceOverlay` | `90-shell/workspace-overlay.jsx` | 143 |
| `CommandCenterView` | `00-command-center/command-center.jsx` | 147 |
| `ClientsView` | `01-clients/clients.jsx` | 150 |
| `OnboardForm` | `02-onboarding/onboard-form.jsx` | 153 |
| `ClientOnboardingView` | `02-onboarding/onboarding.jsx` | 154 |
| `CampaignsView` | `03-campaigns/campaigns.jsx` | 157 |
| `PagesView` | `04-pages/pages.jsx` | 160 |
| `LeadsView` | `05-leads/leads.jsx` | 163 |
| `ConversationsView` | `06-conversations/conversations.jsx` | 166 |
| `EscalationsView` | `07-escalations/escalations.jsx` | 169 |
| `BookingsView` | `08-bookings/bookings.jsx` | 172 |
| `EnrollmentsView` | `09-enrollments/enrollments.jsx` | 175 |
| `ReportingView` | `10-reporting/reporting.jsx` | 178 |
| `AutomationRulesView` | `11-automation-rules/automation-rules.jsx` | 181 |
| `IntegrationsView` | `13-integrations/integrations.jsx` | 183 |
| `SettingsView` | `14-settings/settings.jsx` | 186 |
| `InsightsView` | `15-insights/insights.jsx` | 189 |
| `StudioMapView` | `16-studio-map/studio-map.jsx` | 192 |
| `MobileHeader` | `90-shell/Header.jsx` | 196 |
| `ComingSoon` | `90-shell/Header.jsx` | 196 |
| `App` | `90-shell/Router.jsx` | 197 |
| `OperatorLogin` | `91-auth/operator-login.jsx` | 198 |
| `currentUser` | `91-auth/Session.jsx` | 199 |
| `currentOperator` | `91-auth/Session.jsx` | 199 |
| `Root` | `91-auth/Session.jsx` | 199 |
| `sb` | `index.html` inline (line 125) | 124-129 |

### Schools surface (loaded by `schools/index.html`)
These globals have NO overlap with operator globals. Schools loads its own React/Babel/Supabase CDN; it does NOT load theme.js, design-tokens.js, icons.jsx, or any 9x-hooks.

| Global | Defining File |
|--------|--------------|
| `DrumsWidget` | `schools/widgets/drums-widget.jsx` |
| `GuitarWidget` | `schools/widgets/guitar-widget.jsx` |
| `PianoWidget` | `schools/widgets/piano-widget.jsx` |
| `VocalsWidget` | `schools/widgets/vocals-widget.jsx` |
| `NotFoundPage` | `schools/pages/not-found.jsx` |
| `PianoPage` | `schools/pages/piano.jsx` |
| `GuitarPage` | `schools/pages/guitar.jsx` |
| `VocalsPage` | `schools/pages/vocals.jsx` |
| `DrumsPage` | `schools/pages/drums.jsx` |
| `SignupPage` | `schools/pages/signup.jsx` |
| `ThankYouPage` | `schools/pages/thank-you.jsx` |
| `ConfirmPage` | `schools/pages/confirm.jsx` |
| `LandingLayout` | `schools/app.jsx` |

### Dashboard surface (loaded by `dashboard/index.html`)
Also isolated. Defines its own `window.sb` inline. Does NOT load operator globals.

| Global | Defining File |
|--------|--------------|
| `PortalLogin` | `dashboard/views/login.jsx` |
| `PortalOverview` | `dashboard/views/overview.jsx` |
| `PortalPipeline` | `dashboard/views/pipeline.jsx` |
| `PortalUpload` | `dashboard/views/upload.jsx` |
| `PortalMyBusiness` | `dashboard/views/my-business.jsx` |
| `PortalBilling` | `dashboard/views/billing.jsx` |
| `sb` _(dashboard-scoped)_ | `dashboard/index.html` inline (line 20) |

### ⚠️ DEAD-CODE CANDIDATES — defined but loaded by NO surface

These files export `window.*` globals but appear in NO `index.html` script block:

| Global(s) | Defining File | Note |
|-----------|--------------|------|
| `useLessons` | `93-hooks/use-lessons.js` | Not in any index.html |
| `useStudents` | `93-hooks/use-students.js` | Not in any index.html |
| `LoginView` | `91-auth/Login.jsx` | Not loaded anywhere |
| `OnboardingView` | `91-auth/onboarding.jsx` | Not loaded anywhere |
| `SignupView` | `91-auth/Signup.jsx` | Not loaded anywhere |
| `authInput`, `authLabel`, `authBtn`, `AuthWrap`, `AuthError` | `91-auth/SharedComponents.jsx` | Not in any index.html |
| `currentStudio` | `91-auth/Signup.jsx` | Not loaded |

**Architect must confirm** whether these are intentionally removed or are referenced by some path not in the 3 index.html files before Phase 1.

---

## 2. Consume Edges (Operator Surface Only)

Source: `grep -rl "window\.T\b"`, `grep -rl "LucideReact"`, targeted searches for key hooks.

### `T` (theme tokens) — 21 consumers
Consumed by every operator view + shell components. This is the broadest-consumed global.
```
00-command-center/command-center.jsx
01-clients/clients.jsx
02-onboarding/onboard-form.jsx
02-onboarding/onboarding.jsx
03-campaigns/campaigns.jsx
04-pages/pages.jsx
05-leads/leads.jsx
06-conversations/conversations.jsx
07-escalations/escalations.jsx
08-bookings/bookings.jsx
09-enrollments/enrollments.jsx
10-reporting/reporting.jsx
11-automation-rules/automation-rules.jsx
13-integrations/integrations.jsx
14-settings/settings.jsx
15-insights/insights.jsx
90-shell/Header.jsx
90-shell/sidebar.jsx
92-design/design-tokens.js   ← cross-spine dep: design-tokens reads window.T
16-studio-map/studio-map.jsx (via window.T indirect)
```
Note: `design-tokens.js` reads `window.T` at line 9 → it must load AFTER `theme.js`. Load order (19→20) already guarantees this.

### `LucideReact` — 15 consumers
```
00-command-center/command-center.jsx
01-clients/clients.jsx
02-onboarding/onboard-form.jsx
02-onboarding/onboarding.jsx
03-campaigns/campaigns.jsx
04-pages/pages.jsx
05-leads/leads.jsx
06-conversations/conversations.jsx
10-reporting/reporting.jsx
11-automation-rules/automation-rules.jsx
15-insights/insights.jsx
90-shell/Header.jsx
90-shell/sidebar.jsx
91-auth/onboarding.jsx       ← dead-code file but grepped as consumer
91-auth/Signup.jsx           ← dead-code file but grepped as consumer
```

### `useRollups` — 3 confirmed consumers
Source: `grep -rn "window\.useRollups"` returns:
```
00-command-center/command-center.jsx:9   (conditional: window.useRollups ? window.useRollups().byClient : {})
01-clients/clients.jsx:471              (conditional: window.useRollups ? window.useRollups().byClient : {})
16-studio-map/studio-map.jsx:211        (conditional: window.useRollups ? window.useRollups() : {...})
```

### `usePageFunnel` — 1 consumer
```
03-campaigns/campaigns.jsx:130  (conditional: window.usePageFunnel ? window.usePageFunnel(sinceMs) : [])
```

### `TOKENS` — 1 consumer
```
90-shell/sidebar.jsx:102   TOKENS.radius.xl
90-shell/sidebar.jsx:122   TOKENS.radius.lg
```

### `ComingSoon` — 1 consumer (but critical)
```
90-shell/Router.jsx  (fallback for all 16 view routes when view is undefined)
```

### `window.sb` (Supabase client)
Defined **inline** in `index.html` (line 125) and `dashboard/index.html` (line 20). Schools does NOT define window.sb inline (its app.jsx may initialize independently). Consumed by many operator views (clients, onboard-form, command-center, etc.).

### View globals — all consumed ONLY by `90-shell/Router.jsx`
Source: `Router.jsx` renderMain() switch. Every `*View` global is referenced only there, with `ComingSoon` as fallback. No view references another view.

---

## 3. Spine vs Leaf Classification

### SPINE — load these first in any migration

| Global | Definer | Consumer Count | Why Spine |
|--------|---------|---------------|-----------|
| `T` | `92-design/theme.js` | 21 | Every view depends on it |
| `LucideReact` | `92-design/icons.jsx` | 15 | Icons used across all views |
| `TOKENS` | `92-design/design-tokens.js` | 1 (sidebar) | Design scale; loads T first |
| `useRollups`, `usePageFunnel`, all data hooks | `93-hooks/use-local-data.js` | 3–8 | Shared data layer |
| `useOperatorContext`, `useStudioContext` | `93-hooks/use-studio-context.js` | operator-wide | Auth identity |
| `useSupabaseTable` | `93-hooks/use-supabase-table.js` | stub | Imported by views |
| `useIsMobile` | `93-hooks/use-is-mobile.js` | multiple views | Responsive layout |
| `usePages` | `93-hooks/use-pages.js` | multiple views | Page data |
| `ComingSoon` | `90-shell/Header.jsx` | Router.jsx | Fallback for 16 routes |
| `App` | `90-shell/Router.jsx` | Session.jsx | Root component |
| `sb` | inline HTML | many views | DB client |

### LEAVES — migrate per-view; no other view depends on them

All 16 `*View` globals:
`CommandCenterView`, `ClientsView`, `OnboardForm`, `ClientOnboardingView`, `CampaignsView`, `PagesView`, `LeadsView`, `ConversationsView`, `EscalationsView`, `BookingsView`, `EnrollmentsView`, `ReportingView`, `AutomationRulesView`, `IntegrationsView`, `SettingsView`, `InsightsView`, `StudioMapView`

Schools surface leaves (fully isolated):
`LandingLayout`, `PianoPage`, `GuitarPage`, `VocalsPage`, `DrumsPage`, `SignupPage`, `ThankYouPage`, `ConfirmPage`, plus 4 widgets

Dashboard leaves (fully isolated):
`PortalLogin`, `PortalOverview`, `PortalPipeline`, `PortalUpload`, `PortalMyBusiness`, `PortalBilling`

---

## 4. Cycles

**None detected.** The load order is strictly:

```
theme.js → design-tokens.js → icons.jsx
         → use-local-data.js → use-studio-context.js → use-supabase-table.js → use-is-mobile.js → use-pages.js
         → design-tweaks.jsx → sidebar.jsx → workspace-overlay.jsx → user-menu.jsx
         → [views 00–16]
         → Header.jsx → Router.jsx → operator-login.jsx → Session.jsx
```

`design-tokens.js` reads `window.T` but is loaded AFTER `theme.js` — no cycle, dependency satisfied by load order.

No view references another view. Router.jsx references view globals but loads AFTER all views — no cycle.

---

## 5. Leaf-First Migration Order (for Phase 3)

Within operator views, any order works (no inter-view deps). Recommended order: leaf views that touch the most code first, to de-risk early.

1. `StudioMapView` — uses useRollups conditionally; standalone
2. `InsightsView` — small (78 lines)
3. `BookingsView` — small (98 lines)
4. `ReportingView` — medium
5. `SettingsView`
6. `IntegrationsView`
7. `AutomationRulesView`
8. `PagesView`
9. `EscalationsView`
10. `ConversationsView`
11. `EnrollmentsView`
12. `LeadsView`
13. `CampaignsView` — uses usePageFunnel
14. `OnboardForm` + `ClientOnboardingView` — shared with onboard.html
15. `ClientsView` — uses useRollups; large (597 lines)
16. `CommandCenterView` — uses useRollups; 194 lines

Schools and Dashboard views are independent — migrate as separate route-groups or apps (Phase 4 decision).
