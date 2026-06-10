-- =============================================================
-- 022: client_users — maps an auth.users login to its tenant
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- =============================================================
--
-- WHY THIS EXISTS:
--   The client_users table is live in production but had NO migration.
--   complete-onboarding edge fn inserts {user_id, tenant_id} here when a
--   client finishes self-onboarding; the /dashboard portal login reads
--   tenant_id by user_id to scope the client to their own data.
--
--   Column set mirrors the live table exactly (pulled from
--   information_schema 2026-06-09) so a fresh rebuild matches production.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- client_users — one row per portal login → tenant
-- Written by: complete-onboarding edge fn
-- Read by:    /dashboard portal login (tenant_id lookup by user_id)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.client_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  tenant_id  text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_users_tenant_id on public.client_users (tenant_id);

alter table public.client_users enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'client_users' and policyname = 'service_role_client_users'
  ) then
    create policy "service_role_client_users" on public.client_users using (true) with check (true);
  end if;
end $$;


-- =============================================================
-- DONE. Tables created by this migration:
--   client_users — maps auth.users login → tenant_id
-- =============================================================
