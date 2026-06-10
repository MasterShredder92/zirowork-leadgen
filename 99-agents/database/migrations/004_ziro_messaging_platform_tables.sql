-- Migration: 004_ziro_messaging_platform_tables.sql
-- Creates ZIRO_MESSAGING support tables on the PLATFORM DB.
-- Run once against the ZiroWork platform Supabase.
-- NOT the tenant DB.

create extension if not exists "uuid-ossp";

-- ZIRO_MESSAGING knowledge base: stores all 12 response
-- frameworks and guardrail rules
create table if not exists public.ziro_messaging_knowledge_base (
  id            uuid primary key
                default uuid_generate_v4(),
  framework_id  text unique not null,
  category      text not null,
  trigger_conditions  jsonb not null default '[]',
  template      text not null,
  variables     jsonb not null default '[]',
  banned_phrases jsonb not null default '[]',
  required_elements jsonb not null default '[]',
  branch_logic  jsonb,
  priority      integer not null default 0,
  is_active     boolean not null default true,
  version       integer not null default 1,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create index if not exists
  idx_rkb_framework_id
  on public.ziro_messaging_knowledge_base (framework_id);

create index if not exists
  idx_rkb_category
  on public.ziro_messaging_knowledge_base (category);

-- ZIRO_MESSAGING escalations: flags conversations that
-- need human takeover
create table if not exists public.ziro_messaging_escalations (
  id              uuid primary key
                  default uuid_generate_v4(),
  tenant_id       text not null,
  conversation_id text,
  contact_phone   text,
  contact_email   text,
  contact_name    text,
  trigger_reason  text not null,
  original_message text,
  ziro_response  text,
  agent_context   jsonb,
  status          text not null default 'pending',
  resolved_by     text,
  resolved_at     timestamptz,
  created_at      timestamptz default now() not null
);

create index if not exists
  idx_re_tenant_id
  on public.ziro_messaging_escalations (tenant_id);

create index if not exists
  idx_re_status
  on public.ziro_messaging_escalations (status);

create index if not exists
  idx_re_created_at
  on public.ziro_messaging_escalations (created_at desc);

-- ZIRO_MESSAGING message log: records every send attempt
-- whether SMS or email
create table if not exists public.ziro_message_log (
  id              uuid primary key
                  default uuid_generate_v4(),
  tenant_id       text not null,
  event_id        text,
  from_agent      text not null,
  channel         text not null,
  direction       text not null default 'outbound',
  recipient_phone text,
  recipient_email text,
  recipient_name  text,
  location_id     text,
  framework_used  text,
  message_body    text not null,
  subject         text,
  status          text not null default 'pending',
  sent_at         timestamptz,
  error_message   text,
  sms_enabled     boolean not null default false,
  requires_approval boolean not null default true,
  approved_by     text,
  approved_at     timestamptz,
  created_at      timestamptz default now() not null
);

create index if not exists
  idx_rml_tenant_id
  on public.ziro_message_log (tenant_id);

create index if not exists
  idx_rml_status
  on public.ziro_message_log (status);

create index if not exists
  idx_rml_created_at
  on public.ziro_message_log (created_at desc);

create index if not exists
  idx_rml_requires_approval
  on public.ziro_message_log (requires_approval)
  where requires_approval = true;
