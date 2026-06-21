# ZiroWork — North-Path Plan

Goal: customer acquisition for service businesses. They send leads to our funnel → we contact + close by text → we package the new customer and hand it back.

Operating principle (read once, then everything else makes sense):
1. The **engine** is vertical-agnostic and channel = SMS (Twilio, already live). Build once.
2. The **vocabulary + scripts** are per-vertical config. Swap, never rebuild.
3. **Connectors are a roadmap, not a prerequisite.** The engine always works at Tier C ("we hold the schedule"). A connector only upgrades one client from C → B → A. Never block launch on one.
4. Music school = guinea pig vertical. Generic is the endgame. So: isolate the vocab now, generalize later via config — not another find-replace.

Do NOT touch: the CDN→React migration. This plan starts only after that gate passes.

---

## MAP — phases

| # | Phase | Exit gate (mechanical) | Touches migration? |
|---|---|---|---|
| 0 | Migration precondition | `next build` exits 0; zero `text/babel` / CDN `<script>` tags remain | N/A — not ours, just a gate |
| 1 | Excise the 2nd CRM | grep for studio-CRM tables/files in `src/` + active schema → 0 hits; build passes | No (src/ + docs only) |
| 2 | Isolate vertical vocab | grep music-school words in engine files (outside config module) → 0 hits; build passes | No |
| 3 | Connector abstraction + Tier C | one internal `Availability`/`Booking` API exists; test booking round-trips against our own store | No |
| 4 | Close the SMS booking loop | e2e test: lead → SMS → slot offered → reply parsed → booking created → confirm sent → record packaged | No |
| 5 | Connector adapters (1 at a time) | per adapter: live free/busy read matches provider; created booking appears in provider | No |
| 6 | Packaging / handoff | a closed lead produces a packaged handoff in the client's configured channel | No |

Each phase is a gate. Don't start the next until the current gate passes by **behavior**, not "looks done."

---

## Clean old ideology — Keep / Generalize / Delete

"Old ideology" = the music-school vertical specifics + the second CRM. It is **not** the funnel engine. Classify before deleting so you don't gut the engine.

| Verdict | Items | Why |
|---|---|---|
| **KEEP** (engine, agnostic) | `on-new-lead`, `on-reply`, `send-followup`, `process-pending`, `escalations`, `intake-form`, `complete-onboarding`, `billing`, `monthly-report`, Twilio, `dashboard/`, leads/conversations/campaigns/reporting views | This is the funnel. Same for HVAC as for piano. |
| **GENERALIZE** (vocab-bound, engine-shaped) | `bookings` view (`programColor` Piano/Guitar/Voice/Drums, `parent_name`/`student_name`), `enrollments` → "closed customers/handoffs", `schools/` instrument landing pages → service pages, `pageFunnel`, signup pages, `scrape-school` → `scrape-business` | Right shape, wrong words. Becomes config in Phase 2. |
| **DELETE** (2nd CRM + dead schema) | studio-management tables in `schema.sql` + docs (families, students, teachers, lessons, invoices, payroll, financials), `93-hooks/use-students.js`, `use-lessons.js`, superseded `.brain/` items, studio-map if vertical | Separate product. Confirmed out of scope. |

---

## Connector inventory — the providers to plan against

A connector implements one interface (Phase 3). Order = build priority. You do not need any of these to launch (Tier C covers you).

| Provider | Read availability | Write booking | Tier | Priority | Note |
|---|---|---|---|---|---|
| **ZiroWork-held** (no external system) | n/a (we own it) | n/a (we own it) | C | P0 / launch | Onboarding captures availability rules once. Covers your schools + "they use a spreadsheet." |
| **Google Calendar** | yes (free/busy) | yes (events) | A | P1 | Biggest install base, clean OAuth. First real adapter. |
| **Cal.com** | yes | yes | A | P2 | Open API + webhooks. Doubles as an embeddable scheduler you control. |
| **Microsoft / Outlook (Graph)** | yes | yes | A | P2 | Same shape as Google. |
| **Calendly** | yes (limited) | partial | A−/B | P3 | Owns its own booking UX + webhooks; integrate around it, don't fight it. |
| **Square Appointments (Bookings API)** | yes | yes | A | P3 | Only if the business uses Square Appointments. You already touch Square for billing. |
| **Field-service CRMs** (Jobber, Housecall Pro, ServiceTitan, GoHighLevel) | per-API | per-API | A/B | P4 | Per-customer, on demand. Don't pre-build; build when a paying client needs it. |
| **Apple / iCloud Calendar** | CalDAV only | CalDAV only | B | P5 (defer) | No clean public API; app-specific passwords. Painful — do last or route them to Google. |
| **Spreadsheet / Google Sheets / CSV** | import only | n/a | C | P1 fallback | Treat as Tier C with an import step. |

---

## Capability tiers — how the engine degrades gracefully

The engine asks the abstraction the same two questions every time: *what's open?* and *book this.* The tier decides how those are answered.

- **Tier A — full sync.** Read + write, real-time. Agent offers live slots, books directly, writes back to the provider. (Google, Cal.com, Outlook, Square, Calendly.)
- **Tier B — partial / delayed.** Read-only or write-only, or needs a confirm step. Agent offers from the best source available; booking may post to the business for one-tap confirm. (iCloud, some CRMs.)
- **Tier C — no system.** ZiroWork holds the availability rules captured at onboarding. Agent books into our store; the slot is real because we own the calendar of record; handoff is packaged to the business. (Your schools, spreadsheet users.)

Rule: every client starts at Tier C the day they sign. A connector is an **upgrade**, never a gate.

---

## Phase detail

### Phase 0 — Migration precondition (not ours)
- Wait for CDN→React to finish. Do not touch it.
- **Gate:** `next build` exits 0; `grep -r "text/babel" src/` → 0; no CDN `<script src>` React/Babel tags in shipped HTML.
- **Status:** COMPLETE — verify-phase-4.sh exits 0 as of 2026-06-21.

### Phase 1 — Excise the 2nd CRM
1. Delete studio-management tables from `schema.sql` (families, students, teachers, lessons, invoices, payroll, financials) — docs only; dropping live tables is a separate Supabase migration decision.
2. Delete any view/hook that reads only studio-CRM tables (use-students.js, use-lessons.js confirmed dead — never migrated to src/).
3. Purge superseded items from `.brain/`.
- **Gate:** `grep -riE "families|use-students|use-lessons|payroll|financials" src/ 94-knowledge/schema.sql` → 0 hits; `next build` exits 0; app still loads.

### Phase 2 — Isolate vertical vocab (Config layer)
1. Create one module: `src/config/vertical.ts`.
2. Move every vertical string into it: entity labels (student/parent/teacher → lead/contact/provider), service types + colors (`programColor`), "trial lesson", "enrollment", instrument lists.
3. Engine reads labels from the config module. No literals in views/agents/lib.
4. Do **not** build multi-tenant vertical switching yet — one config file is enough for the guinea-pig phase.
- **Gate:** `grep -riE "piano|guitar|drums|instrument|student|parent_name|enrollment|trial lesson" src/` returns hits **only** inside the config module; `next build` exits 0; app works for music schools.

### Phase 3 — Connector abstraction + Tier C
1. Define the interface (one file, e.g. `src/lib/connectors/types.ts`):
   - `getAvailability(window) → Slot[]`
   - `createBooking(slot, customer) → { bookingId, confirmedAt }`
   - `getBookingStatus(bookingId) → Status`
   - `capabilities → { canRead, canWrite, realTime, tier }`
2. Implement **only** the Tier-C provider: availability rules stored in Supabase per client, booking writes to our own `bookings` store.
3. Capture those rules in onboarding (extend `complete-onboarding`/`intake-form`).
- **Gate:** a scripted test calls `getAvailability` then `createBooking` and the booking persists + is retrievable via `getBookingStatus`. Round-trips with zero external connector.

### Phase 4 — Close the SMS booking loop
1. Agent calls `getAvailability`, offers 2 concrete slots in-thread (no "press 1").
2. Parse free-text reply ("Tuesday works") → resolve to a real slot. Treat parse-and-confirm as its own hardened step — this is where SMS booking flows break.
3. `createBooking` → confirm in-thread with explicit date + time → block double-book.
4. Retire the manual booking path (`bookings` stops being hand-marked).
- **Gate:** e2e test passes by behavior: inbound lead → SMS exchange → slot offered → ambiguous reply parsed → booking created → confirmation sent → packaged record exists.

### Phase 5 — Connector adapters (one at a time, each its own gate)
- Build in priority order from the inventory. Each adapter implements the interface + declares its tier.
- Start with **Google Calendar** (P1): OAuth, free/busy read, event write.
- **Gate per adapter:** in a live test account, `getAvailability` matches the provider's actual free/busy, and a `createBooking` event appears in the provider's calendar; capability flags correct. Never merge an adapter that only passes on mocks.

### Phase 6 — Packaging / handoff
1. On close, assemble the customer record: contact, qualification answers, booked slot, source/campaign.
2. Deliver via the client's configured channel: their CRM API, webhook, email, or CSV.
- **Gate:** a closed lead produces a packaged handoff in the configured channel and the business receives it (verified delivery, not "sent").

---

## Guardrails for the whole effort
- One gate at a time. "It runs / e2e passes" counts; "looks done" doesn't.
- Mechanically-checkable rules go in gates (grep / build / tsc / e2e), not prose.
- No multi-tenant vertical framework until a second real vertical exists. One config file now.
- No connector pre-built without a paying client who needs it. Tier C is the default forever.
- Keep a session handoff thread (`_migration/progress.md`) updated at each gate.
