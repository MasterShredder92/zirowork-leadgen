-- Migration: 015_create_privacy_violation_log.sql
-- Target: Platform DB (gngbyydqjouxkoprzzil)
-- Purpose: ZIRO_STAFF Agent — audit log for teacher privacy violation attempts

CREATE TABLE IF NOT EXISTS privacy_violation_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL,
  teacher_id       UUID        NOT NULL,
  teacher_name     TEXT,
  student_id       UUID,
  student_name     TEXT,
  requested_field  TEXT        NOT NULL,
    -- what they asked for: parent_phone,
    -- parent_email, parent_name, etc.
  request_context  TEXT,
    -- the actual query/question that triggered it
  flagged_at       TIMESTAMPTZ DEFAULT now(),
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  review_notes     TEXT
);

CREATE INDEX IF NOT EXISTS idx_pvl_tenant_id
  ON privacy_violation_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pvl_teacher_id
  ON privacy_violation_log(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pvl_unreviewed
  ON privacy_violation_log(flagged_at)
  WHERE reviewed_at IS NULL;
