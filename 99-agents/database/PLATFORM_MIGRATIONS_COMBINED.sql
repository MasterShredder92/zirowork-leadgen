-- =============================================================
-- ZIROWORK PLATFORM DB — COMBINED MIGRATIONS
-- Run this entire file once in the Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste → Run
-- Project: txpgyuetfsrzfxxopwzf
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 001: Tenant registry + ziro_events audit log
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

create table if not exists public.agent_tenants (
    id                    uuid primary key default uuid_generate_v4(),
    tenant_id             uuid unique not null,
    name                  text not null,
    supabase_url          text not null,
    supabase_service_key  text not null,
    plan_tier             text not null default 'individual',
    status                text not null default 'active',
    created_at            timestamptz default now() not null,
    updated_at            timestamptz default now() not null
);

create index if not exists idx_agent_tenants_tenant_id on public.agent_tenants (tenant_id);
create index if not exists idx_agent_tenants_status on public.agent_tenants (status);

create table if not exists public.ziro_events (
    id             uuid primary key default uuid_generate_v4(),
    event_id       text not null,
    tenant_id      text not null default '',
    event_type     text not null,
    agent_assigned text not null,
    input_summary  text,
    output_summary text,
    status         text not null,
    created_at     timestamptz default now() not null
);

create index if not exists idx_ziro_events_tenant_id on public.ziro_events (tenant_id);
create index if not exists idx_ziro_events_event_type on public.ziro_events (event_type);
create index if not exists idx_ziro_events_created_at on public.ziro_events (created_at desc);

alter table public.agent_tenants enable row level security;
alter table public.ziro_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'agent_tenants' and policyname = 'service_role_agent_tenants'
  ) then
    create policy "service_role_agent_tenants" on public.agent_tenants using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ziro_events' and policyname = 'service_role_ziro_events'
  ) then
    create policy "service_role_ziro_events" on public.ziro_events using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 002: Add cost tracking columns to ziro_events
-- ─────────────────────────────────────────────────────────────

alter table public.ziro_events add column if not exists duration_ms   bigint;
alter table public.ziro_events add column if not exists tokens_used   integer;
alter table public.ziro_events add column if not exists error_message text;


-- ─────────────────────────────────────────────────────────────
-- 004: ZIRO_MESSAGING support tables
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ziro_messaging_knowledge_base (
  id                  uuid primary key default uuid_generate_v4(),
  framework_id        text unique not null,
  category            text not null,
  trigger_conditions  jsonb not null default '[]',
  template            text not null,
  variables           jsonb not null default '[]',
  banned_phrases      jsonb not null default '[]',
  required_elements   jsonb not null default '[]',
  branch_logic        jsonb,
  priority            integer not null default 0,
  is_active           boolean not null default true,
  version             integer not null default 1,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index if not exists idx_rkb_framework_id on public.ziro_messaging_knowledge_base (framework_id);
create index if not exists idx_rkb_category on public.ziro_messaging_knowledge_base (category);

create table if not exists public.ziro_messaging_escalations (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        text not null,
  conversation_id  text,
  contact_phone    text,
  contact_email    text,
  contact_name     text,
  trigger_reason   text not null,
  original_message text,
  ziro_response    text,
  agent_context    jsonb,
  status           text not null default 'pending',
  resolved_by      text,
  resolved_at      timestamptz,
  created_at       timestamptz default now() not null
);

create index if not exists idx_re_tenant_id  on public.ziro_messaging_escalations (tenant_id);
create index if not exists idx_re_status     on public.ziro_messaging_escalations (status);
create index if not exists idx_re_created_at on public.ziro_messaging_escalations (created_at desc);

create table if not exists public.ziro_message_log (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        text not null,
  event_id         text,
  from_agent       text not null,
  channel          text not null,
  direction        text not null default 'outbound',
  recipient_phone  text,
  recipient_email  text,
  recipient_name   text,
  location_id      text,
  framework_used   text,
  message_body     text not null,
  subject          text,
  status           text not null default 'pending',
  sent_at          timestamptz,
  error_message    text,
  sms_enabled      boolean not null default false,
  requires_approval boolean not null default true,
  approved_by      text,
  approved_at      timestamptz,
  created_at       timestamptz default now() not null
);

create index if not exists idx_rml_tenant_id         on public.ziro_message_log (tenant_id);
create index if not exists idx_rml_status            on public.ziro_message_log (status);
create index if not exists idx_rml_created_at        on public.ziro_message_log (created_at desc);
create index if not exists idx_rml_requires_approval on public.ziro_message_log (requires_approval) where requires_approval = true;


-- ─────────────────────────────────────────────────────────────
-- 006: Add retry_count to ziro_message_log
-- ─────────────────────────────────────────────────────────────

alter table public.ziro_message_log add column if not exists retry_count integer not null default 0;


-- ─────────────────────────────────────────────────────────────
-- 007: Intake API keys, integration toggles, job locks, health
-- ─────────────────────────────────────────────────────────────

alter table public.agent_tenants add column if not exists intake_api_key       text unique;
alter table public.agent_tenants add column if not exists integrations_enabled jsonb not null default '{"square":false,"website_form":false,"openphone":false}'::jsonb;

create table if not exists public.anchor_job_locks (
  job_id      text primary key,
  acquired_at timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists idx_anchor_locks_expires on public.anchor_job_locks (expires_at);

create table if not exists public.system_health (
  id         uuid primary key default uuid_generate_v4(),
  component  text not null,
  status     text not null default 'healthy',
  metrics    jsonb,
  checked_at timestamptz not null default now()
);

create index if not exists idx_system_health_component  on public.system_health (component);
create index if not exists idx_system_health_checked_at on public.system_health (checked_at desc);


-- ─────────────────────────────────────────────────────────────
-- 009: ZIRO_CLIENT context cache
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ziro_client_context_cache (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null,
  tenant_id      uuid not null,
  context_json   jsonb not null,
  built_at       timestamptz default now(),
  invalidated_at timestamptz,
  unique(student_id, tenant_id)
);

create index if not exists idx_ziro_client_cache_student_tenant on public.ziro_client_context_cache (student_id, tenant_id);
create index if not exists idx_ziro_client_cache_invalidated    on public.ziro_client_context_cache (invalidated_at) where invalidated_at is not null;

alter table public.ziro_client_context_cache enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ziro_client_context_cache' and policyname = 'service_role_client_cache'
  ) then
    create policy "service_role_client_cache" on public.ziro_client_context_cache using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 010: ZIRO_RETENTION risk log
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ziro_retention_risk_log (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null,
  tenant_id         uuid not null,
  risk_stage        integer not null default 1,
  churn_signals     jsonb not null default '[]',
  stage_entered_at  timestamptz default now(),
  next_check_after  timestamptz not null,
  resolved_at       timestamptz,
  resolution_reason text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(student_id, tenant_id, resolved_at)
);

create index if not exists idx_ziro_retention_risk_student on public.ziro_retention_risk_log (student_id, tenant_id);
create index if not exists idx_ziro_retention_risk_active  on public.ziro_retention_risk_log (next_check_after) where resolved_at is null;
create index if not exists idx_ziro_retention_risk_stage   on public.ziro_retention_risk_log (risk_stage) where resolved_at is null;

alter table public.ziro_retention_risk_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ziro_retention_risk_log' and policyname = 'service_role_retention'
  ) then
    create policy "service_role_retention" on public.ziro_retention_risk_log using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 015: ZIRO_STAFF privacy violation audit log
-- ─────────────────────────────────────────────────────────────

create table if not exists public.privacy_violation_log (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null,
  teacher_id       uuid not null,
  teacher_name     text,
  student_id       uuid,
  student_name     text,
  requested_field  text not null,
  request_context  text,
  flagged_at       timestamptz default now(),
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  review_notes     text
);

create index if not exists idx_pvl_tenant_id  on public.privacy_violation_log (tenant_id);
create index if not exists idx_pvl_teacher_id on public.privacy_violation_log (teacher_id);
create index if not exists idx_pvl_unreviewed on public.privacy_violation_log (flagged_at) where reviewed_at is null;

alter table public.privacy_violation_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'privacy_violation_log' and policyname = 'service_role_privacy_log'
  ) then
    create policy "service_role_privacy_log" on public.privacy_violation_log using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- NEW: pending_leads — time-gate queue (no 2 AM texts)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.pending_leads (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null,
  lead_id      text not null,
  lead_data    jsonb not null,
  send_at      timestamptz not null,
  attempts     integer not null default 0,
  last_error   text,
  processed_at timestamptz,
  created_at   timestamptz default now() not null
);

create index if not exists idx_pending_leads_send_at    on public.pending_leads (send_at) where processed_at is null;
create index if not exists idx_pending_leads_tenant     on public.pending_leads (tenant_id) where processed_at is null;

alter table public.pending_leads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'pending_leads' and policyname = 'service_role_pending_leads'
  ) then
    create policy "service_role_pending_leads" on public.pending_leads using (true) with check (true);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 016: Per-tenant messaging config (for Edge Functions)
-- Stores director_name, location_name, prices, etc. per client
-- ─────────────────────────────────────────────────────────────

alter table public.agent_tenants add column if not exists config jsonb not null default '{}';

-- Example seed for a tenant (run manually after adding the row to agent_tenants):
-- update public.agent_tenants
-- set config = '{
--   "director_name": "Andrea",
--   "director_title": "Area Director",
--   "location_name": "Adkins Music Lessons",
--   "registration_link": "https://example.com/register",
--   "monthly_price_standard": 160,
--   "monthly_price_military": 140
-- }'::jsonb
-- where tenant_id = '<your-tenant-uuid>';


-- =============================================================
-- DONE. Tables created:
--   agent_tenants          — client credential registry
--   ziro_events            — agent run audit log
--   ziro_messaging_kb      — response framework library
--   ziro_messaging_escals  — human takeover flags
--   ziro_message_log       — every SMS/email send attempt
--   anchor_job_locks       — distributed job lock
--   system_health          — component health tracking
--   ziro_client_ctx_cache  — student context for tone
--   ziro_retention_risk_log — churn risk staging
--   privacy_violation_log  — teacher privacy audit
--   pending_leads          — off-hours lead queue (9AM gate)
-- =============================================================
