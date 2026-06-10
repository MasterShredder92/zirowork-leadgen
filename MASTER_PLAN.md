# ZiroWork Master Execution Plan

From 42% ready → live with Adkins Music Lessons → repeatable for every future client.

No dates. No estimates. In order. Every step names the exact file, field, function, or SQL that changes.

**WHO legend:**
- `[ZACH]` — manual action in a browser or dashboard
- `[AGENT]` — I write the code/SQL, you just approve
- `[BOTH]` — agent writes, Zach runs/deploys

---

## ADKINS TENANT UUID (save this — it goes in the webhook URL)
```
b872160f-3143-4d02-b564-28df745f99d7
```
Webhook URL: `https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/b872160f-3143-4d02-b564-28df745f99d7`

---

## PHASE 0 STATUS: COMPLETE (except 0-F and 0-G — waiting on OpenPhone)

| Step | What | Status |
|---|---|---|
| 0-A | CRM tables | ✅ All 24 tables existed already |
| 0-B | Missing columns on leads + clients | ✅ Done via Management API |
| 0-C | client_pages table | ✅ Created |
| 0-D | Adkins client row | ✅ Seeded (UUID above) |
| 0-E | Migration 016 (agent_tenants.config) | ✅ Done |
| 0-F | Set Edge Function secrets | ⬜ Waiting — Zach needs Anthropic key + OpenPhone |
| 0-G | Add openphone_number_id to Adkins config | ⬜ Waiting — need PN_XXXXX from OpenPhone |

**Next action for new agent: start Phase 1-A (fix process-pending auth) — that's a code change, no credentials needed.**

---

# PHASE 0: Foundation
**Dependency:** Everything else depends on Phase 0. Nothing works without it.
**Parallelizable:** Steps 0-A, 0-B, 0-C can run simultaneously. 0-D through 0-G must be sequential.

---

### 0-A: Create missing platform CRM tables `[BOTH]` — ✅ DONE (all CRM + agent tables live)
**WHAT:** Agent writes `99-agents/database/017_platform_crm_tables.sql`. Zach runs it in platform SQL editor.
**WHY:** The CRM tables (`clients`, `leads`, `campaigns`, `conversations`, `bookings`, `enrollments`, `pages`, `automation_rules`, `assets`, `integrations`, `client_reports`) must exist or every Edge Function insert fails. (All now live.)
**WHERE:** Supabase dashboard → project `txpgyuetfsrzfxxopwzf` → SQL Editor → New query → paste → Run.
**VERIFY:** All 11 tables appear in Table Editor with no errors.

---

### 0-B: Add landing page + tracking columns to existing tables `[BOTH]`
**WHAT:** Agent writes `99-agents/database/018_add_missing_columns.sql`. Zach runs it.
**WHY:** Onboarding wizard, landing page system, and UTM tracking write to columns that don't exist yet.
**Columns added to `clients`:** `slug`, `fb_pixel_id`, `gtm_id`, `hero_photo_url`, `logo_url`, `tagline`, `offer`, `testimonial`, `teachers jsonb`, `instruments jsonb`, `program_prices jsonb`, `studio_phone`, `website`, `email`, `area_code`
**Columns added to `leads`:** `utm jsonb`, `page_url`, `form_responses jsonb`, `age`
**WHERE:** Same SQL editor.

---

### 0-C: Create `client_pages` table `[BOTH]`
**WHAT:** Agent writes `99-agents/database/019_client_pages.sql`. Zach runs it.
**WHY:** The landing page system reads from this table to serve instrument-specific pages. Each row = one instrument page for one school.
**Schema:** `id, client_id (FK → clients), instrument, slug, is_active, hero_photo_url, teacher_index, custom_headline, custom_offer, created_at, updated_at`. Unique on `(client_id, instrument)`.
**WHERE:** Same SQL editor.

---

### 0-D: Seed Adkins client row `[ZACH]`
**WHAT:** Run `99-agents/database/seed_adkins_client.sql` in SQL editor.
**WHY:** `score-and-send.ts` inserts `leads.client_id = tenantId`. That UUID must exist in `clients.id` or the FK silently drops every CRM lead.
**BEFORE RUNNING:** First run `SELECT id, name FROM agent_tenants WHERE name ILIKE '%adkins%';` — confirm the UUID in the seed file matches. Update the seed file if it doesn't.
**VERIFY:** `SELECT id, name, status FROM clients;` shows Adkins row.

---

### 0-E: Run Migration 016 `[ZACH]`
**WHAT:** Run this SQL: `ALTER TABLE public.agent_tenants ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}';`
**WHY:** `score-and-send.ts` reads `tenant.config` for director name, pricing, OpenPhone number ID. Column must exist.
**WHERE:** Platform SQL editor.

---

### 0-F: Set all Edge Function secrets `[ZACH]`
**WHAT:** In Supabase dashboard → project `txpgyuetfsrzfxxopwzf` → Settings → Edge Functions → Secrets, set:
```
WEBHOOK_SECRET            = <openssl rand -hex 16>
ANTHROPIC_API_KEY         = <new key from console.anthropic.com — revoke the exposed one first>
CLAUDE_MODEL              = claude-sonnet-4-6
OPENPHONE_API_KEY         = <OpenPhone dashboard → Settings → API>
OPENPHONE_NUMBER_ID       = <OpenPhone → Phone Numbers → Adkins number → ID (format: PN_XXXXX)>
SMS_ENABLED               = false
TEST_PHONE                = <your cell in E.164: +14025551234>
SUPABASE_URL              = https://txpgyuetfsrzfxxopwzf.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [REDACTED_SERVICE_ROLE_KEY]
```
**NOTE:** Set these secrets for BOTH `on-new-lead` and `process-pending` functions.

---

### 0-G: Update Adkins tenant config with OpenPhone number ID `[ZACH]`
**WHAT:** Run in SQL editor:
```sql
UPDATE agent_tenants
SET config = config || jsonb_build_object(
  'openphone_number_id', '<PN_XXXXX from step 0-F>',
  'director_name', 'Zach Adkins',
  'director_title', 'Owner',
  'location_name', 'Adkins Music Lessons',
  'monthly_price_standard', 160,
  'monthly_price_military', 140
)
WHERE name ILIKE '%adkins%';
```
**WHY:** The `on-reply` function (Phase 2) matches incoming OpenPhone webhooks to tenants by `openphone_number_id`. If missing, every reply is lost.

---

# PHASE 1: Outbound Pipeline Live
**Dependency:** Phase 0 complete.
**Parallelizable:** 1-A and 1-B can run simultaneously. 1-C is sequential after both.

---

### 1-A: Fix `process-pending` auth gap `[AGENT]`
**WHAT:** Edit `99-agents/supabase/functions/process-pending/index.ts`. Add at the top of the handler:
```typescript
if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
  return new Response('Unauthorized', { status: 401 });
}
```
**WHY:** Anyone who discovers the URL can drain the queue and rack up Claude + OpenPhone charges with no auth.
**FILE:** `99-agents/supabase/functions/process-pending/index.ts`

---

### 1-B: Deploy both Edge Functions `[BOTH]` — ✅ DONE (all 9 functions deployed and live)
**WHAT:** From `99-agents/` directory, run:
```bash
supabase functions deploy on-new-lead --project-ref txpgyuetfsrzfxxopwzf
supabase functions deploy process-pending --project-ref txpgyuetfsrzfxxopwzf
```
**WHY:** Functions must be deployed before anything runs. (Now deployed — re-run only after code changes.)
**WHO:** Agent can run this command. Supabase CLI is already linked.

---

### 1-C: Enable pg_cron and schedule the processor `[ZACH]` — ✅ DONE (process-pending-leads active, every 5 min)
**WHAT:**
1. Supabase dashboard → Integrations → enable `pg_cron` extension
2. SQL editor → paste and run `99-agents/database/setup_pgcron.sql`
**WHY:** `process-pending` needs to fire every 5 minutes to drain the off-hours queue. pg_cron is the trigger.

---

### 1-D: Smoke test — outbound only `[ZACH]`
**WHAT:** POST a fake lead directly to the Edge Function:
```bash
curl -X POST \
  https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/<tenant_id_uuid> \
  -H "x-webhook-secret: <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","record":{"first_name":"Test","last_name":"Lead","phone":"<TEST_PHONE>","email":"test@test.com","instrument":"piano","student_age":8}}'
```
**VERIFY:**
- SMS arrives at TEST_PHONE within 90 seconds
- Row appears in platform `ziro_message_log` table
- Row appears in platform `leads` table with `stage = 'new'`
- Row appears in CRM Leads page

**If SMS arrives but CRM is empty:** Step 0-A or 0-D failed — re-check table creation and client seed.
**If nothing happens:** Check `ziro_events` table for error rows. Check Supabase Edge Function logs.

---

# PHASE 2: Inbound Reply Loop
**Dependency:** Phase 1 complete and smoke test passed.
**This is the biggest build in the plan — the system currently has 0% of this.**

---

### 2-A: Build `on-reply` Edge Function `[AGENT]`
**WHAT:** Create `99-agents/supabase/functions/on-reply/index.ts`

**Logic:**
1. OpenPhone fires a webhook on every inbound SMS to the Adkins number
2. Function authenticates via `WEBHOOK_SECRET` header
3. Extract: `from` phone number, `body` (reply text), `phoneNumberId` from payload
4. Look up tenant: `SELECT * FROM agent_tenants WHERE config->>'openphone_number_id' = phoneNumberId`
5. Load conversation history: `SELECT message_body, direction, sent_at FROM ziro_message_log WHERE tenant_id = $1 AND recipient_phone = $2 ORDER BY sent_at ASC LIMIT 20`
6. Build Claude context: system prompt (Andrea voice + current script stage) + full conversation history + new reply
7. Call Claude → get response
8. If response = `ESCALATE` → insert into `ziro_messaging_escalations`, stop
9. Otherwise → call `sendSMS(fromPhone, response)` via OpenPhone
10. Log outbound to `ziro_message_log`
11. Log to `ziro_events`

**New file needed:** `99-agents/supabase/functions/_shared/conversation.ts` — helper to load and format conversation history for Claude context.

**Files to read before writing:** `_shared/openphone.ts`, `_shared/claude.ts`, `_shared/prompts.ts`, `_shared/score-and-send.ts`

---

### 2-B: Configure OpenPhone inbound webhook `[ZACH]`
**WHAT:** In OpenPhone dashboard → Settings → Webhooks → Add webhook:
- Event: `message.received`
- URL: `https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-reply`
- Header: `x-webhook-secret: <WEBHOOK_SECRET>`
**WHY:** Without this, OpenPhone never notifies ZiroWork when a lead replies.

---

### 2-C: Deploy `on-reply` function `[BOTH]` — ✅ DONE (deployed and live)
```bash
supabase functions deploy on-reply --project-ref txpgyuetfsrzfxxopwzf
```

---

### 2-D: Smoke test — full conversation loop `[ZACH]`
**WHAT:**
1. Submit a test lead (same curl from Phase 1-D)
2. Reply to the SMS from your TEST_PHONE
3. Verify a second SMS arrives within 30 seconds
4. Verify `ziro_message_log` shows both outbound rows
5. Verify CRM Conversations page shows the thread

**If no reply comes:** Check `ziro_events` for errors. Check OpenPhone webhook delivery logs.

---

### 2-E: Flip SMS_ENABLED = true `[ZACH]`
**WHAT:** Supabase dashboard → Edge Functions → Secrets → set `SMS_ENABLED = true` for all three functions (on-new-lead, process-pending, on-reply). Remove or clear `TEST_PHONE`.
**WHY:** All traffic now goes to real leads. Do not do this until 2-D passes.

---

# PHASE 3: Fix Onboarding Wizard
**Dependency:** Phase 0 complete. Can run parallel to Phase 2.
**Purpose:** Make it possible to configure a real client from the CRM — not just Adkins, every future client.

---

### 3-A: Audit wizard current state `[AGENT]`
**WHAT:** Read `02-onboarding/` in full. List every field collected across all steps vs what the final insert actually saves.
**WHY:** Previous audit found 80% of collected data is thrown away. Need exact list before fixing.

---

### 3-B: Expand onboarding insert payload `[AGENT]`
**WHAT:** Edit the final submit handler in `02-onboarding/`. Ensure the `clients` insert/upsert includes:
- `slug` (auto-generated from studio name: lowercase, spaces→hyphens, unique)
- `instruments` (array from step that asks which instruments they teach)
- `program_prices` (per-instrument pricing object)
- `teachers` (array of {name, instruments, photo_url})
- `fb_pixel_id` (from tracking step)
- `gtm_id` (from tracking step)
- `studio_phone`
- `website`
- `tagline`
- `offer` (what they're offering new students)
- All contact fields already collected

**Also insert into `agent_tenants`:** `config` with director_name, location_name, pricing, openphone_number_id (from a new field in onboarding)

**FILE:** `02-onboarding/` — main form submission handler

---

### 3-C: Add missing onboarding steps `[AGENT]`
**WHAT:** Add two new steps to the onboarding wizard:
1. **Tracking pixels step:** Fields for Facebook Pixel ID and Google Tag Manager ID. Helper text explaining how to find each. Not required — can be added later.
2. **OpenPhone step:** Field for the phone number ID (PN_XXXXX) assigned to this client. Explains what it is and where to find it.

**FILE:** `02-onboarding/` — wizard step definitions

---

### 3-D: Make checklist items toggleable `[AGENT]`
**WHAT:** Edit the post-onboarding checklist in `02-onboarding/`. Each checklist item (SMS number active, webhook configured, slots set, etc.) should be a checkbox that writes `true` to a `checklist` jsonb column on `agent_tenants`.
**WHY:** Currently display-only. Operators can't track actual readiness.

---

### 3-E: Wire "Add Client" button on Clients page `[AGENT]`
**WHAT:** Edit `01-clients/`. The "Add Client" button currently does nothing. Wire it to open the onboarding wizard at step 1 (or navigate to `/onboarding`).
**FILE:** `01-clients/` — main view, Add Client button handler

---

# PHASE 4: UTM + Pixel Tracking
**Dependency:** Phase 0-B (leads.utm column exists). Can run parallel to Phase 3.
**Purpose:** Know which ad produced which enrollment. Required before running paid traffic.

---

### 4-A: Build the ZiroWork intake form `[AGENT]`
**WHAT:** Create `99-agents/supabase/functions/intake-form/` — a Deno Edge Function that serves a self-contained HTML intake form page.

**The form:**
- Auto-captures `utm_source`, `utm_campaign`, `utm_medium`, `utm_content`, `utm_term` from URL params on page load, stores in hidden fields
- Captures: first_name, phone (required), email, instrument (dropdown from client config), student_age, goals (optional), military (checkbox), how_did_you_hear
- On submit: POSTs to `on-new-lead/{tenantId}` with payload: `{ type: "INSERT", record: { ...formFields, utm: { utm_source, utm_campaign, ... }, page_url: window.location.href } }`
- Shows thank-you message after submit (no page redirect — avoids losing UTM data)
- Injects `fb_pixel_id` and `gtm_id` from the client's config (fetched from platform DB on page load via the Edge Function)
- Fires Facebook Pixel `Lead` event on form submit
- Fires Google Tag Manager `generate_lead` event on form submit

**URL pattern:** `https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/intake-form/<client_slug>`

---

### 4-B: Update `on-new-lead` to store UTM data `[AGENT]`
**WHAT:** Edit `99-agents/supabase/functions/on-new-lead/index.ts`. The lead record already passes through to `scoreAndSend`. Ensure `utm` and `page_url` fields from the form payload are preserved on the `leads` insert in `score-and-send.ts`.
**FILE:** `99-agents/supabase/functions/_shared/score-and-send.ts` — add `utm` and `page_url` to the leads insert.

---

### 4-C: Deploy intake-form function `[BOTH]` — ✅ DONE (deployed and live)
```bash
supabase functions deploy intake-form --project-ref txpgyuetfsrzfxxopwzf
```

---

# PHASE 5: Follow-Up Sequences
**Dependency:** Phase 2 complete (on-reply working). Phases 3 and 4 can be running in parallel.
**Purpose:** Leads that don't respond to the opener get followed up automatically on Day 2, Day 4, Day 7.

---

### 5-A: Add follow-up tracking columns `[BOTH]`
**WHAT:** Agent writes `99-agents/database/020_followup_tracking.sql`. Zach runs it.
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_paused boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opted_out boolean NOT NULL DEFAULT false;
```
**WHY:** `send-followup` needs to know when the last contact was and how many follow-ups have fired.

---

### 5-B: Build `send-followup` Edge Function `[AGENT]`
**WHAT:** Create `99-agents/supabase/functions/send-followup/index.ts`

**Logic:**
1. Runs on pg_cron schedule (every hour — checks if any leads are due)
2. Query: `SELECT * FROM leads WHERE stage = 'new' AND followup_paused = false AND opted_out = false AND followup_count < 3 AND last_contact_at < now() - interval '2 days'`
3. For each lead: pick follow-up script based on `followup_count` (0→Day2 script, 1→Day4, 2→Day7)
4. Call Claude with Andrea voice + script + lead context
5. Send SMS via OpenPhone
6. Update lead: `followup_count + 1`, `last_contact_at = now()`
7. Log to `ziro_message_log`

**Opt-out detection:** In `on-reply`, if inbound message contains STOP/UNSUBSCRIBE/QUIT → set `leads.opted_out = true`, stop all sequences.

**Pause on engagement:** In `on-reply`, whenever a lead replies anything other than opt-out → set `leads.followup_paused = true` (they're in live conversation, don't fire sequences).

---

### 5-C: Add pg_cron entry for follow-ups `[ZACH]` — ✅ DONE (send-followup-sequences active, hourly)
**WHAT:** Run in SQL editor:
```sql
SELECT cron.schedule(
  'send-followup-sequences',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/send-followup',
      headers := '{"Authorization": "Bearer [REDACTED_SERVICE_ROLE_KEY]"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

---

### 5-D: Deploy `send-followup` function `[BOTH]` — ✅ DONE (deployed and live)
```bash
supabase functions deploy send-followup --project-ref txpgyuetfsrzfxxopwzf
```

---

# PHASE 6: Landing Page System
**Dependency:** Phase 4 complete (intake-form function exists). Phase 3 complete (onboarding stores instruments/slug).
**Purpose:** Per-school pages hosted at a real URL that ads can drive traffic to.

---

### 6-A: Decide URL structure `[ZACH — decision]`
**Options:**
1. `zirowork.com/go/adkins` — simple, no DNS needed per client
2. `adkins.zirowork.com` — subdomain, requires wildcard DNS
3. Custom domain (adkinsmusiclessons.com) — requires client to point DNS at ZiroWork

**Recommended for Phase 1:** Option 1. Use the intake-form Edge Function already built in Phase 4 — it serves at `/intake-form/<slug>`. No additional infrastructure.

**For Phase 2+:** Add subdomain support. Requires Cloudflare Workers or Vercel with wildcard routing.

---

### 6-B: Build landing page template `[AGENT]`
**WHAT:** Extend `intake-form` Edge Function to serve a full landing page before the form. The page:
- Fetches client config from platform DB (name, tagline, offer, hero_photo_url, instruments, testimonial)
- Renders: hero section (headline + offer), instrument cards (click → filters form to that instrument), social proof (testimonial), form, footer with SMS consent language
- Injects Facebook Pixel and GTM from client config
- Auto-populates instrument in form if URL has `/piano`, `/guitar`, etc. suffix

**Instrument routing:** `intake-form/<slug>/piano` → page loads with piano pre-selected, hero copy references piano lessons

**FILE:** `99-agents/supabase/functions/intake-form/index.ts` — expand existing function

---

### 6-C: Add protected time slots to onboarding `[AGENT]`
**WHAT:** Add a step to the onboarding wizard where the school owner inputs available trial lesson windows (e.g., "Mon/Wed 4-6pm, Sat 10am-2pm"). Store as `jsonb` in `agent_tenants.config.available_slots`.
**WHY:** The SMS scripts offer specific time slots. If none are configured, the AI makes up availability that doesn't exist.
**FILE:** `02-onboarding/` — new wizard step + `agent_tenants.config` update

---

# PHASE 7: CRM Completeness
**Dependency:** Phase 1 complete (data flowing in). Can run in parallel with Phases 3-6.
**Purpose:** Operators can see and manage everything from the CRM.

---

### 7-A: Wire Conversations page to real data `[AGENT]`
**WHAT:** Edit `06-conversations/`. Currently reads seed data.
- Connect to `ziro_message_log` table, grouped by `recipient_phone + tenant_id`
- Show thread list on left: lead name, last message preview, timestamp, unread indicator
- Show full thread on right when selected: all messages in chronological order, direction (inbound/outbound), timestamps
- Add "Take over" button → sets `followup_paused = true`, opens compose box for operator to reply manually (write to `ziro_message_log` + send via OpenPhone API)

**FILE:** `06-conversations/conversations.jsx`

---

### 7-B: Wire Leads page detail view `[AGENT]`
**WHAT:** Edit `05-leads/`. When operator clicks a lead card:
- Show full lead detail panel: name, phone, email, instrument, age, UTM source, score/priority, notes, conversation history link
- Show stage history
- Show action buttons: Move stage, Mark enrolled, Add note, View conversation

**FILE:** `05-leads/` — lead detail panel

---

### 7-C: Wire Escalations page to real actions `[AGENT]`
**WHAT:** Edit `07-escalations/`. Currently "Resolve" and "Forward" buttons write to Supabase but take no real action.
- "Resolve" → marks resolved, removes from active queue
- "Forward to Studio" → sends a notification SMS to the school owner with the escalation context (requires studio_phone in client config from Phase 3-B)
- Show full conversation thread inline on escalation card

**FILE:** `07-escalations/escalations.jsx`

---

### 7-D: Wire Enrollments enrollment write `[AGENT]`
**WHAT:** Edit `09-enrollments/`. When marking a student enrolled:
- Add `weekly_rate_cents` field (currently null → breaks revenue rollup)
- Generate enrollment handoff packet: student name, instrument, age, goals, military status, confirmed slot, teacher assigned, registration link sent
- Save handoff packet to `enrollments.handoff_notes`

**FILE:** `09-enrollments/enrollments.jsx`

---

### 7-E: Wire Reporting to real data `[AGENT]`
**WHAT:** Edit `10-reporting/`. Wire all metrics to real Supabase queries:
- Leads this month: `COUNT(*) FROM leads WHERE created_at > date_trunc('month', now())`
- Enrollments: same on enrollments table
- SMS response rate: replied leads / total leads (from ziro_message_log)
- Avg response time: time from lead created_at to first outbound message
- Revenue: `SUM(weekly_rate_cents * 4)` from enrollments (monthly approximation)
- Per-client breakdown for multi-client view

**FILE:** `10-reporting/reporting.jsx`

---

### 7-F: Wire Command Center metrics `[AGENT]`
**WHAT:** Edit `00-command-center/command-center.jsx`. Replace hardcoded/seed numbers with real Supabase queries for the KPI cards at the top (active leads, enrollments this month, open escalations, response rate).

**FILE:** `00-command-center/command-center.jsx`

---

# PHASE 8: Reporting + Handoff
**Dependency:** Phase 7 complete.
**Purpose:** Prove ROI to school owners. Hand off students cleanly.

---

### 8-A: Build monthly client report generator `[AGENT]` — ✅ DONE (monthly-report deployed; generate-monthly-reports cron active, 1st of month 6am)
**WHAT:** Create `99-agents/supabase/functions/monthly-report/index.ts`
- Triggered by pg_cron on the 1st of each month
- For each active tenant: query leads, enrollments, message counts, response time
- Generate a structured report object → insert into `client_reports` table
- Optionally: format as a readable SMS or email summary sent to the school owner

---

### 8-B: Build enrollment handoff notification `[AGENT]`
**WHAT:** When `enrollments.stage` changes to `enrolled`, fire a notification:
- SMS to school owner's studio_phone: "New student enrolled: [name], [instrument], [slot]. Ready to start [date]. Registration complete."
- Insert into `client_reports` as an enrollment event
- Mark lead as `stage = 'enrolled'` in leads table

---

### 8-C: Client-facing report page (future) `[HOLD]`
A simple URL where school owners can see their stats without logging into the CRM. Not needed for Phase 1 — Zach can share reports manually. Build this when there are 3+ clients.

---

# What Zach Does vs What Agent Does

## Zach Only (manual actions — cannot be automated)
- Revoke exposed Anthropic API key, generate new one
- Set all Edge Function secrets in Supabase dashboard (Step 0-F)
- Run SQL migrations in Supabase SQL editor (Steps 0-A through 0-G, 5-A)
- Enable pg_cron extension in Supabase dashboard (Step 1-C)
- Configure OpenPhone inbound webhook (Step 2-B)
- Flip SMS_ENABLED = true after smoke tests pass (Step 2-E)
- Get OpenPhone number ID and API key from OpenPhone dashboard
- Make URL structure decision (Step 6-A)

## Agent Does (code + files)
- All SQL migration files (017, 018, 019, 020)
- Fix process-pending auth (Step 1-A)
- Deploy Edge Functions via CLI (Steps 1-B, 2-C, 4-C, 5-D)
- Build `on-reply` Edge Function (Step 2-A)
- Build `send-followup` Edge Function (Step 5-B)
- Build and expand `intake-form` Edge Function (Steps 4-A, 6-B)
- Fix onboarding wizard (Steps 3-B, 3-C, 3-D, 3-E)
- Wire all CRM pages to real data (Steps 7-A through 7-F)
- Build monthly report generator (Step 8-A)
- Build enrollment handoff notification (Step 8-B)

## Parallelization Map (which agents can run simultaneously)

**Phase 0:** 0-A, 0-B, 0-C in parallel → then 0-D, 0-E, 0-F, 0-G sequential
**Phase 1:** 1-A and 1-B in parallel → then 1-C, 1-D
**Phases 3, 4, 7:** All can run in parallel with each other once Phase 0 is done
**Phase 2:** Must wait for Phase 1 smoke test
**Phase 5:** Must wait for Phase 2
**Phase 6:** Must wait for Phase 4
**Phase 8:** Must wait for Phase 7

**Maximum parallel agents at any time:** 4-6 (one per CRM page, one per Edge Function)
**Files that can never be touched by two agents at once:** `_shared/score-and-send.ts`, `index.html`, `90-shell/Router.jsx`

---

# Definition of Done

ZiroWork is live and ready for Adkins when:
- [ ] Test lead fires SMS to TEST_PHONE within 60 seconds
- [ ] Reply to that SMS gets a contextual response within 30 seconds
- [ ] Lead appears in CRM Leads page with correct stage and UTM source
- [ ] Conversation appears in CRM Conversations page with full thread
- [ ] Follow-up fires 48 hours later if no reply
- [ ] Onboarding wizard can configure a second school without any agent help
- [ ] SMS_ENABLED = true
- [ ] Adkins landing page is live at a real URL and form submission works end-to-end
