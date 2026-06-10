-- ============================================================
-- pg_cron Setup — Follow-up Sequences (hourly) + Monthly Reports
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- PREREQUISITE: pg_cron must be enabled (see setup_pgcron.sql)
-- PREREQUISITE: send-followup and monthly-report functions deployed
-- ============================================================

-- Send follow-up sequences every hour
select cron.schedule(
  'send-followup-sequences',
  '0 * * * *',
  $$
    select net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/send-followup',
      headers := '{"Authorization": "Bearer [REDACTED_SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Generate monthly client reports on the 1st of each month at 6am UTC
select cron.schedule(
  'generate-monthly-reports',
  '0 6 1 * *',
  $$
    select net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/monthly-report',
      headers := '{"Authorization": "Bearer [REDACTED_SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Verify all scheduled jobs:
select jobid, jobname, schedule, command from cron.job;
