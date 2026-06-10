# 99-agents — Context

> Keep this in sync: update whenever the edge functions / backend layout change. Do not alter agent names, voice, or brand speak.

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.
> This is a **separate backend deployment** from the React CRM. Different runtime, different host.

## You are here
Agent backend — **Supabase Edge Functions** (Deno/TypeScript). Handles SMS sending, lead scoring, follow-ups, enrollment handoff, monthly reports, school scraping, and intake forms. No Python server. No n8n. No external scheduler — scheduling is pg_cron on the platform Supabase. SMS goes out via **Twilio** (`_shared/twilio.ts`).

The **conceptual agent roster** below (ziro-admin, ziro-messaging, ziro-leads, etc.) is the **doctrine layer** — the methodology, voice, and behavior contracts each function follows. It lives in `knowledge/`. The agents are NOT separate Python services; they are the playbook the edge functions execute.

## Files in this folder
```
supabase/                — THE LIVE BACKEND (Deno edge functions)
  config.toml            — Supabase project config (declares verify_jwt per function)
  functions/
    _shared/             — shared modules used across functions:
      types.ts           — WebhookPayload, LeadRecord, TenantConfig, ScoringResult
      claude.ts          — callClaude(system, user) → string
      twilio.ts          — sendSMS(to, body), SMS_ENABLED flag (Twilio REST)
      openphone.ts       — legacy OpenPhone sender; not imported by any function (Twilio is the live path).
                           A leftover `openphone_number_id` config field is still read in score-and-send.ts/types.ts
      prompts.ts         — LEADS_SYSTEM_PROMPT + MESSAGING_SYSTEM_PROMPT
      conversation.ts    — loadHistory() for SMS threads
      score-and-send.ts  — scoreAndSend(lead, tenantId): Claude scores → SMS → log → CRM sync
    intake-form/         — serves the hosted lead-capture form (index.ts + legal.ts)
    on-new-lead/         — webhook handler + Eastern-time gate + pending_leads queue
    process-pending/     — cron handler: fetches due pending_leads, calls scoreAndSend
    on-reply/            — inbound SMS handler (Twilio signature validation → reply)
    send-followup/       — drip follow-ups to 'new' leads (capped, opt-out aware)
    enrollment-handoff/  — enrollment confirmation + client-portal handoff
    monthly-report/      — per-tenant monthly report generation
    scrape-school/       — school profile from a pasted URL, 3 layers: Firecrawl fetch (plain-fetch fallback) → JSON-LD + logo/stylesheet color hints → Claude extract (location-aware) → Google Places merge (hours, reviews→testimonials, rating, photos, map link; fills gaps only). Secrets: ANTHROPIC_API_KEY, FIRECRAWL_API_KEY, GOOGLE_PLACES_API_KEY
    complete-onboarding/ — self-serve onboarding: creates the school's portal auth user + client_users link (service role)
database/                — SQL migrations + platform/Adkins seed scripts (run in order)
knowledge/               — DOCTRINE LAYER (agent methodology + voice — DO NOT alter brand speak)
  system/                — Zach's methodology: playbooks/, sms-scripts/,
                           VOICE-GUIDE.md, SCRIPTS-INDEX.md, TEST-SCENARIOS.md
  agents/                — per-agent behavior contracts: LEADS.md, MESSAGING.md, CLIENT.md,
                           SCHEDULE.md, RETENTION.md, INVOICE.md, FINANCE.md, STAFF.md
  ARCHITECTURE.md        — event flow + agent hierarchy
  AGENT_CONTRACTS.md     — what every agent must return
  EVENT_TYPES.md         — master list of all event types
ADKINS_ONBOARDING.md     — step-by-step to onboard Adkins Music Lessons
HANDOFF.md               — deploy + onboarding handoff log (last mile)
README.md                — agent backend orientation (NOTE: setup section is stale Python — UNVERIFIED)

agents/  api-server/  tools/  tests/  — LEGACY Python scaffolding, now EMPTY husks.
                           No Python code remains (no requirements.txt / Dockerfile / *.py).
                           Superseded by supabase/functions/. Do NOT delete; do NOT build into.
```

## Enter ONLY if
Your task explicitly names: the agent backend, an edge function (on-new-lead, process-pending, on-reply, send-followup, enrollment-handoff, monthly-report, scrape-school, intake-form), SMS/lead-scoring logic, a specific agent doctrine (ziro-*), or agent backend architecture.

## Do NOT enter if
- Task involves the React CRM frontend (views, shell, design) → that is the main repo, not here
- Task involves Supabase migrations for the CRM → check `94-knowledge/migrations/`
- Task involves the landing pages or client portal → those are separate SPAs, not here

## Navigate within this folder
| Task | Load |
|---|---|
| Understand agent hierarchy / event flow | `knowledge/ARCHITECTURE.md` |
| What a specific agent must return | `knowledge/AGENT_CONTRACTS.md` |
| All event type definitions | `knowledge/EVENT_TYPES.md` |
| SMS conversation scripts | `knowledge/system/sms-scripts/` |
| Voice and tone rules | `knowledge/system/VOICE-GUIDE.md` |
| Gold standard behaviors | `knowledge/system/TEST-SCENARIOS.md` |
| A specific agent's doctrine | `knowledge/agents/<NAME>.md` |
| Edit lead scoring / send path | `supabase/functions/_shared/score-and-send.ts` |
| Edit an edge function | `supabase/functions/<function-name>/index.ts` |
| Shared SMS / Claude / prompts | `supabase/functions/_shared/` |
| Run/update DB schema | `database/migrations/` (run in order) |
| Deploy / onboarding steps | `HANDOFF.md`, `ADKINS_ONBOARDING.md` |

## Hard stop
Only the messaging path (ziro-messaging doctrine, executed via `_shared/twilio.ts`) sends SMS. No other function may trigger outbound messages outside that path.
You may NOT load React CRM files while working in this folder.
The empty `agents/` `api-server/` `tools/` `tests/` folders are legacy — do not revive Python or build new logic there. New backend logic goes in `supabase/functions/`.
If you think you need something not listed — STOP AND ASK first.
