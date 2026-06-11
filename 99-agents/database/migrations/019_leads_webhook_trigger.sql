-- 019: DB webhook on platform leads → on-new-lead edge function (pg_net).
-- Completes the documented pipeline: signup.jsx inserts a lead → trigger fires →
-- on-new-lead derives tenant from record.client_id → scoreAndSend.
-- Loop guard: rows scoreAndSend syncs back into leads carry source='webhook'
-- and are skipped here AND in on-new-lead.
-- APPLIED LIVE 2026-06-10. Replace <WEBHOOK_SECRET> with the value from
-- Supabase function secrets before running elsewhere (never commit it).

create or replace function public.notify_on_new_lead() returns trigger
language plpgsql security definer as $fn$
begin
  if new.source is distinct from 'webhook' then
    perform net.http_post(
      url := 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead',
      body := jsonb_build_object('type','INSERT','table','leads','schema','public','record', to_jsonb(new), 'old_record', null),
      headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret','<WEBHOOK_SECRET>')
    );
  end if;
  return new;
end $fn$;

drop trigger if exists on_lead_created on public.leads;
create trigger on_lead_created after insert on public.leads
for each row execute function public.notify_on_new_lead();
