-- ============================================================
-- Adkins Music Lessons — Agent Tenant Seed
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- Fill in the 3 PLACEHOLDER values before running
-- ============================================================

insert into public.agent_tenants (
  tenant_id,
  name,
  supabase_url,
  supabase_service_key,
  plan_tier,
  status,
  config
) values (
  gen_random_uuid(),
  'Adkins Music Lessons',
  'ADKINS_SUPABASE_URL',        -- e.g. https://abcxyzabc.supabase.co
  'ADKINS_SERVICE_ROLE_KEY',    -- Settings → API → service_role key
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
on conflict do nothing
returning tenant_id, name;

-- IMPORTANT: Copy the tenant_id UUID from the result above.
-- The webhook URL for Adkins will be:
--   https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/{tenant_id}
