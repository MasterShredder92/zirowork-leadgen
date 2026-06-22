-- ============================================================
-- ZiroWork — Engine Schema (Phase 1 cleaned)
-- 2nd CRM tables (families, students, teachers, lessons,
-- invoices, payroll, financials) excised per north-path Phase 1.
-- Live DDL to drop those tables is a separate Supabase migration.
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
-- STUDIOS  (one row per client business — ZiroWork's customer)
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
  integrations          jsonb DEFAULT '{}'::jsonb,
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
  role       text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'staff')),
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
-- LEADS  (the funnel engine — core of ZiroWork)
-- ============================================================
CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id      uuid REFERENCES locations(id) ON DELETE SET NULL,
  name             text NOT NULL,
  email            text,
  phone            text,
  instrument       text,
  referral_source  text CHECK (referral_source IN ('Google','Facebook','Instagram','Referral','Signage','Other')),
  status           text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','trial_scheduled','trial_complete','enrolled','lost')),
  contacts         int DEFAULT 0,
  date_submitted   date DEFAULT CURRENT_DATE,
  stage_entered_at timestamptz DEFAULT now(),
  lost_reason      text,
  form_responses   jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

ALTER TABLE studios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_member_access" ON studios
  FOR ALL USING (is_studio_member(id));

CREATE POLICY "own_memberships" ON studio_members
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "studio_member_access" ON locations
  FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "studio_member_access" ON leads
  FOR ALL USING (is_studio_member(studio_id));

-- ============================================================
-- SEED: example studio (run AFTER creating your auth user)
-- Replace placeholders with real values.
-- ============================================================

-- INSERT INTO studios (id, name, email, timezone)
-- VALUES ('YOUR_STUDIO_UUID', 'Studio Name', 'email@example.com', 'America/Chicago');

-- INSERT INTO studio_members (studio_id, user_id, role, full_name)
-- VALUES ('YOUR_STUDIO_UUID', '<YOUR_USER_ID>', 'owner', 'Your Name');

-- INSERT INTO locations (studio_id, name, city, state)
-- VALUES ('YOUR_STUDIO_UUID', 'Main Location', 'City', 'State');
