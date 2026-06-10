-- Migration: 013_create_lesson_plan_files.sql
-- Target: Tenant DB (dhsyxyhtoadrqfrlmsqe)
-- Purpose: ZIRO_STAFF Agent — file attachments for lesson plans

CREATE TABLE IF NOT EXISTS lesson_plan_files (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL
                    DEFAULT '00000000-0000-0000-0000-000000000001',
  lesson_plan_id  UUID        NOT NULL
                    REFERENCES lesson_plans(id)
                    ON DELETE CASCADE,
  file_name       TEXT        NOT NULL,
  file_url        TEXT        NOT NULL,
  file_type       TEXT,
  uploaded_by     UUID
                    REFERENCES teachers(id) ON DELETE SET NULL,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_plan_files_plan_id
  ON lesson_plan_files(lesson_plan_id);

-- RLS: enable, service role bypasses
ALTER TABLE lesson_plan_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS lesson_plan_files_service_role
  ON lesson_plan_files
  USING (true)
  WITH CHECK (true);
