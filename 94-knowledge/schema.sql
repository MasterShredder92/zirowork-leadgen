-- ============================================================
-- ZiroWork — Full Database Schema
-- Paste into Supabase SQL Editor and run.
-- ============================================================

-- Auto-update trigger function (shared by all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STUDIOS  (one row per business/brand)
-- ============================================================
CREATE TABLE studios (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  email                 text,
  phone                 text,
  address               text,
  timezone              text DEFAULT 'America/New_York',
  logo_url              text,
  twilio_subaccount_sid text,
  a2p_status            text DEFAULT 'Pending' CHECK (a2p_status IN ('Pending', 'Approved', 'Rejected')),
  a2p_profile_sid       text,
  a2p_brand_sid         text,
  a2p_campaign_sid      text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TRIGGER studios_updated_at
  BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STUDIO MEMBERS  (user ↔ studio + role, 1 login = all studios)
-- ============================================================
CREATE TABLE studio_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'staff', 'teacher')),
  full_name  text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(studio_id, user_id)
);

-- ============================================================
-- LOCATIONS  (physical sites within a studio)
-- ============================================================
CREATE TABLE locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name       text NOT NULL,
  address    text,
  city       text,
  state      text,
  phone      text,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TEACHERS  (belong to studio, can teach at multiple locations)
-- ============================================================
CREATE TABLE teachers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id          uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name               text NOT NULL,
  email              text,
  phone              text,
  status             text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  is_active          boolean DEFAULT true,
  active_students    int DEFAULT 0,
  total_enrollments  int DEFAULT 0,
  schedule           jsonb DEFAULT '{}',
  instruments        text[],
  primary_instrument text,
  bio                text,
  photo_url          text,
  w9_form_url        text,
  contract_url       text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Teacher ↔ Location junction (one teacher can work at multiple locations)
CREATE TABLE teacher_locations (
  teacher_id  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, location_id)
);

-- ============================================================
-- FAMILIES  (studio-level — a family can have kids at different locations)
-- ============================================================
CREATE TABLE families (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id            uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  primary_contact      text,
  email                text,
  phone                text,
  location             text,
  status               text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Paused')),
  billing              text DEFAULT 'Pending' CHECK (billing IN ('Paid', 'Overdue', 'Pending')),
  military             text DEFAULT 'No' CHECK (military IN ('Yes', 'No')),
  instruments          text[],
  student_count        int DEFAULT 0,
  photo_url            text,
  overdue_balance_cents int DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id          uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id        uuid REFERENCES locations(id) ON DELETE SET NULL,
  family_id          uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  teacher_id         uuid REFERENCES teachers(id) ON DELETE SET NULL,
  first_name         text NOT NULL,
  last_name          text NOT NULL,
  status             text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'trial')),
  age                int,
  date_of_birth      date,
  student_display_id text,
  location_name      text,
  enrollment_date    date,
  skill_level        text CHECK (skill_level IN ('Beginner','Beginner/Intermediate','Intermediate','Intermediate/Advanced','Advanced')),
  learning_style     text,
  goals              text,
  bio                text,
  photo_url          text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE lessons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id      uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id     uuid REFERENCES teachers(id) ON DELETE SET NULL,
  instrument     text,
  day            text,
  time           text,
  level          text CHECK (level IN ('Beginner','Beginner/Intermediate','Intermediate','Intermediate/Advanced','Advanced')),
  blocks_per_week int DEFAULT 1,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id           uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id         uuid REFERENCES locations(id) ON DELETE SET NULL,
  name                text NOT NULL,
  email               text,
  phone               text,
  instrument          text,
  referral_source     text CHECK (referral_source IN ('Google','Facebook','Instagram','Referral','Signage','Other')),
  status              text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','trial_scheduled','trial_complete','enrolled','lost')),
  contacts            int DEFAULT 0,
  date_submitted      date DEFAULT CURRENT_DATE,
  stage_entered_at    timestamptz DEFAULT now(),
  lost_reason         text,
  enrolled_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  form_responses      jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STUDENT NOTES
-- ============================================================
CREATE TABLE student_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  text        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- FAMILIES TIMELINE
-- ============================================================
CREATE TABLE families_timeline (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  actor_name  text,
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id      uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  family_id      uuid REFERENCES families(id) ON DELETE SET NULL,
  invoice_number text,
  services       text,
  student_count  int DEFAULT 1,
  amount_cents   int NOT NULL DEFAULT 0,
  status         text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','outstanding','paid','overdue','refunded')),
  issued_date    date DEFAULT CURRENT_DATE,
  due_date       date,
  recurring      boolean DEFAULT false,
  sent_at        timestamptz,
  paid_at        timestamptz,
  pdf_url        text,
  line_items     jsonb DEFAULT '[]',
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: true if current user is a member of studio `sid`
CREATE OR REPLACE FUNCTION is_studio_member(sid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM studio_members
    WHERE studio_id = sid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE studios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE families         ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE families_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_member_access" ON studios
  FOR ALL USING (is_studio_member(id));

CREATE POLICY "own_memberships" ON studio_members
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "studio_member_access" ON locations
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON teachers
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON teacher_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND is_studio_member(t.studio_id))
  );

CREATE POLICY "studio_member_access" ON families
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON students
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON lessons
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON leads
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON student_notes
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON families_timeline
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON invoices
  FOR ALL USING (is_studio_member(studio_id));

-- ============================================================
-- SEED: Adkins Music Lessons (run AFTER creating your auth user)
-- Replace <YOUR_USER_ID> with your Supabase auth user UUID.
-- ============================================================

-- INSERT INTO studios (id, name, email, timezone)
-- VALUES ('YOUR_STUDIO_UUID', 'Adkins Music Lessons', 'YOUR_EMAIL', 'America/Chicago');

-- INSERT INTO studio_members (studio_id, user_id, role, full_name)
-- VALUES ('YOUR_STUDIO_UUID', '<YOUR_USER_ID>', 'owner', 'Zach Adkins');

-- INSERT INTO locations (studio_id, name, city, state)
-- VALUES ('YOUR_STUDIO_UUID', 'Location Name Here', 'City', 'State');
