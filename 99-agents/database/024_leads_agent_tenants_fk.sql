-- 024: FK leads.client_id -> agent_tenants.tenant_id
-- send-followup embeds `agent_tenants!inner(config, name)` from leads; PostgREST
-- needs a real FK to resolve that relationship — without it the hourly cron 500s
-- ("Could not find a relationship between 'leads' and 'agent_tenants'").
-- agent_tenants.tenant_id is UNIQUE (= clients.id, 1:1 with clients), and onboarding
-- always creates the tenant row with the client, so every lead has a match.
-- CASCADE mirrors leads_client_id_fkey (clients ON DELETE CASCADE).

alter table public.leads
  add constraint leads_client_id_agent_tenants_fkey
  foreign key (client_id) references public.agent_tenants(tenant_id)
  on delete cascade;

notify pgrst, 'reload schema';
