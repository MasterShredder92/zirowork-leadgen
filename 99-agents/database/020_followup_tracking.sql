-- Phase 5-A: Follow-up sequence tracking columns on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_paused boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opted_out boolean NOT NULL DEFAULT false;
