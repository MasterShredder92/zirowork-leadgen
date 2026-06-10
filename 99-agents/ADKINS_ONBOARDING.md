# Adkins Music Lessons — ZiroWork Go-Live Checklist

**Operator:** Zach Adkins
**Date:** 2026-06-06
**Status:** Ready to execute once credentials provided

---

## What You Need Before Starting

| Item | Where to Get It |
|---|---|
| Adkins Supabase project URL | Adkins Supabase → Settings → API |
| Adkins Supabase service_role key | Adkins Supabase → Settings → API |
| Anthropic API key | console.anthropic.com/settings/keys |
| OpenPhone API key | app.openphone.com → Settings → API |
| OpenPhone Number ID | app.openphone.com → Phone Numbers → click number → copy ID |
| Adkins registration form URL | wherever students register online |
| Zach's cell (for smoke test) | for receiving test SMS |

Generate a webhook secret yourself — any 32-char random string.
On Mac/Linux: `openssl rand -hex 16`

---

## Step 1 — Run Migration 016 (Platform)

In Platform Supabase SQL editor (txpgyuetfsrzfxxopwzf):

```sql
alter table public.agent_tenants add column if not exists config jsonb not null default '{}';
```

---

## Step 2 — Set Edge Function Secrets (Platform)

Go to: https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/functions

Click **on-new-lead** → **Secrets** → add each:

```
ANTHROPIC_API_KEY         = <from Anthropic console>
CLAUDE_MODEL              = claude-opus-4-8
OPENPHONE_API_KEY         = <from OpenPhone>
OPENPHONE_NUMBER_ID       = <from OpenPhone>
WEBHOOK_SECRET            = <your generated 32-char string>
SMS_ENABLED               = false
TEST_PHONE                = <Zach's cell in E.164 format, e.g. +14025551234>
SUPABASE_URL              = https://txpgyuetfsrzfxxopwzf.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [REDACTED_SERVICE_ROLE_KEY]
```

Repeat the same secrets for **process-pending**.

---

## Step 3 — Deploy Edge Functions

From `99-agents/` in the terminal (CLI already linked):

```bash
supabase functions deploy on-new-lead --project-ref txpgyuetfsrzfxxopwzf
supabase functions deploy process-pending --project-ref txpgyuetfsrzfxxopwzf
```

---

## Step 4 — Enable pg_cron + Schedule

1. Go to: https://supabase.com/dashboard/project/txpgyuetfsrzfxxopwzf/integrations
2. Find **pg_cron** → Enable
3. In SQL editor, paste and run: `99-agents/database/setup_pgcron.sql`

---

## Step 5 — Seed Adkins Tenant (Platform)

1. Open `99-agents/database/seed_adkins_tenant.sql`
2. Replace the 3 PLACEHOLDER values with real Adkins Supabase URL, service key, and registration URL
3. Run in platform SQL editor
4. **Copy the returned `tenant_id` UUID** — you need it for Step 7

---

## Step 6 — Seed Adkins CRM Client (Platform)

Run `99-agents/database/seed_adkins_client.sql` in platform SQL editor.
Adkins now appears in the CRM → Clients page.

---

## Step 7 — Configure Webhook on Adkins Supabase

Go to **Adkins' Supabase** Dashboard → Database → Webhooks → Create new webhook:

| Field | Value |
|---|---|
| Name | zirowork-new-lead |
| Table | leads (or whatever their website form inserts to) |
| Events | INSERT only |
| URL | `https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/{TENANT_ID_UUID}` |
| Header: x-webhook-secret | `{your generated WEBHOOK_SECRET}` |
| Header: Content-Type | application/json |

Replace `{TENANT_ID_UUID}` with the UUID from Step 5.
Replace `{your generated WEBHOOK_SECRET}` with the same value you put in Edge Function secrets.

---

## Step 8 — Run Tenant Migrations on Adkins Supabase

Run IN ORDER in **Adkins' Supabase** SQL editor:

```
005_tenant_contact_fields.sql
008_create_student_notes.sql
011_add_student_risk_fields.sql
012_create_lesson_plans.sql
013_create_lesson_plan_files.sql
014_create_student_teacher_history.sql
```

Skip 003 (deprecated, replaced by 012).

Files are in: `99-agents/database/migrations/`

---

## Step 9 — End-to-End Smoke Test

1. Submit a test lead on Adkins' website form (or manually INSERT into their leads table)
2. Wait 30–90 seconds
3. Check **Platform Supabase** → Table Editor → `ziro_message_log`
   - Should see a row with `status = 'sent'` and a real drafted SMS
4. Check Platform → `leads` table
   - Lead should appear with `stage = 'new'` and `source = 'webhook'`
5. Check Zach's TEST_PHONE — SMS should arrive (sent to test number, not real lead)
6. Verify the message looks right — name, instrument, no unfilled `[template]` vars

If `ziro_messaging_escalations` has a row instead of `ziro_message_log`, Claude flagged an
unresolved variable — check the lead data for missing fields (phone, first_name, instrument).

---

## Step 10 — Go Live

In Supabase Dashboard → Edge Functions → on-new-lead → Secrets:
- Set `SMS_ENABLED = true`
- Delete or clear `TEST_PHONE` (no longer needed)

Repeat for process-pending.

**Done. Real leads from Adkins' website now get an SMS within 90 seconds, 9 AM–10 PM Eastern.**

---

## Monitoring

| What to watch | Where |
|---|---|
| Every lead processed | Platform → `ziro_events` table |
| Every SMS sent | Platform → `ziro_message_log` table |
| Escalations (needs human) | Platform → `ziro_messaging_escalations` |
| Off-hours queue | Platform → `pending_leads` |
| CRM view of leads | ZiroWork CRM → Leads page |
