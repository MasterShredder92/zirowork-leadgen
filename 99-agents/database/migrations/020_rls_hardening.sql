-- Migration: 020_rls_hardening.sql
-- Target: Platform DB (txpgyuetfsrzfxxopwzf) + Tenant DB (dhsyxyhtoadrqfrlmsqe)
-- Purpose: Phase 5 RLS hardening — block anonymous access on all tables
--          that currently have USING (true) without a role restriction.
--
-- WHAT THIS CHANGES:
--   Before: USING (true)             → any role, including anon, can read
--   After:  TO authenticated USING (true) → only authenticated JWT holders
--
-- WHAT THIS DOES NOT CHANGE:
--   - Service-role bypasses RLS entirely (Postgres default) — backend agents unaffected
--   - Authenticated users still see all rows (per-operator scoping is Phase 3 — see bottom)
--
-- IDEMPOTENT: All DROP … IF EXISTS + CREATE … — safe to re-run.
-- REVERSIBLE: See rollback block at bottom (commented out).

-- ============================================================
-- TABLE: lesson_plans  (migration 012)
-- ============================================================

-- Drop the unrestricted open policy
DROP POLICY IF EXISTS lesson_plans_service_role ON lesson_plans;

-- Authenticated-only read + write
CREATE POLICY IF NOT EXISTS lesson_plans_authenticated_select
  ON lesson_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS lesson_plans_authenticated_insert
  ON lesson_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lesson_plans_authenticated_update
  ON lesson_plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lesson_plans_authenticated_delete
  ON lesson_plans
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: lesson_plan_files  (migration 013)
-- ============================================================

DROP POLICY IF EXISTS lesson_plan_files_service_role ON lesson_plan_files;

CREATE POLICY IF NOT EXISTS lesson_plan_files_authenticated_select
  ON lesson_plan_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS lesson_plan_files_authenticated_insert
  ON lesson_plan_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lesson_plan_files_authenticated_update
  ON lesson_plan_files
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lesson_plan_files_authenticated_delete
  ON lesson_plan_files
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: student_teacher_history  (migration 014)
-- ============================================================

DROP POLICY IF EXISTS student_teacher_history_service_role ON student_teacher_history;

CREATE POLICY IF NOT EXISTS student_teacher_history_authenticated_select
  ON student_teacher_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS student_teacher_history_authenticated_insert
  ON student_teacher_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS student_teacher_history_authenticated_update
  ON student_teacher_history
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS student_teacher_history_authenticated_delete
  ON student_teacher_history
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: billing_events  (migration 016)
-- Purpose: Service-role ONLY — no authenticated SELECT
--   billing_events contains financial charge records that
--   must not be readable by the client portal or CRM JWT.
--   Backend agents use service-role (bypasses RLS).
--   No SELECT policy = authenticated users see nothing.
-- ============================================================

-- Enable RLS (was never enabled in 016 — open to everyone)
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Drop any accidental SELECT policy if one was added out-of-band
DROP POLICY IF EXISTS billing_events_select ON billing_events;
DROP POLICY IF EXISTS billing_events_authenticated_select ON billing_events;
DROP POLICY IF EXISTS billing_events_service_role ON billing_events;

-- INSERT/UPDATE/DELETE restricted to authenticated (service-role bypasses anyway,
-- but this closes the gap if anon somehow gets a valid JWT)
CREATE POLICY IF NOT EXISTS billing_events_authenticated_insert
  ON billing_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No SELECT policy for billing_events — intentional.
-- Only service-role (backend) may read billing records.

-- ============================================================
-- ROLLBACK (run manually if needed — do NOT run with migration)
-- ============================================================
-- DROP POLICY IF EXISTS lesson_plans_authenticated_select ON lesson_plans;
-- DROP POLICY IF EXISTS lesson_plans_authenticated_insert ON lesson_plans;
-- DROP POLICY IF EXISTS lesson_plans_authenticated_update ON lesson_plans;
-- DROP POLICY IF EXISTS lesson_plans_authenticated_delete ON lesson_plans;
-- CREATE POLICY IF NOT EXISTS lesson_plans_service_role ON lesson_plans USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS lesson_plan_files_authenticated_select ON lesson_plan_files;
-- DROP POLICY IF EXISTS lesson_plan_files_authenticated_insert ON lesson_plan_files;
-- DROP POLICY IF EXISTS lesson_plan_files_authenticated_update ON lesson_plan_files;
-- DROP POLICY IF EXISTS lesson_plan_files_authenticated_delete ON lesson_plan_files;
-- CREATE POLICY IF NOT EXISTS lesson_plan_files_service_role ON lesson_plan_files USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS student_teacher_history_authenticated_select ON student_teacher_history;
-- DROP POLICY IF EXISTS student_teacher_history_authenticated_insert ON student_teacher_history;
-- DROP POLICY IF EXISTS student_teacher_history_authenticated_update ON student_teacher_history;
-- DROP POLICY IF EXISTS student_teacher_history_authenticated_delete ON student_teacher_history;
-- CREATE POLICY IF NOT EXISTS student_teacher_history_service_role ON student_teacher_history USING (true) WITH CHECK (true);

-- ALTER TABLE billing_events DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS billing_events_authenticated_insert ON billing_events;

-- ============================================================
-- PHASE 3 SCOPING (NOT IN THIS MIGRATION — document only)
-- ============================================================
-- Tables still needing per-operator/tenant scoping:
--
--   lesson_plans              — add: USING (tenant_id = current_setting('app.tenant_id')::uuid)
--   lesson_plan_files         — join to lesson_plans to scope by tenant_id
--   student_teacher_history   — add: USING (tenant_id = current_setting('app.tenant_id')::uuid)
--   billing_events            — service-role only; no client-visible scope needed
--
-- Pattern for Phase 3:
--   SET LOCAL app.tenant_id = '<uuid>';  -- set per request in edge function
--   USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
--
-- Tables from 007 (anchor_job_locks, system_health) have no RLS — internal only,
-- accessed exclusively by service-role. Flag for review if ever exposed to JWT clients.
