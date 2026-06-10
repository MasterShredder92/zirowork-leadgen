-- PHASE 1A: Schema Completion + RLS Deployment
-- For ZiroWork Supabase
-- Status: Completes existing partial schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- STEP 1: Add missing columns to existing tables
-- ============================================================

-- studios: Add soft-delete + audit columns
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- families: Add soft-delete + audit columns
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- students: Add soft-delete + audit + denormalized studio_id
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- teachers: Add soft-delete + audit + studio_id
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- lessons: Add soft-delete + audit + studio_id
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- invoices: Add soft-delete + audit + studio_id
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- leads: Add soft-delete + audit + studio_id
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS studio_id UUID NOT NULL DEFAULT 'dc631b08-31c3-41e0-8c11-5dcba86bc1a4'::uuid,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- ============================================================
-- STEP 2: Create missing tables
-- ============================================================

-- users: Team members linked to auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'teacher', -- 'admin', 'teacher', 'user'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_studio_id ON users(studio_id);
CREATE INDEX IF NOT EXISTS idx_users_studio_id_role ON users(studio_id, role);

-- payments: Transaction records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT, -- 'credit-card', 'bank-transfer', 'check', 'cash'
  status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'refunded'
  transaction_id TEXT,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_studio_id ON payments(studio_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- schedules: Recurring lesson templates
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  subject TEXT,
  day_of_week TEXT, -- 'Monday', 'Tuesday', etc.
  start_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  soft_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedules_studio_id ON schedules(studio_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_student_id ON schedules(student_id);

-- activities: CRM interaction history (polymorphic)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'family', 'student', 'teacher', 'lead'
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'task'
  subject TEXT,
  body TEXT,
  duration_minutes INTEGER,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open', -- 'open', 'completed'
  next_activity_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,
  soft_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_activities_studio_id ON activities(studio_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id, status);

-- expenses: Operating costs
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'rent', 'utilities', 'marketing', 'supplies', etc.
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'one-time', -- 'one-time', 'monthly'
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  soft_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_studio_id ON expenses(studio_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- studio_settings: Per-studio configuration
CREATE TABLE IF NOT EXISTS studio_settings (
  studio_id UUID PRIMARY KEY REFERENCES studios(id) ON DELETE CASCADE,
  school_name TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  school_type TEXT,
  brand_colors JSONB,
  standard_rate DECIMAL(10, 2),
  military_rate DECIMAL(10, 2),
  instruments TEXT[], -- Array of available instruments
  family_tier_rates JSONB, -- {"1-7": 50, "8-15": 45, "16+": 40}
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- STEP 3: Add Foreign Key Constraints
-- ============================================================

-- families: Add FK to studios if not already present
ALTER TABLE families ADD CONSTRAINT fk_families_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- students: Add FK to families and studios
ALTER TABLE students ADD CONSTRAINT fk_students_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE students ADD CONSTRAINT fk_students_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- teachers: Add FK to studios
ALTER TABLE teachers ADD CONSTRAINT fk_teachers_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- lessons: Add FKs
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- invoices: Add FKs
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- leads: Add FK to studios
ALTER TABLE leads ADD CONSTRAINT fk_leads_studio FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_families_studio_id ON families(studio_id);
CREATE INDEX IF NOT EXISTS idx_families_status ON families(studio_id, status);
CREATE INDEX IF NOT EXISTS idx_families_soft_deleted ON families(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_students_studio_id ON students(studio_id);
CREATE INDEX IF NOT EXISTS idx_students_family_id ON students(family_id);
CREATE INDEX IF NOT EXISTS idx_students_soft_deleted ON students(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_teachers_studio_id ON teachers(studio_id);
CREATE INDEX IF NOT EXISTS idx_teachers_soft_deleted ON teachers(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_lessons_studio_id ON lessons(studio_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_soft_deleted ON lessons(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_invoices_studio_id ON invoices(studio_id);
CREATE INDEX IF NOT EXISTS idx_invoices_family_id ON invoices(family_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_soft_deleted ON invoices(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_leads_studio_id ON leads(studio_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_soft_deleted ON leads(soft_deleted);

-- ============================================================
-- STEP 5: Enable RLS on all tables
-- ============================================================

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies (Core Security Layer)
-- ============================================================

-- STUDIOS: Only owner can view/edit
CREATE POLICY "studio_owner_can_read"
  ON studios FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "studio_owner_can_update"
  ON studios FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- FAMILIES: Studio members can read/write families in their studio
CREATE POLICY "users_can_read_own_studio_families"
  ON families FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_create_families"
  ON families FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_families"
  ON families FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_families"
  ON families FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- STUDENTS: Studio members can read/write students in their studio
CREATE POLICY "users_can_read_own_studio_students"
  ON students FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_students"
  ON students FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_students"
  ON students FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_students"
  ON students FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- TEACHERS: Studio members can read/write teachers
CREATE POLICY "users_can_read_own_studio_teachers"
  ON teachers FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_teachers"
  ON teachers FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_teachers"
  ON teachers FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_teachers"
  ON teachers FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- LESSONS: Studio members can read/write lessons
CREATE POLICY "users_can_read_own_studio_lessons"
  ON lessons FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_lessons"
  ON lessons FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_lessons"
  ON lessons FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_lessons"
  ON lessons FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- INVOICES: Studio members can read/write invoices
CREATE POLICY "users_can_read_own_studio_invoices"
  ON invoices FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_invoices"
  ON invoices FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- LEADS: Studio members can read/write leads
CREATE POLICY "users_can_read_own_studio_leads"
  ON leads FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_leads"
  ON leads FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

CREATE POLICY "users_can_update_leads"
  ON leads FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_soft_delete_leads"
  ON leads FOR DELETE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- USERS: Team members
CREATE POLICY "users_can_read_own_studio_users"
  ON users FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_create_users"
  ON users FOR INSERT TO authenticated
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_update_users"
  ON users FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid))
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- PAYMENTS: Studio members can read/write payments
CREATE POLICY "users_can_read_own_studio_payments"
  ON payments FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_create_payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_update_payments"
  ON payments FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid))
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- SCHEDULES: Studio members can read/write schedules
CREATE POLICY "users_can_read_own_studio_schedules"
  ON schedules FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_schedules"
  ON schedules FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
  );

CREATE POLICY "users_can_update_schedules"
  ON schedules FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false)
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- ACTIVITIES: Studio members can read/write activities
CREATE POLICY "users_can_read_own_studio_activities"
  ON activities FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_activities"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND owner_id = auth.uid()
  );

-- EXPENSES: Studio members can read/write expenses
CREATE POLICY "users_can_read_own_studio_expenses"
  ON expenses FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid) AND soft_deleted = false);

CREATE POLICY "users_can_create_expenses"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (
    studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid)
    AND created_by = auth.uid()
  );

-- STUDIO_SETTINGS: Studio members can read/write their settings
CREATE POLICY "users_can_read_own_studio_settings"
  ON studio_settings FOR SELECT TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

CREATE POLICY "users_can_update_own_studio_settings"
  ON studio_settings FOR UPDATE TO authenticated
  USING (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid))
  WITH CHECK (studio_id = (SELECT (auth.jwt()->>'studio_id')::uuid));

-- ============================================================
-- STEP 7: Create Auto-Update Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with timestamps
CREATE TRIGGER families_update_timestamp BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER students_update_timestamp BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER teachers_update_timestamp BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER lessons_update_timestamp BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER invoices_update_timestamp BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER leads_update_timestamp BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER payments_update_timestamp BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER schedules_update_timestamp BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER expenses_update_timestamp BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER studio_settings_update_timestamp BEFORE UPDATE ON studio_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- DEPLOYMENT CHECKLIST
-- ============================================================
-- [ ] Run this entire SQL script in Supabase SQL Editor
-- [ ] Verify: SELECT COUNT(*) FROM studios; -- Should return 1 (Adkins)
-- [ ] Verify: SELECT COUNT(*) FROM families; -- Should return 0
-- [ ] Test RLS: Login as Adkins user, try SELECT * FROM families;
-- [ ] Next: Create Adkins user in auth + studio_members record
-- [ ] Next: Set JWT claim app_metadata.studio_id on Adkins user
-- [ ] Next: Test RLS isolation with second test studio
