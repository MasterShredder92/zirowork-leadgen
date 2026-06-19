# Wave C derive — use-local-data.js (352 LOC)
Real export count: 19 (Object.assign block), not 14 (doc estimate).

## Engine
_useTable(table, seedKey, filters, chanKey) — NOT exported. Realtime engine:
- fetch effect: supabase.from(table).select('*').order('created_at',desc); .eq per filter; reruns on [filterKey, tick]
- realtime effect: channel 'rt-{table}[-chanKey][-filterKey]', postgres_changes '*' → setTick; cleanup removeChannel; deps [filterKey]
- refetch = () => setTick(t+1)
- seed branch (!window.sb → SEED_DATA[seedKey]) is DEAD under module singleton; drop on port.
The 11 table hooks are one-liners over _useTable.

## Live vs dead (consumer counts from grep)
LIVE table hooks: useClients(8) useEnrollments(4) useLeads(4) useBookings(2) useCampaigns(1) useEscalations(1) useAutomationRules(1) useAgentTenants(1, safe-cols variant)
DEAD (0 consumers, skip): useConversations useOperatorTasks useClientReports useIntegrations
LIVE derive layer: useRollups(3) usePageFunnel(1) deriveIntegrations(1) EMPTY_CLIENT_ROLLUP(3) EMPTY_CAMPAIGN_ROLLUP(1); deriveRollups/derivePageFunnel exported but only used internally — keep.
SEED_DATA: only clients.jsx:60 reads it (empty fallback). Not ported; Phase-3 clients concern.

## Traps
1. Two escalation tables: useEscalations→'escalations'; useRollups open_escalations→'ziro_messaging_escalations'. Do not collapse.
2. SSOT: deriveRollups/derivePageFunnel/deriveIntegrations derive counts from source rows; NEVER read stored *_30d/count columns. Pure fns → unit-testable gate targets.
3. Seed fallback dead (singleton always exists) → drop from engine.
4. Bookings have no client_id → attribute via lead_id→lead.client_id/campaign_id.

## Fields touched (for precise types, not full schema)
deriveRollups: leads{id,campaign_id,client_id,created_at} bookings{lead_id,created_at} enrollments{outcome,lead_id,client_id,created_at} campaigns{client_id,status} escalations{tenant_id,resolved_at}
deriveIntegrations: client{id,name,school_name,lead_form_webhook} tenant{tenant_id,config.openphone_number_id,square_customer_id,square_card_id,per_enrollment_fee_cents,intake_api_key}
derivePageFunnel: page_events{type,slug,instrument,created_at} client_pages{id,client_id,school_name,instrument,slug,status,is_active} leads{id,page_url,created_at} bookings{lead_id,created_at} enrollments{outcome,lead_id,created_at}
