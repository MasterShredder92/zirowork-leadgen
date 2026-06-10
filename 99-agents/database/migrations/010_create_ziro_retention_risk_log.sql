-- Migration: 010_create_ziro_retention_risk_log.sql
-- Target: Platform Supabase (gngbyydqjouxkoprzzil)
-- Purpose: ZIRO_RETENTION Agent — risk staging and cooldown gate for churn detection

CREATE TABLE IF NOT EXISTS ziro_retention_risk_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL,
  tenant_id         UUID        NOT NULL,
  risk_stage        INTEGER     NOT NULL DEFAULT 1,
    -- 1=flagged, 2=intervention_sent,
    -- 3=escalated, 4=churn_likely
  churn_signals     JSONB       NOT NULL DEFAULT '[]',
    -- array of signal strings that triggered this
  stage_entered_at  TIMESTAMPTZ DEFAULT now(),
  next_check_after  TIMESTAMPTZ NOT NULL,
    -- cooldown gate — ZIRO_RETENTION ignores this student
    -- until this timestamp passes
  resolved_at       TIMESTAMPTZ,
    -- set when student returns to good standing
  resolution_reason TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, tenant_id, resolved_at)
    -- allows new risk log after resolution
);

CREATE INDEX IF NOT EXISTS idx_ziro_retention_risk_student
  ON ziro_retention_risk_log(student_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_ziro_retention_risk_active
  ON ziro_retention_risk_log(next_check_after)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ziro_retention_risk_stage
  ON ziro_retention_risk_log(risk_stage)
  WHERE resolved_at IS NULL;
