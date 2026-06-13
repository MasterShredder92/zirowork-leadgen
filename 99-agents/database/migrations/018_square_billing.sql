-- Migration: 018_square_billing.sql
-- Target: Platform DB (txpgyuetfsrzfxxopwzf)
-- Purpose: Move billing from Stripe → Square card-on-file, and lock down billing data.
-- Applied live 2026-06-12 via Management API.

-- Square IDs live on the tenant row (opaque; the real card stays at Square).
ALTER TABLE public.agent_tenants ADD COLUMN IF NOT EXISTS square_customer_id text;
ALTER TABLE public.agent_tenants ADD COLUMN IF NOT EXISTS square_card_id text;

-- Record the Square payment id on each charge event.
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS square_payment_id text;

-- Lock billing history: RLS on, no anon/authenticated policy. Only the service role
-- (used by the `billing` edge function) can read/write. No client reads this table directly.
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- NOTE: per_enrollment_fee_cents + billing_events already exist from 016_create_billing_events.sql.
-- The legacy stripe_customer_id / stripe_default_pm columns are left in place but unused.
