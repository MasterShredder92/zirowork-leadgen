-- Migration: 014_create_student_teacher_history.sql
-- Target: Tenant DB (dhsyxyhtoadrqfrlmsqe)
-- Purpose: ZIRO_STAFF Agent — audit trail of teacher assignments per student

CREATE TABLE IF NOT EXISTS student_teacher_history (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL
                              DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id                UUID        NOT NULL
                              REFERENCES students(id) ON DELETE CASCADE,
  teacher_id                UUID        NOT NULL
                              REFERENCES teachers(id) ON DELETE RESTRICT,
  started_at                DATE        NOT NULL,
  ended_at                  DATE,
  end_reason                TEXT,
    -- graduated | teacher_left | reassigned
    -- | student_request | other
  total_sessions            INTEGER     DEFAULT 0,
  handoff_report_generated  BOOLEAN     DEFAULT false,
  handoff_report_at         TIMESTAMPTZ,
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sth_student_id
  ON student_teacher_history(student_id);
CREATE INDEX IF NOT EXISTS idx_sth_teacher_id
  ON student_teacher_history(teacher_id);

-- RLS: enable, service role bypasses
ALTER TABLE student_teacher_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS student_teacher_history_service_role
  ON student_teacher_history
  USING (true)
  WITH CHECK (true);
