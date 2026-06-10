-- Migration: 011_add_student_risk_fields.sql
-- Target: Tenant Supabase (dhsyxyhtoadrqfrlmsqe)
-- Purpose: ZIRO_RETENTION Agent — risk stage tracking on student records

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS risk_stage        INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_flagged_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_retention_check TIMESTAMPTZ;

-- risk_stage values:
-- 0 = healthy
-- 1 = at_risk (flagged, watching)
-- 2 = intervention_sent (ZIRO_MESSAGING contacted)
-- 3 = escalated (second ZIRO_MESSAGING contact)
-- 4 = churn_likely (owner notified, no more automated outreach)
