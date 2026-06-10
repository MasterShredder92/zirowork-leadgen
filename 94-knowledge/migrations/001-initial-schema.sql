-- ZiroWork Operator CRM — Initial Schema
-- Run via: Supabase SQL Editor or Management API
-- Drops old tables (edges, nodes, repos) then creates 9 operator tables.

DROP TABLE IF EXISTS edges CASCADE;
DROP TABLE IF EXISTS nodes CASCADE;
DROP TABLE IF EXISTS repos CASCADE;

-- 1. clients — music school accounts ZiroWork manages
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  status text NOT NULL DEFAULT 'onboarding',      -- 'live' | 'onboarding' | 'churned'
  health text,                                      -- 'healthy' | 'at_risk' | 'stuck' | null
  leads_30d int DEFAULT 0,
  trials_30d int DEFAULT 0,
  enrollments_30d int DEFAULT 0,
  mrr_cents int DEFAULT 0,
  active_campaigns int DEFAULT 0,
  open_escalations int DEFAULT 0,
  sms_number text,                                  -- actual phone number; null = not provisioned
  lead_form_webhook text,
  protected_slots boolean DEFAULT false,
  brand_assets boolean DEFAULT false,
  automation_rules boolean DEFAULT false,
  integrations boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. campaigns — per-client, per-program ad campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text,
  program text NOT NULL,
  status text NOT NULL DEFAULT 'draft',             -- 'active' | 'draft' | 'paused'
  leads int DEFAULT 0,
  trials int DEFAULT 0,
  enrolled int DEFAULT 0,
  landing_page text DEFAULT 'draft',                -- 'live' | 'draft'
  created_at timestamptz DEFAULT now()
);

-- 3. leads — inbound prospects for a client
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  parent_name text NOT NULL,
  student_name text NOT NULL,
  program text,
  stage text NOT NULL DEFAULT 'new',               -- 'new' | 'contacted' | 'qualified' | 'follow_up' | 'booked' | 'enrolled' | 'lost'
  phone text,
  days_in_stage int DEFAULT 0,                     -- updated by Python agent backend
  stage_entered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 4. conversations — SMS/email thread per lead
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text,
  parent_name text,
  program text,
  status text NOT NULL DEFAULT 'active',           -- 'active' | 'escalated' | 'closed'
  ai_handled boolean DEFAULT true,
  message_count int DEFAULT 0,
  last_message text,
  last_at text,
  created_at timestamptz DEFAULT now()
);

-- 5. escalations — flags requiring human intervention
CREATE TABLE escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text,
  parent_name text,
  severity text NOT NULL DEFAULT 'medium',         -- 'high' | 'medium' | 'low'
  status text NOT NULL DEFAULT 'open',             -- 'open' | 'resolved'
  reason text,
  created_at timestamptz DEFAULT now()
);

-- 6. bookings — trial/enrollment slots ZiroWork scheduled
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_name text,
  parent_name text,
  student_name text,
  program text,
  booking_type text DEFAULT 'enrollment',
  slot_id uuid,
  status text NOT NULL DEFAULT 'requested',        -- 'scheduled' | 'requested'
  date date,
  time text,
  teacher text,
  created_at timestamptz DEFAULT now()
);

-- 7. enrollments — final outcome records (ZiroWork's proof of delivery)
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text,
  parent_name text,
  student_name text,
  program text,
  outcome text NOT NULL DEFAULT 'follow_up',       -- 'enrolled' | 'follow_up' | 'lost'
  weekly_rate_cents int,
  enrolled_at date,
  created_at timestamptz DEFAULT now()
);

-- 8. operator_tasks — internal ZiroWork operator to-do items
CREATE TABLE operator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text,                                        -- 'setup' | 'onboarding' | 'follow-up'
  status text NOT NULL DEFAULT 'open',             -- 'open' | 'done'
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- 9. client_reports — monthly performance snapshots
CREATE TABLE client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  leads int DEFAULT 0,
  enrolled int DEFAULT 0,
  revenue_generated_cents int DEFAULT 0,
  avg_response_time_seconds int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
