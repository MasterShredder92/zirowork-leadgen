# ZiroWork — Database Schema Reference

> **Generated from the live Supabase schema (project `txpgyuetfsrzfxxopwzf`) on 2026-06-09.**
> This is the **lead-gen / operator-CRM** schema — clients, leads, bookings, enrollments.
> (It is NOT a studio-management schema; there are no `students` / `teachers` / `lessons` tables.)
>
> To refresh after schema changes, query `information_schema.columns` via the
> Supabase Management API (see [[reference-supabase-live-access]]) and regenerate.

Types are simplified: `uuid`, `text`, `int`, `bigint`, `bool`, `jsonb`, `date`, `timestamptz`.
`*` marks NOT NULL. All tables use a single permissive RLS policy (`using (true)`) — anon
read/write is open in Phase 2.

---

## Operator CRM tables (13)

Read/written by the React CRM (`00–16` views) and the public surfaces (`schools/`, `dashboard/`, `onboard.html`).

### `clients` — music-school accounts ZiroWork manages
`id*` uuid · `name*` text · `city` text · `state` text · `status*` text (`live|onboarding|churned`) · `health` text · `leads_30d` int · `trials_30d` int · `enrollments_30d` int · `mrr_cents` int · `active_campaigns` int · `open_escalations` int · `sms_number` text · `lead_form_webhook` text · `protected_slots` bool · `brand_assets` bool · `automation_rules` bool · `integrations` bool · `slug` text · `plan` text · `contact_name` text · `contact_email` text · `contact_phone` text · `fb_pixel_id` text · `gtm_id` text · `hero_photo_url` text · `logo_url` text · `tagline` text · `offer` text · `testimonial` text · `teachers` jsonb · `instruments` jsonb · `program_prices` jsonb · `studio_phone` text · `website` text · `email` text · `area_code` text · `created_at` timestamptz

### `leads` — prospective students captured from landing pages / webhooks
`id*` uuid · `client_id` uuid → clients · `client_name` text · `campaign_id` uuid · `parent_name` text · `student_name` text · `program` text · `stage*` text (`new|contacted|qualified|follow_up|booked|enrolled|lost`) · `phone` text · `email` text · `notes` text · `priority` text · `source` text · `utm` jsonb · `page_url` text · `age` int · `days_in_stage` int · `stage_entered_at` timestamptz · `last_contact_at` timestamptz · `followup_count*` int · `followup_paused*` bool · `opted_out*` bool · `created_at` timestamptz

### `campaigns` — per-client ad campaigns
`id*` uuid · `client_id` uuid → clients · `client_name` text · `program*` text · `status*` text · `leads` int · `trials` int · `enrolled` int · `landing_page` text · `created_at` timestamptz

### `conversations` — SMS/email thread summary per lead
`id*` uuid · `lead_id` uuid · `client_id` uuid · `client_name` text · `parent_name` text · `program` text · `status*` text · `ai_handled` bool · `message_count` int · `last_message` text · `last_at` text · `created_at` timestamptz

### `bookings` — trial/enrollment time slots offered to a lead
`id*` uuid · `lead_id` uuid · `client_name` text · `parent_name` text · `student_name` text · `program` text · `booking_type` text · `slot_id` uuid · `status*` text · `date` date · `time` text · `teacher` text · `confirmation_token` text · `confirmed_at` timestamptz · `created_at` timestamptz

### `enrollments` — final outcome record + handoff to the school
`id*` uuid · `booking_id` uuid · `lead_id` uuid · `client_id` uuid · `client_name` text · `parent_name` text · `student_name` text · `program` text · `outcome*` text · `weekly_rate_cents` int · `enrolled_at` date · `handed_off_at` timestamptz · `created_at` timestamptz

### `escalations` — leads/conversations flagged for human attention
`id*` uuid · `lead_id` uuid · `conversation_id` uuid · `client_id` uuid · `client_name` text · `parent_name` text · `severity*` text · `status*` text · `reason` text · `created_at` timestamptz

### `operator_tasks` — internal to-dos per client
`id*` uuid · `client_id` uuid · `title*` text · `type` text · `status*` text · `due_date` date · `created_at` timestamptz

### `client_reports` — monthly performance snapshots
`id*` uuid · `client_id` uuid · `period_start*` date · `period_end*` date · `leads` int · `enrolled` int · `revenue_generated_cents` int · `avg_response_time_seconds` int · `created_at` timestamptz

### `automation_rules` — trigger/action rules per client
`id*` text · `name` text · `trigger` text · `action` text · `mode` text · `status` text · `created_at` timestamptz

### `assets` — brand assets per client
`id*` text · `client_id` text · `client_name` text · `type` text · `name` text · `status` text · `created_at` timestamptz

### `integrations` — external service connections per client
`id*` text · `client_id` text · `client_name` text · `type` text · `detail` text · `status` text · `created_at` timestamptz

### `client_pages` — landing pages ZiroWork builds (one per school slug + instrument)
Canonical landing-page table. Written by `onboard-form.jsx`; read by `use-pages.js` (operator) and `schools/app.jsx` (public). (Replaced the old orphan `pages` table, dropped in `021`.)
`id*` uuid · `client_id*` uuid → clients · `instrument*` text · `slug*` text · `is_active*` bool · `hero_photo_url` text · `teacher_index*` int · `custom_headline` text · `custom_offer` text · `status` text · `school_name` text · `created_at*` timestamptz · `updated_at*` timestamptz

---

## Platform / agent-backend tables (13)

Used by the `99-agents/` edge functions and the client portal. Created by the `99-agents/database/` migrations.

### `agent_tenants` — per-tenant agent config (one per client)
`id*` uuid · `tenant_id*` uuid · `name*` text · `supabase_url` text · `supabase_service_key` text · `plan_tier*` text · `status*` text · `intake_api_key` text · `integrations_enabled*` jsonb · `config*` jsonb · `created_at*` timestamptz · `updated_at*` timestamptz

### `client_users` — links a portal auth user to its tenant (dashboard login)
`user_id*` uuid → auth.users · `tenant_id*` text · `created_at` timestamptz

### `client_uploads` — files the school uploads in the portal
`id*` uuid · `tenant_id*` text · `user_id` uuid · `file_name*` text · `file_path*` text · `description` text · `created_at` timestamptz

### `pending_leads` — off-hours leads queued for 9 AM Eastern send
`id*` uuid · `tenant_id*` text · `lead_id*` text · `lead_data*` jsonb · `send_at*` timestamptz · `attempts*` int · `last_error` text · `processed_at` timestamptz · `created_at*` timestamptz

### `ziro_events` — agent activity / audit log
`id*` uuid · `event_id*` text · `tenant_id*` text · `event_type*` text · `agent_assigned*` text · `input_summary` text · `output_summary` text · `status*` text · `duration_ms` bigint · `tokens_used` int · `error_message` text · `created_at*` timestamptz

### `ziro_message_log` — every SMS/email the agent sends or receives
`id*` uuid · `tenant_id*` text · `event_id` text · `from_agent*` text · `channel*` text · `direction*` text · `recipient_phone` text · `recipient_email` text · `recipient_name` text · `location_id` text · `framework_used` text · `message_body*` text · `subject` text · `status*` text · `sent_at` timestamptz · `error_message` text · `sms_enabled*` bool · `requires_approval*` bool · `approved_by` text · `approved_at` timestamptz · `retry_count*` int · `created_at*` timestamptz

### `ziro_messaging_escalations` — conversations the agent escalated to a human
`id*` uuid · `tenant_id*` text · `conversation_id` text · `contact_phone` text · `contact_email` text · `contact_name` text · `trigger_reason*` text · `original_message` text · `ziro_response` text · `agent_context` jsonb · `status*` text · `resolved_by` text · `resolved_at` timestamptz · `created_at*` timestamptz

---

## Tables that exist but no code currently uses (orphan schema)

Present live, but no edge function or frontend reads/writes them. Either build the feature or drop them.

- **`ziro_messaging_knowledge_base`** — response frameworks (prompts are hardcoded instead).
- **`system_health`** — component health tracking (never written).
- **`anchor_job_locks`** — distributed job locks (never used; single-instance).
- **`ziro_client_context_cache`** — student context cache for an unbuilt agent.
- **`ziro_retention_risk_log`** — churn-risk staging for an unbuilt agent.
- **`privacy_violation_log`** — teacher-privacy audit for an unbuilt agent.

---

_26 tables total. If you add/alter a table, update this file in the same change — a stale schema doc is a defect._
