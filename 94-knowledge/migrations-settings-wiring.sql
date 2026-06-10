-- ZiroWork Settings Wiring Migration
-- Date: 2026-06-04
-- Purpose: Add studio_settings table for Account tab persistence

-- 1. Create studio_settings table
CREATE TABLE IF NOT EXISTS studio_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  school_name text,
  phone text,
  email text,
  address_line1 text,
  city text,
  state text,
  zip text,
  website text,
  timezone text DEFAULT 'America/Chicago',
  school_type text, -- 'private' | 'non-profit' | 'community'
  logo_url text,
  brand_colors jsonb, -- {primary, secondary, accent}
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Enable RLS (if needed for auth)
ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: studio members can read/update their own studio settings
CREATE POLICY studio_settings_update ON studio_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = studio_settings.studio_id
      AND studio_members.user_id = auth.uid()
    )
  );

CREATE POLICY studio_settings_read ON studio_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = studio_settings.studio_id
      AND studio_members.user_id = auth.uid()
    )
  );

-- 4. Verify studios table has required columns
-- (should already exist from auth setup)
-- ALTER TABLE studios ADD COLUMN IF NOT EXISTS name text;

-- 5. Trigger to update studio_settings.updated_at on write
CREATE OR REPLACE FUNCTION update_studio_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_studio_settings_timestamp_trigger ON studio_settings;
CREATE TRIGGER update_studio_settings_timestamp_trigger
  BEFORE UPDATE ON studio_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_settings_timestamp();

-- Notes:
-- - studio_id has UNIQUE constraint to ensure 1:1 with studios table
-- - Uses UPSERT pattern in settings.jsx with onConflict: 'studio_id'
-- - phone/email stored here AND user.email/contact via studio_members
-- - timezone used by cron jobs + reports generation
