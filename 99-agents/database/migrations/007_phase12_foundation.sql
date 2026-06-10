-- Migration: 007_phase12_foundation.sql
-- Run against PLATFORM DB only.
-- Adds intake API key system, integration
-- toggles, distributed job locks, and
-- system health tracking.

-- Intake API key for external integrations
ALTER TABLE public.agent_tenants
ADD COLUMN IF NOT EXISTS intake_api_key
  text unique;

-- Which integrations are active per tenant
ALTER TABLE public.agent_tenants
ADD COLUMN IF NOT EXISTS integrations_enabled
  jsonb not null default '{
    "square": false,
    "website_form": false,
    "openphone": false
  }'::jsonb;

-- Distributed lock table for ANCHOR jobs
-- Prevents double-firing when multiple
-- server instances are running
CREATE TABLE IF NOT EXISTS
public.anchor_job_locks (
  job_id      text primary key,
  acquired_at timestamptz not null
                default now(),
  expires_at  timestamptz not null
);

-- Auto-cleanup expired locks
CREATE INDEX IF NOT EXISTS
  idx_anchor_locks_expires
  ON public.anchor_job_locks (expires_at);

-- System health tracking for all components
CREATE TABLE IF NOT EXISTS
public.system_health (
  id           uuid primary key
               default uuid_generate_v4(),
  component    text not null,
  status       text not null
               default 'healthy',
  metrics      jsonb,
  checked_at   timestamptz not null
               default now()
);

CREATE INDEX IF NOT EXISTS
  idx_system_health_component
  ON public.system_health (component);

CREATE INDEX IF NOT EXISTS
  idx_system_health_checked_at
  ON public.system_health (checked_at desc);

COMMENT ON COLUMN
  public.agent_tenants.intake_api_key IS
  'Publicly shareable key for ZIRO_PULSE intake
   endpoints. Tenants paste into Square,
   website forms, OpenPhone. Rotate via
   ZiroWork settings. Never grants DB access.';

COMMENT ON TABLE public.anchor_job_locks IS
  'Distributed lock table. ANCHOR jobs claim
   a lock before running. Prevents double-
   firing when multiple server workers exist.
   Locks expire after 1 hour automatically.';
