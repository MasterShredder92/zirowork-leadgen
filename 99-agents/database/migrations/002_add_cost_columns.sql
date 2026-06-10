-- Migration: 002_add_cost_columns.sql
-- Adds duration_ms, tokens_used, and error_message
-- to the ziro_events table on the platform DB.
-- Run once against the ZiroWork platform Supabase project.

ALTER TABLE public.ziro_events
ADD COLUMN IF NOT EXISTS duration_ms bigint;

ALTER TABLE public.ziro_events
ADD COLUMN IF NOT EXISTS tokens_used integer;

ALTER TABLE public.ziro_events
ADD COLUMN IF NOT EXISTS error_message text;

COMMENT ON COLUMN public.ziro_events.duration_ms IS
'Agent run time in milliseconds. Used to calculate
cost per task based on agent hourly rate.';

COMMENT ON COLUMN public.ziro_events.tokens_used IS
'Claude API tokens consumed per agent run.';

COMMENT ON COLUMN public.ziro_events.error_message IS
'Error detail when status = failed. Empty otherwise.';
