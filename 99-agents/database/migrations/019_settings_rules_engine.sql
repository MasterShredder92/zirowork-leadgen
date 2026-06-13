-- Migration: 019_settings_rules_engine.sql
-- Target: Platform DB (txpgyuetfsrzfxxopwzf). Applied live 2026-06-12 via Management API.
-- Purpose: Phase 3 — make the operator Settings + Automation Rules actually control the AI.

-- Per-tenant messaging settings (send window, follow-up cadence, escalation triggers) live as
-- keys in agent_tenants.config (jsonb) — NO DDL needed. _shared/settings.ts supplies code
-- defaults; agent_tenants.config overrides them. Keys: send_window_start_hour,
-- send_window_end_hour, send_window_tz, followup_day_offsets (int[]), max_followups,
-- escalation_triggers (text[]).

-- Automation rules become real via a stable `key` the edge functions gate on (the live
-- automation_rules table is global, prose triggers/actions, text id — display-only before now).
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS key text;

-- Tag the two actionable rules. Toggling their status now changes behavior:
--   new_lead_outreach paused → on-new-lead skips AI outreach (lead still synced to CRM)
--   followup_drip     paused → send-followup sends no drips this run
UPDATE public.automation_rules SET key = 'new_lead_outreach' WHERE id = 'r-1';
UPDATE public.automation_rules SET key = 'followup_drip'     WHERE id = 'r-2';
