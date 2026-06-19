# spa-boundaries.md — Phase 0: SPA Surface Boundaries

Source: markup greps of the 3 `index.html` files + `cat vercel.json`. All script `src` values are verbatim from the HTML.

---

## 1. Operator CRM — `index.html` (served at `/`)

**CDN deps (loaded first, lines 15–23):**
```
https://unpkg.com/react@18.3.1/umd/react.development.js
https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js
https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.1/dist/umd/supabase.min.js
https://unpkg.com/vis-network@10.1.0/standalone/umd/vis-network.min.js
```

**Inline script (lines 124–129):** initializes `window.sb = supabase.createClient(...)` using env-baked URL + anon key.

**Local scripts — SPINE (loaded before views):**
```
index.html:19   92-design/theme.js
index.html:20   92-design/design-tokens.js
index.html:21   92-design/icons.jsx
index.html:132  93-hooks/use-local-data.js
index.html:133  93-hooks/use-studio-context.js
index.html:134  93-hooks/use-supabase-table.js
index.html:135  93-hooks/use-is-mobile.js
index.html:136  93-hooks/use-pages.js
index.html:139  92-design/design-tweaks.jsx
index.html:142  90-shell/sidebar.jsx
index.html:143  90-shell/workspace-overlay.jsx
index.html:144  90-shell/user-menu.jsx
```

**Local scripts — VIEWS (leaves):**
```
index.html:147  00-command-center/command-center.jsx
index.html:150  01-clients/clients.jsx
index.html:153  02-onboarding/onboard-form.jsx
index.html:154  02-onboarding/onboarding.jsx
index.html:157  03-campaigns/campaigns.jsx
index.html:160  04-pages/pages.jsx
index.html:163  05-leads/leads.jsx
index.html:166  06-conversations/conversations.jsx
index.html:169  07-escalations/escalations.jsx
index.html:172  08-bookings/bookings.jsx
index.html:175  09-enrollments/enrollments.jsx
index.html:178  10-reporting/reporting.jsx
index.html:181  11-automation-rules/automation-rules.jsx
index.html:183  13-integrations/integrations.jsx
index.html:186  14-settings/settings.jsx
index.html:189  15-insights/insights.jsx
index.html:192  16-studio-map/studio-map.jsx
```

**Local scripts — SHELL/AUTH (loaded last — depend on all views):**
```
index.html:196  90-shell/Header.jsx
index.html:197  90-shell/Router.jsx
index.html:198  91-auth/operator-login.jsx
index.html:199  91-auth/Session.jsx
```

**Total local scripts: 29** (3 spine non-babel, 9 spine babel, 17 view babel, 4 shell/auth babel)

---

## 2. Schools — `schools/index.html` (rewritten from `/schools/:path*`)

**CDN deps (same React/Babel/Supabase versions as operator — no vis-network):**
```
https://unpkg.com/react@18.3.1/umd/react.development.js
https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js
https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.1/dist/umd/supabase.min.js
```

**No inline Supabase init found.** Schools loads the Supabase CDN but does not define `window.sb` inline — initialization may happen inside `schools/app.jsx` or not at all (schools app.jsx calls logPageEvent via its own Supabase client).

**Local scripts — WIDGETS (loaded first, deps for pages):**
```
schools/index.html:40  /schools/widgets/piano-widget.jsx
schools/index.html:41  /schools/widgets/guitar-widget.jsx
schools/index.html:42  /schools/widgets/vocals-widget.jsx
schools/index.html:43  /schools/widgets/drums-widget.jsx
```

**Local scripts — PAGES:**
```
schools/index.html:46  /schools/pages/not-found.jsx
schools/index.html:47  /schools/pages/piano.jsx
schools/index.html:48  /schools/pages/guitar.jsx
schools/index.html:49  /schools/pages/vocals.jsx
schools/index.html:50  /schools/pages/drums.jsx
schools/index.html:51  /schools/pages/signup.jsx
schools/index.html:52  /schools/pages/thank-you.jsx
schools/index.html:53  /schools/pages/confirm.jsx
```

**Local scripts — APP (router/shell, loaded last):**
```
schools/index.html:56  /schools/app.jsx
```

**Total local scripts: 13** (4 widgets, 8 pages, 1 app)

---

## 3. Dashboard (Client Portal) — `dashboard/index.html` (rewritten from `/dashboard` and `/dashboard/:path*`)

**CDN deps (same React/Babel/Supabase versions — no vis-network):**
```
https://unpkg.com/react@18.3.1/umd/react.development.js
https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js
https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.1/dist/umd/supabase.min.js
```

**Inline script (line 20):** `window.sb = supabase.createClient(...)` — dashboard has its own Supabase init, separate from operator's.

**Local scripts — VIEWS:**
```
dashboard/index.html:111  /dashboard/views/login.jsx
dashboard/index.html:112  /dashboard/views/overview.jsx
dashboard/index.html:113  /dashboard/views/pipeline.jsx
dashboard/index.html:114  /dashboard/views/upload.jsx
dashboard/index.html:115  /dashboard/views/my-business.jsx
dashboard/index.html:116  /dashboard/views/billing.jsx
```

**Local scripts — APP:**
```
dashboard/index.html:117  /dashboard/app.jsx
```

**Total local scripts: 7** (6 views, 1 app)

---

## 4. Shared vs Unique

### CDN (shared across ALL surfaces — same versions)
| CDN | Operator | Schools | Dashboard |
|-----|----------|---------|-----------|
| React 18.3.1 | ✓ | ✓ | ✓ |
| ReactDOM 18.3.1 | ✓ | ✓ | ✓ |
| Babel Standalone 7.29.0 | ✓ | ✓ | ✓ |
| Supabase JS 2.108.1 | ✓ | ✓ | ✓ |
| vis-network 10.1.0 | ✓ | ✗ | ✗ |

Same versions across all 3 surfaces = strong route-group / monorepo signal.

### Local modules — ZERO shared files across surfaces
No local JS/JSX file is loaded by more than one surface.

| Module | Operator | Schools | Dashboard |
|--------|----------|---------|-----------|
| `92-design/theme.js` | ✓ | ✗ | ✗ |
| `92-design/design-tokens.js` | ✓ | ✗ | ✗ |
| `92-design/icons.jsx` | ✓ | ✗ | ✗ |
| `93-hooks/use-local-data.js` | ✓ | ✗ | ✗ |
| `93-hooks/use-studio-context.js` | ✓ | ✗ | ✗ |
| All operator views (`0x-*`) | ✓ | ✗ | ✗ |
| All schools files (`schools/`) | ✗ | ✓ | ✗ |
| All dashboard files (`dashboard/`) | ✗ | ✗ | ✓ |

**Each surface is a fully private island.** No shared JS modules exist at runtime across surfaces. The T theme system, data hooks, and icon set are operator-only.

### `window.sb` — defined independently per surface
- Operator: `index.html` inline script (line 125) → operator Supabase client
- Dashboard: `dashboard/index.html` inline script (line 20) → same Supabase project, separate client instance
- Schools: CDN loaded, no inline init visible — verify in `schools/app.jsx`

---

## 5. Routing Table (verbatim from `vercel.json`)

**Redirects** (host-based, for zirowork.com domain):
```
/  (host=zirowork.com)      → /home
/  (host=www.zirowork.com)  → /home
```

**Rewrites:**
```
/home                       → /www/index.html
/privacy                    → /legal/privacy-policy.html
/privacy-policy             → /legal/privacy-policy.html
/terms                      → /legal/terms.html
/terms-of-service           → /legal/terms.html
/onboarding                 → /onboard.html
/schools/:path*             → /schools/index.html
/dashboard                  → /dashboard/index.html
/dashboard/:path*           → /dashboard/index.html
/((?!schools|dashboard|onboarding|home|privacy|terms|legal|www|96-public|99-agents).*) → /index.html
```

The catch-all regex carves out 8 path prefixes before falling through to the operator SPA.

---

## 6. Routing Fact (for Phase 4)

`/schools` and `/dashboard` each rewrite to their own `index.html`. Combined with the zero shared-local-modules finding, these surfaces are already hard-separated at the routing AND module levels. The current architecture maps cleanly to either:
- **3 separate Next.js apps** (maximum isolation, matches current boundaries)
- **1 Next.js app with 3 route groups** (shared CDN deps + same Supabase project are the commonality)

This is a Phase 4 architectural decision, not a Phase 0 conclusion.
