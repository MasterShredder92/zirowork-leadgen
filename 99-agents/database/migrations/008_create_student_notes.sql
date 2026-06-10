-- Migration: 008_create_student_notes.sql
-- Target: Tenant Supabase (dhsyxyhtoadrqfrlmsqe)
-- Purpose: ZIRO_CLIENT Agent — structured student notes storage
-- Run manually via Supabase SQL editor on the tenant project.

CREATE TABLE IF NOT EXISTS student_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL
                DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id  UUID        NOT NULL
                REFERENCES students(id) ON DELETE CASCADE,
  author_id   UUID,
  author_role TEXT,
  note_type   TEXT        NOT NULL DEFAULT 'general',
    -- general | teacher | emotional | goal | parent
  body        TEXT        NOT NULL,
  flagged     BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id
  ON student_notes(student_id);

CREATE INDEX IF NOT EXISTS idx_student_notes_tenant_id
  ON student_notes(tenant_id);

-- Row Level Security
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can only see their own tenant's notes
CREATE POLICY "tenant_isolation_student_notes"
  ON student_notes
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR auth.role() = 'service_role'
  );
