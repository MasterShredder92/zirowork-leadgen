# ZiroWork Lead-Gen — North Star

Purpose: this is an ideology + migration-direction document, not a task list. An agent reviewing this repo should read this to understand *what ZiroWork lead-gen is becoming and why*, then judge any proposed work against it. It names the engine the whole AI-appointment-setter category runs on, how each part works, why they do it, and whether ZiroWork should adopt or trash it — all constrained to the existing stack.

Stack constraint (hard): everything below must live in React + Node + Tailwind + ESLint + Supabase (Postgres, edge functions, pg_cron, Realtime) + Twilio + an LLM API + plain REST calls. Nothing here requires GoHighLevel, a voice vendor, or a new runtime.

---

## The vision in one paragraph

A service business sends its leads to a ZiroWork funnel. ZiroWork contacts every lead in seconds, qualifies and closes them by text in the business's own voice, books them against the business's real schedule, and hands back a finished customer. The business buys booked customers, not software. ZiroWork is the engine; the business never logs in.

This is the same engine every serious tool in the category runs — Setter AI, Appointwise, Thoughtly, Retell, and the rest. The only meaningful fork is channel: ZiroWork is **text-first** (the Setter AI / Appointwise model), not voice-first (the Retell / Synthflow / Vapi model). That fork is deliberate and is covered below.

---

## MAP — the engine

Five stages, one spine, one floor.

| Layer | Role | ZiroWork verdict |
|---|---|---|
| **Spine: lead state machine** | A status that advances; every transition is a trigger | ADOPT — the thing that makes it an engine, not a CRM |
| Intake | Inbound lead → row, state `new` | HAVE |
| Contact | State `new` fires sub-5-minute first text | HAVE |
| Qualify & Close | Reply → score/intent → state `qualified` | HAVE (partial) |
| Book | `qualified` → conversational offer→parse→write→confirm | BUILD — core gap |
| **Floor: availability service** | Answers "what's open?" and "book this" | BUILD — the floor under Book |
| Hand off | `booked` → package + deliver + confirm receipt | HAVE (finish it) |
| Reactivation / reminders | Idle or no-show → re-engage | ADOPT — cheap once the spine exists |

The whole document hangs off one idea: **the agent only ever asks two questions of any business — what's open, and book this. Everything behind those is swappable.**

---

## The non-negotiable principles (the ideology)

1. **Result, not software.** ZiroWork sells booked customers. The CRM is internal ops. If a feature doesn't help close/book/hand-off a customer or prove ROI, it's out of scope. (See `94-knowledge/northstar.md`.)
2. **Text-first, voice later.** ~99% of sign-ups already happen by text. Text is editable, versionable, and A/B-testable in a way voice is not. Voice is a future channel, never a prerequisite. The category's text-first players (Setter AI, Appointwise) are the proof this works and the model to study.
3. **Federate the schedule; don't own a scheduling engine.** The business's own calendar is the source of truth. ZiroWork reads availability and writes bookings — it does not try to be the calendar. This is how the whole category does it (native Google/Outlook/Calendly integrations, API fallback).
4. **Own-the-schedule is the default floor, not a failure mode.** For any business with no real system — a spreadsheet, a notebook, or your own pilot schools — ZiroWork holds the availability rules captured at onboarding. This means you launch with zero connectors built.
5. **Connectors are upgrades, not prerequisites.** A given business is upgraded from "we hold it" to "we sync your Google" only when they demand it. Never block launch on a connector.
6. **The agent speaks the business's voice, and only the business's voice.** Per-business script + knowledge, grounded. The agent never invents offers, prices, or promises. Tone is config, not model behavior.
7. **Build only the moat.** The moat is the funnel + the closing conversation + the packaged hand-off. Borrow patterns for everything else; rebuild nothing that already exists as a plain API.
8. **Do not rebuild GoHighLevel.** GHL (and Cal.com, and Calendly) already commoditized scheduling and CRM plumbing. The edge is the service, the voice, and the close — not the plumbing.

---

## Engine tools & frameworks — how they work, why, and the verdict

Each row: the pattern the category uses, why they use it, and whether ZiroWork should adopt, consider, or trash it.

| Pattern | How it works | Why they do it | ZiroWork verdict |
|---|---|---|---|
| **Speed-to-lead** | First contact within minutes of a lead arriving | Sub-5-minute response is the single biggest driver of booking rate (category cites 15–52% lead-to-booking on fast contact) | ADOPT — already have it (`on-new-lead` + cron) |
| **Lead state machine / pipeline triggers** | Lead carries a status; each transition fires the next action | Turns scattered scripts into one predictable system; everything else plugs into it | ADOPT — build the spine first; it's a status column + transition handlers |
| **Conversational booking (no links)** | Agent offers 2–3 concrete times in-thread, parses the reply, books inside the conversation | Booking links leak conversions; in-thread booking keeps the close in one motion | ADOPT — this is the differentiator and the core gap |
| **Real-time availability + conflict avoidance** | Check open slots live, offer alternates, prevent double-booking across staff/services | A booking that collides with reality destroys trust instantly | ADOPT — the availability service |
| **Capability tiers / graceful degradation** | Engine works whether the business has a full calendar API, a read-only feed, or nothing | Lets one engine serve every business regardless of their tooling | ADOPT — Tier-C ("we hold it") is the launch default |
| **Multi-touch follow-up until reply/book** | Timed nudges across days until the lead acts | Most leads don't reply on touch one; cadence is where the bookings hide | ADOPT — have `send-followup`; wire to the spine |
| **Database reactivation ("dead-lead reviver")** | Outbound re-engagement of stale leads | Free pipeline from leads already paid for; Atlas sells this hard | ADOPT — nearly free once the spine exists |
| **Reminders + no-show recovery/backfill** | Pre-appointment reminders; auto-rebook or offer the slot to the next lead on a no-show | No-shows are the silent revenue leak; reminders cut them sharply | ADOPT — pg_cron jobs on booking state |
| **CRM write-back with full context + tags** | Every outcome logged, tagged, routed; workflows triggered | The system needs memory and the operator needs visibility | ADOPT — internal CRM is yours; keep it |
| **Per-business "voice clone" via script + knowledge** | Onboarding fills a script library and a knowledge base the agent is grounded in | Makes the agent sound like the business, not a bot; prevents hallucinated offers | ADOPT — text makes this a config file, not a model problem |
| **Human escalation with context** | Hard/edge cases handed to a person with the full thread | Protects trust on the conversations AI shouldn't own | ADOPT — have `escalations` |
| **Observability: funnels, transcripts, A/B on flows** | Dashboards of drop-off, success rate, prompt experiments | You can't tune a close you can't see | CONSIDER — worth it once booking volume justifies it |
| **Compliance layer** | Registered sender, opt-out handling, send-time windows | Legal floor for automated texting; ignoring it kills the sender | MANDATORY — see Guardrails |
| **Voice-first conversation** | Agent talks on the phone, books live | Some verticals expect a call (insurance, healthcare) | TRASH for now — revisit as a later channel, never the foundation |
| **All-in-one platform dependency (GHL et al.)** | One vendor owns CRM + calendar + messaging + AI | Fast to start, no engineering | TRASH — you've already built your own; this is the thing you replace |

---

## The connector landscape (the floor, made concrete)

The availability service exposes one interface — `getAvailability(window)`, `createBooking(slot, customer)`, `capabilities` — and adapters sit behind it. Each adapter is a plain REST integration callable from Node. None requires adopting a platform.

| Provider | Read open slots | Write booking | Tier | Priority | Note |
|---|---|---|---|---|---|
| ZiroWork-held (no system) | n/a (we own it) | n/a (we own it) | C | Launch | Covers your pilot schools and any spreadsheet business |
| Google Calendar | yes | yes | A | First adapter | Biggest install base, clean OAuth |
| Microsoft / Outlook (Graph) | yes | yes | A | Early | Same shape as Google |
| Cal.com | yes | yes | A | Early | Open API; could also be embedded if you ever want a hosted calendar — but do not let this become "rebuild the scheduler" |
| Calendly | partial | partial | A−/B | Mid | Owns its own booking UX; integrate around it |
| Square Bookings | yes | yes | A | Mid | Only if the business runs Square Appointments; you already touch Square for billing |
| Field-service CRMs (Jobber, Housecall, ServiceTitan) | per-API | per-API | A/B | On demand | Build only when a paying client needs it |
| Apple / iCloud | CalDAV only | CalDAV only | B | Defer | No clean API; route them to Google if possible |
| Spreadsheet / Sheets / CSV | import only | n/a | C | Fallback | Treat as Tier-C with an import step |

Rule: every business starts at Tier C the day they sign. A connector is an upgrade.

---

## Guardrails (mandatory layer, not optional)

These are the floor for automated texting on Twilio. Treat as engine, not afterthought.

- **Registered sender** — A2P 10DLC registration for US application-to-person SMS.
- **Opt-out** — honor STOP/UNSUBSCRIBE automatically; never text an opted-out number again.
- **Send-time windows** — only text inside the business's quiet-hours window and the lead's timezone. (Already modeled in `agent_tenants` config.)
- **Frequency cap** — max follow-ups per lead. (Already modeled: `max_followups`.)
- **Grounding** — the agent answers only from the business's script/knowledge; it never invents offers, prices, or availability.
- **Booking integrity** — offer slots optimistically, write authoritatively: re-check the slot is free at write time; clarify ambiguous replies instead of guessing; confirm with explicit date/time/timezone.
- **Idempotent hand-off** — fire the packaged customer exactly once; verify receipt.

---

## Where ZiroWork is today (start line)

- Intake: landing pages + `on-new-lead` webhook — solid.
- Contact: Twilio SMS live; `process-pending` cron; per-business send windows — solid.
- Qualify: `on-reply`, `score-and-send`, `send-followup`, `escalations` — present; missing the explicit "ready-to-book" transition.
- Book: a bookings table marked **by hand** — the conversational loop and the availability service are net-new.
- Hand off: `enrollment-handoff` + enrollments concept — exists; actual delivery + receipt unverified.
- Schedule/connectors: nothing — integrations view only derives OpenPhone/Square-billing/webhook.
- State machine: implied across per-table statuses; no single spine.
- Voice/onboarding: `scrape`, `intake-form`, `complete-onboarding` scaffolding — present; not yet a script library + schedule capture.

Read against the engine: Intake, Contact, and Reporting are built. The middle (Book) and the floor (availability) are the work. The spine threads them.

---

## Migration direction (order of concerns, not steps)

Stated as *what should exist before what, and why* — an agent turns this into tasks, this doc does not.

1. **The state machine comes first.** Until the lead has one advancing status with transition handlers, every other improvement is a patch on scattered logic. It's the cheapest high-leverage thing and it unlocks reactivation and reminders for free.
2. **The availability service comes before the booking loop.** The loop is meaningless without something to answer "what's open?". Build it Tier-C only first — no connector — so it runs on your own schools immediately.
3. **The booking loop closes the core.** Offer→parse→write→confirm against the availability service. This is the moment ZiroWork stops being a CRM and becomes the engine.
4. **Hand-off gets finished and verified.** A booked customer that doesn't reliably reach the business is a broken promise. Confirm delivery + receipt.
5. **Connectors come one at a time, on demand.** Google first, then Outlook/Cal.com, then the rest — each only when a real business needs its own calendar synced.
6. **Reactivation, reminders, observability are the compounding layer.** They sit on the spine and multiply the value of everything above; sequence them after the core close works.

Generalization (school → generic service business) is a config concern, not a rewrite: the engine is already vertical-agnostic; the vocabulary and scripts are the per-business config. Do not let generalization turn into a platform-framework build before a second vertical actually exists.

---

## References to view

### Closest analogs — study these (text-first; the model)
- Setter AI — text/WhatsApp form-lead follow-up, conversational booking into Calendly: https://www.trysetter.com/
- Appointwise — conversational booking, "no booking links," multi-channel: https://www.appointwise.io/
- SetSmart — GPT-level qualification conversations, in-chat booking: https://setsmart.io/blog/best-ai-setters
- Thoughtly — full appointment-setting workflow breakdown (qualify→schedule→remind→write-back): https://thoughtly.com/blog/best-ai-appointment-setting-agents
- Category overview / how the engine works: https://www.aiautomationspot.com/post/ai-appointment-setter

### Voice-first — note, do not adopt now (revisit if/when voice becomes a channel)
- Retell: https://www.retellai.com/ai-appointment-setter
- ElevenLabs Agents: https://elevenlabs.io/agents/ai-appointment-setter
- Synthflow: https://synthflow.ai/ai-appointment-setter
- Lindy: https://www.lindy.ai/tools/ai-appointment-setter

### The done-for-you wrapper this whole effort is benchmarked against
- Atlas: https://youratlas.com/  (model: done-for-you agency on a GHL + voice stack — study the offer, not the stack)

### Connector / scheduling APIs (adapter targets — verify current docs before building)
- Google Calendar API: https://developers.google.com/calendar
- Microsoft Graph (calendars): https://learn.microsoft.com/graph/api/resources/calendar
- Calendly API: https://developer.calendly.com/
- Cal.com docs: https://cal.com/docs
- Square Bookings API: https://developer.squareup.com/docs/bookings-api/what-it-does

### Compliance (mandatory layer — verify current rules)
- Twilio A2P 10DLC: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
- Twilio messaging compliance / opt-out: https://www.twilio.com/docs/messaging/compliance

### Internal repo docs (connect ideology to the existing code)
- `94-knowledge/northstar.md` — domain model, invariants, result-not-software frame, doctrine
- `99-agents/supabase/functions/` — `on-new-lead`, `on-reply`, `send-followup`, `process-pending`, `enrollment-handoff`, `intake-form`, `complete-onboarding`
- `13-integrations/` and `08-bookings/` — current (honest) integration + booking surfaces

---

## How to use this file

Point the reviewing agent here before it proposes work on `zirowork-leadgen`. Any proposal should answer: does it serve a result (booked customer)? does it stay text-first? does it federate the schedule rather than rebuild one? does it keep connectors as upgrades? does it fit the existing stack? If not, it's off the North Star.
