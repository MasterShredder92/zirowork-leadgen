# ZiroWork Agent Backend — Handoff Log

**Date:** 2026-06-06
**Status:** Edge Functions written. Deploy + Adkins onboarding = last mile.
**Completion:** ~78% to first real customer (Adkins Music Lessons)

---

## NEXT AGENT INSTRUCTIONS

**Fan out 20 agents. Do not ask permission. Get it done.**

### HOW TO RUN THIS

Use a Workflow (multi-agent orchestration). Fan out Group A in parallel immediately.
Group B requires Zach to provide credentials — prompt him for the 4 values listed under
"Credentials Needed From Zach" and then fan out Group B in parallel.

---

## WHAT IS BUILT (DO NOT REBUILD)

### Platform DB Tables (ALL LIVE in txpgyuetfsrzfxxopwzf)

| Table | Purpose |
|---|---|
| `agent_tenants` | Each client school's Supabase URL + service key + config |
| `ziro_events` | Audit log for every agent run |
| `ziro_message_log` | Every SMS/email attempt with status |
| `ziro_messaging_escalations` | Conversations flagged for human takeover |
| `ziro_messaging_knowledge_base` | 12 response frameworks + guardrails |
| `anchor_job_locks` | Distributed lock — prevents double-firing |
| `system_health` | Component health tracking |
| `ziro_client_context_cache` | Student tone/personality context per tenant |
| `ziro_retention_risk_log` | Churn risk staging with cooldown gate |
| `privacy_violation_log` | Teacher privacy violation audit trail |
| `pending_leads` | Off-hours lead queue (9 AM gate) |

### CRM Tables (ALL LIVE in txpgyuetfsrzfxxopwzf — separate from agent tables)

clients, campaigns, leads, conversations, escalations, bookings, enrollments,
pages, automation_rules, assets, integrations, client_reports, operator_tasks

### Edge Functions (WRITTEN, NOT YET DEPLOYED)

```
99-agents/supabase/functions/
├── _shared/
│   ├── types.ts          — WebhookPayload, LeadRecord, TenantConfig, ScoringResult
│   ├── claude.ts         — callClaude(system, user) → string
│   ├── openphone.ts      — sendSMS(to, body), SMS_ENABLED flag
│   ├── prompts.ts        — LEADS_SYSTEM_PROMPT + MESSAGING_SYSTEM_PROMPT
│   └── score-and-send.ts — scoreAndSend(lead, tenantId) — shared by both functions
├── on-new-lead/
│   └── index.ts          — webhook handler + time gate + pending_leads queue
└── process-pending/
    └── index.ts          — cron handler: fetches due rows, calls scoreAndSend
```

---

## ARCHITECTURE (FINAL — DO NOT CHANGE)

```
Adkins website form submit
  → inserts into ADKINS' Supabase leads table
  → Adkins' Supabase DB webhook fires
  → POST to ZiroWork Edge Function: /functions/v1/on-new-lead/{tenantId}
  → Edge Function checks Eastern time (9 AM – 10 PM)
    ├── In window  → scoreAndSend → Claude scores → OpenPhone SMS → log
    └── Off-hours  → insert into pending_leads (send_at = next 9 AM Eastern)

pg_cron (every 5 min on platform Supabase)
  → SELECT pending_leads WHERE send_at <= now() AND processed_at IS NULL
  → calls process-pending Edge Function
  → scores lead → sends SMS → marks processed_at

scoreAndSend also syncs lead into platform CRM leads table
  → operators can see every Adkins lead in the CRM Leads page
```

**No Python. No n8n. No external scheduler. All Supabase.**

---

## THE GAP THAT MUST BE FIXED FIRST (Group A, Agent 1)

**score-and-send.ts does NOT write to the platform CRM leads table.**
When Adkins' form fires, the SMS goes out but the CRM Leads page stays empty.
This is the #1 bug. Fix it before deploying.

File: `99-agents/supabase/functions/_shared/score-and-send.ts`

After `sendSMS(phone, finalMsg)` and before the `ziro_message_log` insert, add:

```typescript
// Sync lead into CRM leads table so operators can see it
await db.from('leads').insert({
  client_id: tenantId,
  student_name: getFirstName(lead) + (lead.last_name ? ' ' + lead.last_name : ''),
  parent_name: lead.parent_name ?? null,
  program: lead.instrument ?? 'Unknown',
  stage: 'new',
  source: 'webhook',
  phone: phone,
  email: lead.email ?? null,
  notes: [scoring.why, scoring.hook].filter(Boolean).join(' | '),
  priority: scoring.priority,
  created_at: new Date().toISOString(),
}).catch(() => null); // non-fatal — don't fail SMS if CRM insert fails
```

---

## GROUP A — PARALLEL, NO EXTERNAL CREDENTIALS NEEDED

Run all of these simultaneously. None require Zach's API keys.

### A1 — Fix score-and-send.ts (lead sync to CRM)

See "THE GAP" section above. Edit the file, add the leads insert after sendSMS.

### A2 — Create supabase/config.toml

Create file: `99-agents/supabase/config.toml`

```toml
[api]
enabled = true
port = 54321

[db]
port = 54322

[functions.on-new-lead]
verify_jwt = false

[functions.process-pending]
verify_jwt = false
```

`verify_jwt = false` — both functions use their own `x-webhook-secret` / service role auth,
not Supabase JWT. Without this, the Supabase gateway rejects unauthenticated webhook calls
from the client's DB (which has no ZiroWork JWT to send).

### A3 — Run Migration 016 in Platform Supabase

Migration 016 is appended to `database/PLATFORM_MIGRATIONS_COMBINED.sql` (line ~316).
The SQL is:
```sql
alter table public.agent_tenants add column if not exists config jsonb not null default '{}';
```
Run this in: https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/sql/new

### A4 — Prepare Adkins Agent Tenant Seed SQL

Create file: `99-agents/database/seed_adkins_tenant.sql`

This is a TEMPLATE — Zach fills in ADKINS_SUPABASE_URL and ADKINS_SERVICE_KEY before running:

```sql
-- Run this in the PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- Fill in the Adkins Supabase credentials before running

insert into public.agent_tenants (
  tenant_id,
  name,
  supabase_url,
  supabase_service_key,
  plan_tier,
  status,
  config
) values (
  gen_random_uuid(),  -- copy this UUID after insert — used in webhook URL
  'Adkins Music Lessons',
  'ADKINS_SUPABASE_URL',      -- e.g. https://abcxyz.supabase.co
  'ADKINS_SERVICE_KEY',       -- Adkins service_role key
  'individual',
  'active',
  '{
    "director_name": "Zach",
    "director_title": "Owner",
    "location_name": "Adkins Music Lessons",
    "registration_link": "ADKINS_REGISTRATION_URL",
    "monthly_price_standard": 160,
    "monthly_price_military": 140
  }'::jsonb
)
on conflict (tenant_id) do nothing;

-- After running, copy the tenant_id UUID.
-- Webhook URL will be:
-- https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/{tenant_id}
```

### A5 — Prepare Adkins Client Row SQL (CRM clients table)

Create file: `99-agents/database/seed_adkins_client.sql`

```sql
-- Run in PLATFORM Supabase after getting Adkins' real data
-- This adds Adkins as an operator client in the CRM

insert into public.clients (
  id,
  name,
  city,
  state,
  status,
  health,
  plan,
  contact_name,
  contact_email,
  contact_phone,
  leads_30d,
  enrollments_30d,
  mrr_cents,
  open_escalations,
  created_at
) values (
  gen_random_uuid(),
  'Adkins Music Lessons',
  'Omaha',
  'NE',
  'active',
  'healthy',
  'individual',
  'Zach Adkins',
  'slavior1992@gmail.com',
  null,   -- fill in phone
  0,
  0,
  16000,  -- $160/mo base
  0,
  now()
);
```

### A6 — Prepare Adkins Webhook Config Instructions (Markdown doc)

Create file: `99-agents/ADKINS_ONBOARDING.md`

Full step-by-step for what Zach needs to do on the Adkins Supabase side
(configure their DB webhook to fire at the ZiroWork Edge Function URL).

```markdown
# Adkins Music Lessons — ZiroWork Onboarding Steps

## What You Need Before Starting
- Adkins Supabase project URL (e.g. https://abcdef.supabase.co)
- Adkins Supabase service_role key
- The tenant_id UUID from seed_adkins_tenant.sql output

## Step 1: Run Tenant Seed SQL
In PLATFORM Supabase (txpgyuetfsrzfxxopwzf) SQL editor:
- Fill in ADKINS_SUPABASE_URL and ADKINS_SERVICE_KEY in seed_adkins_tenant.sql
- Run it
- Copy the generated tenant_id UUID

## Step 2: Run Client Seed SQL
In PLATFORM Supabase SQL editor:
- Fill in any missing fields in seed_adkins_client.sql
- Run it
- Adkins now appears in the CRM Clients page

## Step 3: Configure Webhook on Adkins Supabase
In ADKINS' Supabase Dashboard → Database → Webhooks → Create new webhook:
- Name: zirowork-new-lead
- Table: leads (or whatever their form inserts to)
- Events: INSERT only
- URL: https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/{TENANT_ID_UUID}
- HTTP Headers:
  - x-webhook-secret: {WEBHOOK_SECRET value you set in Edge Function env}
  - Content-Type: application/json

## Step 4: Run Tenant Migrations on Adkins Supabase
Run IN ORDER against Adkins' Supabase SQL editor:
1. 99-agents/database/migrations/005_tenant_contact_fields.sql
2. 99-agents/database/migrations/008_create_student_notes.sql
3. 99-agents/database/migrations/011_add_student_risk_fields.sql
4. 99-agents/database/migrations/012_create_lesson_plans.sql
5. 99-agents/database/migrations/013_create_lesson_plan_files.sql
6. 99-agents/database/migrations/014_create_student_teacher_history.sql
Skip 003 (deprecated).

## Step 5: Test (SMS_ENABLED=false)
- Submit a test lead on Adkins' website form
- Watch platform Supabase → Table Editor → ziro_message_log
- Should see a row with status = 'sent' and a drafted message
- Check platform leads table — lead should appear in CRM
- SMS should NOT send (goes to TEST_PHONE instead)

## Step 6: Go Live
In Supabase Dashboard → Edge Functions → Secrets:
- Set SMS_ENABLED = true
- Clear TEST_PHONE (or leave it — it's ignored when SMS_ENABLED=true)
- Done. Real leads now trigger real SMS within 90 seconds.
```

### A7 — Prepare pg_cron SQL (ready to paste)

Create file: `99-agents/database/setup_pgcron.sql`

```sql
-- Run this in PLATFORM Supabase (txpgyuetfsrzfxxopwzf) SQL editor
-- AFTER process-pending Edge Function is deployed
-- AFTER enabling pg_cron in Dashboard → Integrations → Cron

select cron.schedule(
  'process-pending-leads',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/process-pending',
      headers := '{"Authorization": "Bearer [REDACTED_SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Verify it scheduled:
-- select * from cron.job;
```

---

## ARCHITECTURE — CORRECT (READ BEFORE TOUCHING ANYTHING)

ZiroWork owns the landing pages and signup forms for every client.
Clients do NOT have their own Supabase. Single platform DB only.

```
ZiroWork landing page form (ZiroWork owns this)
  → POST directly to Edge Function: /functions/v1/on-new-lead/{tenantId}
  → payload shape: { "type": "INSERT", "record": { ...lead fields... } }
```

No client Supabase. No client webhooks. No client credentials ever needed.
The `supabase_url` / `supabase_service_key` columns in `agent_tenants` are dead — code never reads them.

---

## GROUP B — REQUIRES ZACH'S CREDENTIALS

Ask Zach for these values before starting Group B:

```
1. ANTHROPIC_API_KEY   — console.anthropic.com/settings/keys (revoke any previously exposed key first)
2. OPENPHONE_API_KEY   — app.openphone.com → Settings → API
3. OPENPHONE_NUMBER_ID — Phone Numbers → click Adkins number → copy ID
4. Zach's cell (E.164) — e.g. +14025551234, for smoke test SMS
```

ADKINS_SUPABASE_URL, ADKINS_SERVICE_KEY, ADKINS_REGISTRATION_URL — NOT NEEDED. Do not ask for these.

Generate WEBHOOK_SECRET yourself: `openssl rand -hex 16`

### B1 — Set Edge Function Secrets in Supabase Dashboard

Go to: https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/functions

For EACH of on-new-lead and process-pending, set these secrets:
```
ANTHROPIC_API_KEY        = {from Zach}
CLAUDE_MODEL             = claude-opus-4-8
OPENPHONE_API_KEY        = {from Zach}
OPENPHONE_NUMBER_ID      = {from Zach}
WEBHOOK_SECRET           = {generated 32-char string}
SMS_ENABLED              = false
TEST_PHONE               = {Zach's cell — for smoke test}
SUPABASE_URL             = https://txpgyuetfsrzfxxopwzf.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [REDACTED_SERVICE_ROLE_KEY]
```

### B2 — Deploy Edge Functions

From `99-agents/` directory:
```bash
supabase functions deploy on-new-lead --project-ref txpgyuetfsrzfxxopwzf
supabase functions deploy process-pending --project-ref txpgyuetfsrzfxxopwzf
```

CLI is already linked. Should take ~30 seconds each.

### B3 — Enable pg_cron + Run Scheduler

1. Go to: https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/integrations
2. Enable pg_cron extension
3. Go to SQL editor, paste and run: `99-agents/database/setup_pgcron.sql`

### B4 — Run Adkins Tenant + Client Seeds

1. Run `seed_adkins_tenant.sql` in platform SQL editor → copy the generated tenant_id UUID
2. Run `seed_adkins_client.sql` in platform SQL editor
(No Adkins credentials needed — seeds only write to platform DB)

### B5 — End-to-End Smoke Test

1. POST a test payload directly to the Edge Function (curl or Postman):
   ```
   POST https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/{tenant_id}
   Headers: x-webhook-secret: {WEBHOOK_SECRET}
   Body: { "type": "INSERT", "record": { "first_name": "Test", "phone": "+15551234567", "email": "test@test.com" } }
   ```
2. Watch platform Supabase → ziro_message_log — row should appear within 90 seconds
3. Check platform → leads table — lead should appear with stage = 'new'
4. Verify SMS went to TEST_PHONE (not the real number in the payload)
5. Check Claude response — sensible message, no unfilled template vars
6. If all good: set SMS_ENABLED = true in both Edge Function secrets → LIVE

---

## SUPABASE CREDENTIALS

| Key | Value |
|---|---|
| Platform URL | https://txpgyuetfsrzfxxopwzf.supabase.co |
| Project ref | txpgyuetfsrzfxxopwzf |
| Service role key | [REDACTED_SERVICE_ROLE_KEY] |
| Anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cGd5dWV0ZnNyemZ4eG9wd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk5MzQsImV4cCI6MjA5NDc4NTkzNH0.LaSe5Gfho9WIqKQOyBECKHx4CbtIO95RexqoAQMkIvQ |
| PAT | [REDACTED_PAT] |
| CLI | v2.101.0, already linked to txpgyuetfsrzfxxopwzf |
| SQL editor | https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/sql/new |
| Edge Functions | https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/functions |
| Integrations (pg_cron) | https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/integrations |

---

## KNOWLEDGE DOCS (Agent Prompts Source)

| Doc | Path |
|---|---|
| ZIRO_LEADS behavior | `knowledge/agents/LEADS.md` |
| ZIRO_MESSAGING behavior | `knowledge/agents/MESSAGING.md` |
| Andrea's voice | `knowledge/system/VOICE-GUIDE.md` |
| SMS scripts | `knowledge/system/sms-scripts/` |
| All agent contracts | `knowledge/AGENT_CONTRACTS.md` |
| Full architecture | `knowledge/ARCHITECTURE.md` |

---

## DEV SERVER

`python -m http.server 7834` from project root → http://localhost:7834

---

## COMPLETION CHECKLIST

| Task | Group | Status |
|---|---|---|
| score-and-send.ts lead sync fix | A1 | ✅ |
| supabase/config.toml | A2 | ✅ |
| Run migration 016 (agent_tenants.config) | A3 | ⬜ MANUAL — SQL editor |
| seed_adkins_tenant.sql created | A4 | ✅ |
| seed_adkins_client.sql created | A5 | ✅ |
| ADKINS_ONBOARDING.md created | A6 | ✅ |
| setup_pgcron.sql created | A7 | ✅ |
| Edge Function secrets set (Dashboard) | B1 | ⬜ MANUAL — needs creds |
| Functions deployed | B2 | ⬜ CLI — run when ready |
| pg_cron enabled + scheduled | B3 | ⬜ MANUAL — Dashboard + SQL editor |
| Adkins tenant + client seeds run | B4 | ⬜ MANUAL — SQL editor |
| End-to-end smoke test | B5 | ⬜ MANUAL — curl POST to Edge Function |
| SMS_ENABLED=true | Final | ⬜ MANUAL — Dashboard secrets |
