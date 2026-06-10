-- Migration: 005_tenant_contact_fields.sql
-- Adds missing contact and referral columns to
-- tenant DB tables.
-- Run once against EACH tenant Supabase project.
-- NOT the platform DB.

-- Students: add parent contact fields and
-- military flag
alter table public.students
  add column if not exists
    is_military boolean default false,
  add column if not exists
    parent_name text,
  add column if not exists
    parent_email text,
  add column if not exists
    parent_phone text;

-- Leads: add referral source and
-- additional students array
alter table public.leads
  add column if not exists
    referral_source text,
  add column if not exists
    additional_students jsonb
    default '[]'::jsonb;

comment on column public.students.is_military is
  'True if student or household is active duty
   or veteran military. Triggers $160/month rate.';

comment on column public.students.parent_name is
  'Primary parent or guardian full name.';

comment on column public.students.parent_email is
  'Primary parent or guardian email address.
   Used by ZIRO_MESSAGING for email communications.';

comment on column public.students.parent_phone is
  'Primary parent or guardian phone number in
   E.164 format. Used by ZIRO_MESSAGING for SMS.';

comment on column public.leads.referral_source is
  'How the lead heard about us. If Referral,
   triggers 50% off referring family invoice.';

comment on column public.leads.additional_students is
  'Array of additional student objects for
   multi-student enrollments. Each object has:
   name, instrument, personality_notes, goals.
   Triggers multi-student pricing at $160/month
   per student.';
