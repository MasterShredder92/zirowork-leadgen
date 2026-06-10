-- ============================================================
-- pg_cron Setup — Process Pending Leads Every 5 Minutes
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- PREREQUISITE: Enable pg_cron in Dashboard → Integrations → Cron
-- PREREQUISITE: process-pending Edge Function must be deployed first
-- ============================================================

select cron.schedule(
  'process-pending-leads',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/process-pending',
      headers := '{"Authorization": "Bearer [REDACTED_SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Verify it was scheduled:
select jobid, jobname, schedule, command from cron.job;
