-- =============================================================
-- 023: Drop Orphan Tables
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- Drops 6 tables that exist live but are read/written by NO code
-- (no edge function, no frontend reference). Each backs a
-- planned-but-unbuilt agent feature.
-- =============================================================
--
-- ┌───────────────────────────────────────────────────────────┐
-- │  ✅ APPLIED 2026-06-10 — decision: DROP (features abandoned)│
-- │                                                           │
-- │  These 6 tables backed features that were SCAFFOLDED BUT  │
-- │  NEVER BUILT. They were referenced by no code and held    │
-- │  0 rows, so the drop lost no data.                        │
-- │                                                           │
-- │  Re-runnable safely (drop ... if exists). To restore any  │
-- │  table, re-run its original migration (cited per line).   │
-- │                                                           │
-- │  Data loss: NONE. Every table was empty (0 rows verified).│
-- │                                                           │
-- │                                                           │
-- │  Reversible: YES. To restore any table, re-run the        │
-- │  original migration that created it (cited per-line       │
-- │  below).                                                  │
-- └───────────────────────────────────────────────────────────┘
--
-- WHAT THIS DROPS (table — feature — origin migration):
--   ziro_messaging_knowledge_base  response frameworks         004
--   system_health                  component health tracking   007
--   anchor_job_locks               distributed job locks       007
--   ziro_client_context_cache      student context cache       009
--   ziro_retention_risk_log        churn-risk staging          010
--   privacy_violation_log          teacher-privacy audit       015
-- =============================================================


-- response frameworks for the messaging agent — prompts are hardcoded in _shared/prompts.ts instead — created by migration 004
drop table if exists public.ziro_messaging_knowledge_base cascade;

-- component health tracking — never written — created by migration 007
drop table if exists public.system_health cascade;

-- distributed job locks — never used (single-instance) — created by migration 007
drop table if exists public.anchor_job_locks cascade;

-- student context cache for an unbuilt agent — created by migration 009
drop table if exists public.ziro_client_context_cache cascade;

-- churn-risk staging for an unbuilt retention agent — created by migration 010
drop table if exists public.ziro_retention_risk_log cascade;

-- teacher-privacy audit for an unbuilt agent — created by migration 015
drop table if exists public.privacy_violation_log cascade;
