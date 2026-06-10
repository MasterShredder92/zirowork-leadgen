-- Migration: 012_create_lesson_plans.sql
-- Target: Tenant DB (dhsyxyhtoadrqfrlmsqe)
-- Purpose: ZIRO_STAFF Agent — lesson plan storage with rewrite tracking
-- Note: Replaces old 003_create_lesson_plans.sql schema (different columns)

CREATE TABLE IF NOT EXISTS lesson_plans (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id          UUID        NOT NULL
                        REFERENCES students(id) ON DELETE CASCADE,
  teacher_id          UUID        NOT NULL
                        REFERENCES teachers(id) ON DELETE RESTRICT,
  schedule_block_id   UUID
                        REFERENCES schedule_blocks(id)
                        ON DELETE SET NULL,
  session_date        DATE        NOT NULL,
  what_we_worked_on   TEXT,
  what_to_practice    TEXT,
  teacher_observation TEXT,
  raw_input           JSONB,
    -- stores original teacher input before rewrite
  rewritten           BOOLEAN     DEFAULT false,
  rewritten_at        TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_student_id
  ON lesson_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_id
  ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_session_date
  ON lesson_plans(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_tenant_id
  ON lesson_plans(tenant_id);

-- RLS: enable, service role bypasses
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS lesson_plans_service_role
  ON lesson_plans
  USING (true)
  WITH CHECK (true);
