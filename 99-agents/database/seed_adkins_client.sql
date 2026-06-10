-- ============================================================
-- Adkins Music Lessons — CRM Client Row
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- Run AFTER seed_adkins_tenant.sql
-- ============================================================

insert into public.clients (
  name,
  city,
  state,
  status,
  health,
  plan,
  contact_name,
  contact_email,
  contact_phone,
  leads_30d,
  enrollments_30d,
  mrr_cents,
  open_escalations,
  created_at
) values (
  'Adkins Music Lessons',
  'Omaha',
  'NE',
  'active',
  'healthy',
  'individual',
  'Zach Adkins',
  'slavior1992@gmail.com',
  null,    -- fill in Adkins studio phone if available
  0,
  0,
  16000,   -- $160/mo base MRR (updates as students enroll)
  0,
  now()
)
on conflict do nothing
returning id, name;

-- The returned id is the client_id used in campaigns, leads, etc.
