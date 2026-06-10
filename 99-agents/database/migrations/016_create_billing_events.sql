-- Migration: 016_create_billing_events.sql
-- Target: Platform DB (txpgyuetfsrzfxxopwzf)
-- Purpose: ZiroWork billing — Stripe card-on-file + per-enrollment charge events

CREATE TABLE IF NOT EXISTS billing_events (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL,
  type                      TEXT        NOT NULL,
    -- e.g. 'enrollment_charge'
  amount_cents              INT         NOT NULL,
  currency                  TEXT        DEFAULT 'usd',
  stripe_payment_intent_id  TEXT,
  status                    TEXT        NOT NULL,
    -- 'succeeded' | 'failed' | 'pending' | 'skipped'
  description               TEXT,
  enrollment_id             UUID,
  created_at                TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_tenant_id
  ON billing_events(tenant_id);

-- Card-on-file + per-enrollment fee live on the tenant row
ALTER TABLE agent_tenants ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE agent_tenants ADD COLUMN IF NOT EXISTS stripe_default_pm text;
ALTER TABLE agent_tenants ADD COLUMN IF NOT EXISTS per_enrollment_fee_cents int;
