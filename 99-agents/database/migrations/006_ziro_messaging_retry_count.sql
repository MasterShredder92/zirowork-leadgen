-- Migration: 006_ziro_messaging_retry_count.sql
-- Adds retry_count to ziro_message_log on the platform DB.
-- Max 2 retries before permanent failure.

ALTER TABLE public.ziro_message_log
ADD COLUMN IF NOT EXISTS retry_count integer not null default 0;

COMMENT ON COLUMN public.ziro_message_log.retry_count IS
  'Number of send attempts. Max 2 retries before permanent failure.';
