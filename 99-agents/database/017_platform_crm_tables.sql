-- =============================================================
-- 017: Platform CRM Tables
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- Creates all tables referenced by the CRM views and agent code
-- that are missing from PLATFORM_MIGRATIONS_COMBINED.sql
-- =============================================================
--
-- WHAT ALREADY EXISTS (do not recreate):
--   agent_tenants              001
--   ziro_events                001
--   ziro_messaging_knowledge_base  004
--   ziro_messaging_escalations     004
--   ziro_message_log           004
--   anchor_job_locks           007
--   system_health              007
--   ziro_client_context_cache  009
--   ziro_retention_risk_log    010
--   privacy_violation_log      015
--   pending_leads              NEW (in combined file)
--   agent_tenants.config       016 (ALTER ADD COLUMN)
--
-- WHAT IS MISSING (this file creates):
--   clients
--   leads               (platform CRM version — score-and-send.ts inserts here)
--   conversations
--   bookings
--   enrollments
--   campaigns
--   client_pages
--   automation_rules
--   assets
--   integrations
--   client_reports
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- clients — music school accounts ZiroWork manages
-- Referenced by: seed_adkins_client.sql, CRM clients page,
--   FK target for leads/campaigns/conversations/bookings/enrollments/client_reports
-- ─────────────────────────────────────────────────────────────

create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  city             text,
  state            text,
  status           text not null default 'onboarding',     -- 'live' | 'onboarding' | 'churned'
  health           text,                                    -- 'healthy' | 'at_risk' | 'stuck' | null
  plan             text,                                    -- 'individual' | 'agency' etc.
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  leads_30d        integer not null default 0,
  trials_30d       integer not null default 0,
  enrollments_30d  integer not null default 0,
  mrr_cents        integer not null default 0,
  active_campaigns integer not null default 0,
  open_escalations integer not null default 0,
  sms_number       text,
  lead_form_webhook text,
  protected_slots  boolean not null default false,
  brand_assets     boolean not null default false,
  automation_rules boolean not null default false,
  integrations     boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists idx_clients_status on public.clients (status);

alter table public.clients enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'clients' and policyname = 'service_role_clients'
  ) then
    create policy "service_role_clients" on public.clients using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- leads — platform CRM version
-- score-and-send.ts inserts: client_id, student_name, parent_name,
--   program, stage, source, phone, email, notes, priority, created_at
-- ─────────────────────────────────────────────────────────────

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references public.clients (id) on delete cascade,
  client_name      text,
  campaign_id      uuid,                                   -- FK added after campaigns table below
  student_name     text not null default '',
  parent_name      text,
  program          text,
  stage            text not null default 'new',            -- 'new' | 'contacted' | 'qualified' | 'follow_up' | 'booked' | 'enrolled' | 'lost'
  source           text not null default 'webhook',        -- 'webhook' | 'manual' | 'import'
  phone            text,
  email            text,
  notes            text,
  priority         text,                                   -- 'HIGH_PRIORITY' | 'HOT_LEAD' | 'CONFIDENT_CLOSE' | 'SENSITIVE' | 'STANDARD'
  days_in_stage    integer not null default 0,
  stage_entered_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists idx_leads_client_id  on public.leads (client_id);
create index if not exists idx_leads_stage      on public.leads (stage);
create index if not exists idx_leads_created_at on public.leads (created_at desc);

alter table public.leads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'leads' and policyname = 'service_role_leads'
  ) then
    create policy "service_role_leads" on public.leads using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- campaigns — per-client, per-program ad campaigns
-- ─────────────────────────────────────────────────────────────

create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.clients (id) on delete cascade,
  client_name   text,
  program       text not null,
  status        text not null default 'draft',             -- 'active' | 'draft' | 'paused'
  leads         integer not null default 0,
  trials        integer not null default 0,
  enrolled      integer not null default 0,
  landing_page  text not null default 'draft',             -- 'live' | 'draft'
  created_at    timestamptz not null default now()
);

create index if not exists idx_campaigns_client_id on public.campaigns (client_id);
create index if not exists idx_campaigns_status    on public.campaigns (status);

alter table public.campaigns enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'campaigns' and policyname = 'service_role_campaigns'
  ) then
    create policy "service_role_campaigns" on public.campaigns using (true) with check (true);
  end if;
end $$;

-- Now wire the deferred FK from leads → campaigns
alter table public.leads
  add constraint fk_leads_campaign_id
  foreign key (campaign_id) references public.campaigns (id) on delete set null
  not valid;  -- not valid = skips row scan on existing data, validated lazily


-- ─────────────────────────────────────────────────────────────
-- conversations — SMS/email thread per lead
-- ─────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references public.leads (id) on delete cascade,
  client_id     uuid references public.clients (id) on delete cascade,
  client_name   text,
  parent_name   text,
  program       text,
  status        text not null default 'active',            -- 'active' | 'escalated' | 'closed'
  ai_handled    boolean not null default true,
  message_count integer not null default 0,
  last_message  text,
  last_at       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_conversations_client_id on public.conversations (client_id);
create index if not exists idx_conversations_lead_id   on public.conversations (lead_id);
create index if not exists idx_conversations_status    on public.conversations (status);

alter table public.conversations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversations' and policyname = 'service_role_conversations'
  ) then
    create policy "service_role_conversations" on public.conversations using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- bookings — trial/enrollment slots ZiroWork scheduled
-- ─────────────────────────────────────────────────────────────

create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references public.leads (id) on delete set null,
  client_id    uuid references public.clients (id) on delete cascade,
  client_name  text,
  parent_name  text,
  student_name text,
  program      text,
  booking_type text not null default 'enrollment',         -- 'trial' | 'enrollment'
  slot_id      uuid,
  status       text not null default 'requested',          -- 'scheduled' | 'requested' | 'completed' | 'cancelled'
  date         date,
  time         text,
  teacher      text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_bookings_client_id on public.bookings (client_id);
create index if not exists idx_bookings_lead_id   on public.bookings (lead_id);
create index if not exists idx_bookings_status    on public.bookings (status);

alter table public.bookings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'bookings' and policyname = 'service_role_bookings'
  ) then
    create policy "service_role_bookings" on public.bookings using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- enrollments — final outcome records (ZiroWork proof of delivery)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.enrollments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid references public.bookings (id) on delete set null,
  lead_id             uuid references public.leads (id) on delete set null,
  client_id           uuid references public.clients (id) on delete cascade,
  client_name         text,
  parent_name         text,
  student_name        text,
  program             text,
  outcome             text not null default 'follow_up',   -- 'enrolled' | 'follow_up' | 'lost'
  weekly_rate_cents   integer,
  enrolled_at         date,
  created_at          timestamptz not null default now()
);

create index if not exists idx_enrollments_client_id  on public.enrollments (client_id);
create index if not exists idx_enrollments_lead_id    on public.enrollments (lead_id);
create index if not exists idx_enrollments_outcome    on public.enrollments (outcome);

alter table public.enrollments enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'enrollments' and policyname = 'service_role_enrollments'
  ) then
    create policy "service_role_enrollments" on public.enrollments using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- client_pages — landing pages ZiroWork builds per school + instrument
-- Canonical landing-page table. Written by onboarding (onboard-form.jsx),
-- read by the operator Pages view (use-pages.js) and the public student
-- landing pages (schools/app.jsx). One row per school slug + instrument.
-- (Replaces the old `pages` table — dropped in 021_drop_orphan_pages.sql.)
-- ─────────────────────────────────────────────────────────────

-- Column set mirrors the live table exactly (pulled from information_schema
-- 2026-06-09) so a fresh rebuild matches production.
create table if not exists public.client_pages (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  instrument     text not null,                            -- 'piano' | 'guitar' | 'vocals' | 'drums'
  slug           text not null,
  is_active      boolean not null default true,
  hero_photo_url text,
  teacher_index  integer not null default 0,
  custom_headline text,
  custom_offer   text,
  status         text default 'live',                      -- 'live' | 'draft' | 'archived'
  school_name    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_client_pages_client_id on public.client_pages (client_id);
create index if not exists idx_client_pages_slug      on public.client_pages (slug);

alter table public.client_pages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'client_pages' and policyname = 'service_role_client_pages'
  ) then
    create policy "service_role_client_pages" on public.client_pages using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- automation_rules — per-client trigger/action rules
-- ─────────────────────────────────────────────────────────────

create table if not exists public.automation_rules (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients (id) on delete cascade,
  client_name text,
  name        text not null,
  trigger     text not null,                               -- e.g. 'new_lead' | 'no_reply_24h' | 'trial_completed'
  action      text not null,                               -- e.g. 'send_sms' | 'escalate' | 'mark_lost'
  status      text not null default 'active',              -- 'active' | 'paused' | 'draft'
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_automation_rules_client_id on public.automation_rules (client_id);
create index if not exists idx_automation_rules_status    on public.automation_rules (status);

alter table public.automation_rules enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'automation_rules' and policyname = 'service_role_automation_rules'
  ) then
    create policy "service_role_automation_rules" on public.automation_rules using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- assets — brand assets per client (logos, images, docs)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients (id) on delete cascade,
  client_name text,
  name        text not null,
  type        text not null,                               -- 'logo' | 'image' | 'document' | 'script'
  url         text,
  status      text not null default 'active',              -- 'active' | 'archived'
  created_at  timestamptz not null default now()
);

create index if not exists idx_assets_client_id on public.assets (client_id);
create index if not exists idx_assets_type      on public.assets (type);

alter table public.assets enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'assets' and policyname = 'service_role_assets'
  ) then
    create policy "service_role_assets" on public.assets using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- integrations — per-client external service connections
-- ─────────────────────────────────────────────────────────────

create table if not exists public.integrations (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients (id) on delete cascade,
  client_name text,
  service     text not null,                               -- 'openphone' | 'square' | 'google_ads' | 'facebook_ads'
  status      text not null default 'disconnected',        -- 'connected' | 'disconnected' | 'error'
  config      jsonb not null default '{}',                 -- service-specific credentials/settings (encrypted at app layer)
  connected_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_integrations_client_id on public.integrations (client_id);
create index if not exists idx_integrations_service   on public.integrations (service);
create index if not exists idx_integrations_status    on public.integrations (status);

alter table public.integrations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'integrations' and policyname = 'service_role_integrations'
  ) then
    create policy "service_role_integrations" on public.integrations using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- client_reports — monthly performance snapshots
-- ─────────────────────────────────────────────────────────────

create table if not exists public.client_reports (
  id                       uuid primary key default gen_random_uuid(),
  client_id                uuid references public.clients (id) on delete cascade,
  period_start             date not null,
  period_end               date not null,
  leads                    integer not null default 0,
  enrolled                 integer not null default 0,
  revenue_generated_cents  integer not null default 0,
  avg_response_time_seconds integer not null default 0,
  created_at               timestamptz not null default now()
);

create index if not exists idx_client_reports_client_id    on public.client_reports (client_id);
create index if not exists idx_client_reports_period_start on public.client_reports (period_start desc);

alter table public.client_reports enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'client_reports' and policyname = 'service_role_client_reports'
  ) then
    create policy "service_role_client_reports" on public.client_reports using (true) with check (true);
  end if;
end $$;


-- =============================================================
-- DONE. Tables created by this migration:
--   clients           — music school accounts ZiroWork manages
--   leads             — platform CRM leads (score-and-send.ts writes here)
--   campaigns         — per-client ad campaigns
--   conversations     — SMS/email thread per lead
--   bookings          — trial/enrollment slots
--   enrollments       — final outcome records
--   client_pages      — landing page records (per school + instrument)
--   automation_rules  — trigger/action rules per client
--   assets            — brand assets per client
--   integrations      — external service connections per client
--   client_reports    — monthly performance snapshots
-- =============================================================
