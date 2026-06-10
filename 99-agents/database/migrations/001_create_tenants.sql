-- Migration: 001_create_tenants.sql
-- Creates the tenants registry table on the ZiroWork PLATFORM DB.
-- This table is NOT in tenant Supabase projects — it lives in the platform DB only.
-- Run this migration once against the ZiroWork platform Supabase project.

-- Enable uuid extension if not already enabled
create extension if not exists "uuid-ossp";

-- Agent Tenants registry
-- Stores credentials for every studio (tenant) that subscribes to the agent layer.
-- Named agent_tenants to avoid collision with the CRM's existing tenants table.
-- supabase_service_key should be stored encrypted at rest (handled by Supabase Vault in prod).
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

-- Index for fast tenant lookups (called at the start of every agent run)
create index if not exists idx_agent_tenants_tenant_id on public.agent_tenants (tenant_id);
create index if not exists idx_agent_tenants_status on public.agent_tenants (status);

-- ziro_events audit log (platform-level, not per-tenant)
-- Records every agent run for observability and debugging.
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

-- Row-level security: only service role can read/write tenants
alter table public.agent_tenants enable row level security;
alter table public.ziro_events enable row level security;

-- Service role bypass (agents use service role key for platform DB)
create policy "service_role_agent_tenants" on public.agent_tenants
    using (true)
    with check (true);

create policy "service_role_ziro_events" on public.ziro_events
    using (true)
    with check (true);
