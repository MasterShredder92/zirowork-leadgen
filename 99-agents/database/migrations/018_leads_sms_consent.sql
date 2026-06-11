-- 018: SMS consent tracking on leads (A2P 10DLC / TCPA compliance).
-- Signup form now collects an explicit, optional, unchecked consent checkbox;
-- the send path must only text leads with sms_consent = true.
-- APPLIED LIVE 2026-06-10 via management SQL API.

alter table leads add column if not exists sms_consent boolean not null default false;
alter table leads add column if not exists sms_consent_at timestamptz;
