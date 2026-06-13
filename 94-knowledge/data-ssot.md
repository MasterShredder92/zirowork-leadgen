# Data — Single Source of Truth (SSOT)

> Keep this in sync: this file is the contract for how every surface reads and writes data. If you add a page, a count, a write, or a table, you update this file in the **same change**. A stale SSOT doc is a defect.

This is **one dashboard, not ten sections.** Every page reads the same data from the same place and writes to the same place. No page computes a number its own way. No page stores a value only it understands.

---

## The law

1. **One read path per fact.** A given fact (a count, a status, a profile field) has exactly one source table + column. Every page that shows it reads it the same way. If two pages show "leads for this client," they call the **same** function.
2. **Counts are derived, never stored-and-read.** Any number that is "how many X" (leads, trials, enrollments, active campaigns, open escalations, conversion %) is computed from the live source rows at read time — via `window.useRollups()` — **not** read from a denormalized column.
3. **Writes go to the source table, and only the source table.** Changing a lead's stage writes `leads.stage`. It does not also try to keep a count column in sync (there is no count column to keep in sync — see rule 2).
4. **Shared edit surfaces hit the same rows.** The operator side panel and the client portal edit the *same* `clients` row + `agent_tenants.config` row. Neither keeps a private copy.
5. **Realtime everywhere.** All reads go through the `_useTable` hooks in `93-hooks/use-local-data.js`, which subscribe to Postgres changes. An edit on one surface refreshes every other surface automatically.

---

## Why this exists (the bug that created this doc — 2026-06-12)

The Clients page showed **2 leads** for a client while the Leads page (and everywhere else) showed **1**. Root cause: the Clients page rendered `clients.leads_30d` — a **denormalized count column stored on the client row** — while the Leads page counted the real `leads` table. Nothing recomputes `leads_30d` when leads change, so it drifted. The same stale-column pattern existed on Command Center, Studio Map, and Campaigns. The fix: stop reading the stored columns; derive every count from the source tables through one shared helper.

---

## The canonical derivation — `window.useRollups()`

Defined in [`93-hooks/use-local-data.js`](../93-hooks/use-local-data.js). It composes the realtime source hooks and returns:

```
useRollups() → {
  byClient:   { [clientId]:   { leads_30d, trials_30d, enrollments_30d, active_campaigns, open_escalations } },
  byCampaign: { [campaignId]: { leads, trials, enrolled } },
}
```

Definitions (all derived from source tables, never from stored columns):

| Rollup | Source table | Definition |
|---|---|---|
| `byClient.leads_30d` | `leads` | rows where `client_id === c.id` AND `created_at` within trailing 30 days |
| `byClient.trials_30d` | `bookings` → `leads` | bookings within 30d, attributed to the client via `booking.lead_id → lead.client_id` (bookings has **no** `client_id`) |
| `byClient.enrollments_30d` | `enrollments` | rows where `client_id === c.id` AND `outcome === 'enrolled'` AND `created_at` within 30d |
| `byClient.active_campaigns` | `campaigns` | rows where `client_id === c.id` AND `status === 'active'` |
| `byClient.open_escalations` | `ziro_messaging_escalations` | rows where `tenant_id === c.id` AND `resolved_at` is null |
| `byCampaign.leads` | `leads` | rows where `campaign_id === camp.id` (all-time, matches campaign-table semantics) |
| `byCampaign.trials` | `bookings` → `leads` | bookings attributed via `booking.lead_id → lead.campaign_id` |
| `byCampaign.enrolled` | `enrollments` → `leads` | enrolled rows attributed via `enrollment.lead_id → lead.campaign_id` |

**Consumers (must use `useRollups`, never the stored columns):** `00-command-center`, `01-clients`, `16-studio-map`. Reference impl that always did it right: `10-reporting` and `dashboard/views/overview.jsx` / `pipeline.jsx`.

---

## The page funnel — `window.usePageFunnel()`

Also in [`93-hooks/use-local-data.js`](../93-hooks/use-local-data.js). Same SSOT discipline as `useRollups` — counts are **derived**, never stored. One row per **landing page** (`client_pages` row = slug + instrument), returning the full top-of-funnel through enrolled:

```
usePageFunnel() → [ { id, client_name, instrument, status, slug, views, clicks, leads, trials, enrolled }, … ]
```

| Field | Source table | Definition |
|---|---|---|
| `views` | `page_events` | rows where `type === 'view'` for that page's `slug` + `instrument` |
| `clicks` | `page_events` | rows where `type === 'signup_view'` (a visitor reached the signup page from the landing page) |
| `leads` | `leads` | attributed to the page via `lead.page_url` (carries `/schools/{slug}/signup?instrument=…`), parsed by `parseLeadPage()` |
| `trials` | `bookings` → `leads` | bookings whose `lead_id`'s lead attributes to this page |
| `enrolled` | `enrollments` → `leads` | `outcome === 'enrolled'` rows whose `lead_id`'s lead attributes to this page |

**Why leads attribute by `page_url`, not `campaign_id`:** landing-page leads are inserted with **no** `campaign_id` ([`schools/pages/signup.jsx`](../schools/pages/signup.jsx)), so the old `byCampaign` rollup counted zero for them. The page funnel attributes through `page_url` instead, which every landing-page lead does carry.

**Tracking writes** (the only writer of `page_events`): `schools/app.jsx` `logPageEvent()` fires one `view` row when a landing page loads and one `signup_view` row when the signup page loads, deduped per session. Fire-and-forget + try/catch — tracking can never break a landing page. `page_events` is insert-only; nothing reads a stored count off it.

**Consumer:** `03-campaigns` (the per-page funnel table).

### NOT a rollup — do not try to derive these

- **`clients.mrr_cents`** — the client's **contract fee to ZiroWork** (a primary billing value). It is the ROI *denominator* in Reporting (revenue-generated ÷ fee). It legitimately lives on the client row. Read it directly.
- **Profile fields** (`name`, `slug`, `logo_url`, `program_prices`, `instruments`, …) — primary data on `clients`, edited via the portal / operator side panel.
- **`agent_tenants.config`** (jsonb: about, address, hours, colors, testimonials, photos, social, monthly prices) — primary data, edited via the portal / operator side panel.

---

## Identity facts (memorize)

- `clients.id` **===** `agent_tenants.tenant_id` **===** `client_uploads.tenant_id` **===** `ziro_messaging_escalations.tenant_id`. A client's id IS its tenant id.
- `bookings` has **no** `client_id` — attribute through `lead_id → leads.client_id`. Never filter `bookings` by `client_id`.
- Photos → storage bucket `client-assets`. Client files → bucket `client-uploads` + table `client_uploads`.

---

## Pre-ship SSOT checklist (run this before every page add/edit)

- [ ] **Reads:** does this page read through a `93-hooks` hook (realtime), not a one-off fetch that won't refresh?
- [ ] **Counts:** is every "how many X" number from `useRollups()` — NOT a stored `*_30d` / `campaigns.leads` / `open_escalations` column?
- [ ] **Same fact, same source:** does any other page show this same fact? If so, do they read it the *same* way? (If not — make them share.)
- [ ] **Writes:** does every write target the source-of-truth table for that fact, with column names that exist in the schema?
- [ ] **Shared edit surface:** if this edits client data, does it write the same `clients` / `agent_tenants.config` split the portal uses (see `dashboard/views/my-business.jsx`)?
- [ ] **No private state:** is there any value this page stores or computes that another page needs but can't see? If yes — move it to a shared hook / source table.
- [ ] **Docs:** updated this file + the schema/columns if a table or field changed.

---

## Known follow-ups (open SSOT debt — fix when touched, do not let grow)

1. **Vestigial tables / dead hooks.** `conversations` + `escalations` tables (and `useConversations` / `useEscalations`) are unused by the live UI — Conversations and Escalations pages read the `ziro_message_log` / `ziro_messaging_escalations` tables instead. Pick one source per concept and remove the other; until then, **escalations truth = `ziro_messaging_escalations`** (what the Escalations page and `useRollups` use).
2. ~~**`08-bookings` filter.**~~ FIXED 2026-06-12 — removed the unusable `client_id` filter; `bookings.jsx` now reads all bookings. **Still true:** `bookings` has no `client_id`. If a client filter UI is added, attribute via `lead_id → leads.client_id`, never `client_id`.
3. **`02-onboarding` checklist.** The boolean-clobber is FIXED 2026-06-12 — `sms_number` / `lead_form_webhook` are now read-only `derived` items (checked = a real text value exists; clicking no longer writes a boolean). **Still open:** the onboarding-checklist boolean columns (`automation_rules`, `integrations`, `brand_assets`, `protected_slots` on `clients`) share names with the rich `automation_rules` / `integrations` / `assets` TABLES but are **unrelated** — same name, different meaning. Don't confuse them.
4. **`14-settings`.** Pure mock UI; copy still says "no backend / Phase 1" despite live Supabase. Wire to real settings or label as placeholder.
5. **Operator uploads** omit `user_id` on `client_uploads` insert (operator has no client-user id) — harmless, but set it explicitly if operator identity is ever needed.
