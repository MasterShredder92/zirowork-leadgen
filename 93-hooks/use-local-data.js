window.SEED_DATA = {
  clients: [],
  leads: [],
  bookings: [],
  enrollments: [],
  campaigns: [],
  conversations: [],
  escalations: [],
  operator_tasks: [],
  client_reports: [],
  automation_rules: [],
  integrations: [],
};

// ─── Supabase async hooks ────────────────────────────────────────────────────
// Falls back to seed data if window.sb is not available (dev without credentials).

function applyFilters(data, filters) {
  if (!filters) return data;
  return data.filter(row => Object.entries(filters).every(([k, v]) => row[k] === v));
}

function _useTable(table, seedKey, filters, chanKey) {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  const filterKey = filters ? JSON.stringify(filters) : '';

  // Fetch effect — runs on mount and whenever tick increments (realtime or manual refetch)
  React.useEffect(() => {
    if (!window.sb) {
      setData(applyFilters(window.SEED_DATA[seedKey] || [], filters));
      setLoading(false);
      return;
    }
    let q = window.sb.from(table).select('*').order('created_at', { ascending: false });
    if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    q.then(({ data: rows, error: err }) => {
      setData(rows || []);
      setError(err);
      setLoading(false);
    });
  }, [filterKey, tick]);

  // Realtime subscription — any INSERT/UPDATE/DELETE on this table triggers a refetch
  React.useEffect(() => {
    if (!window.sb) return;
    const channel = window.sb
      .channel('rt-' + table + (chanKey ? '-' + chanKey : '') + (filterKey ? '-' + filterKey : ''))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        setTick(t => t + 1);
      })
      .subscribe();
    return () => { window.sb.removeChannel(channel); };
  }, [filterKey]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}

function useClients(f)       { return _useTable('clients',        'clients',        f); }
function useCampaigns(f)     { return _useTable('campaigns',      'campaigns',      f); }
function useLeads(f)         { return _useTable('leads',          'leads',          f); }
function useConversations(f) { return _useTable('conversations',  'conversations',  f); }
function useEscalations(f)   { return _useTable('escalations',    'escalations',    f); }
function useBookings(f)      { return _useTable('bookings',       'bookings',       f); }
function useEnrollments(f)   { return _useTable('enrollments',    'enrollments',    f); }
function useOperatorTasks(f)   { return _useTable('operator_tasks',   'operator_tasks',   f); }
function useClientReports(f)   { return _useTable('client_reports',   'client_reports',   f); }
function useAutomationRules(f) { return _useTable('automation_rules', 'automation_rules', f); }
function useIntegrations(f)    { return _useTable('integrations',     'integrations',     f); }

// ─── SINGLE SOURCE OF TRUTH: derived rollups ────────────────────────────────
// The `clients` and `campaigns` tables carry stored count columns (leads_30d,
// trials_30d, enrollments_30d, active_campaigns, open_escalations / leads,
// trials, enrolled) that NOTHING keeps in sync — they drift the moment a lead,
// booking, enrollment, campaign, or escalation changes. NEVER read those stored
// columns for display. Instead every page derives these counts here, from the
// live source tables, so all surfaces always agree. See 94-knowledge/data-ssot.md.
// NOTE: clients.mrr_cents is NOT here — it is the client's contract fee to
// ZiroWork (a primary billing value), not a count derived from source rows.

const ROLLUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // "_30d" columns = trailing 30 days

function deriveRollups({ leads, bookings, enrollments, campaigns, escalations }, nowMs) {
  const since = new Date(nowMs - ROLLUP_WINDOW_MS).toISOString();
  const leadById = {};
  leads.forEach(l => { leadById[l.id] = l; });

  const byClient = {};
  const ensureClient = id => (byClient[id] = byClient[id] ||
    { leads_30d: 0, trials_30d: 0, enrollments_30d: 0, active_campaigns: 0, open_escalations: 0 });

  const byCampaign = {};
  const ensureCampaign = id => (byCampaign[id] = byCampaign[id] || { leads: 0, trials: 0, enrolled: 0 });

  leads.forEach(l => {
    if (l.campaign_id) ensureCampaign(l.campaign_id).leads += 1;
    if (l.client_id && l.created_at >= since) ensureClient(l.client_id).leads_30d += 1;
  });

  // bookings have NO client_id — attribute through the lead (lead_id → lead.client_id/campaign_id)
  bookings.forEach(b => {
    const lead = b.lead_id ? leadById[b.lead_id] : null;
    if (!lead) return;
    if (lead.campaign_id) ensureCampaign(lead.campaign_id).trials += 1;
    if (lead.client_id && b.created_at >= since) ensureClient(lead.client_id).trials_30d += 1;
  });

  enrollments.forEach(e => {
    if (e.outcome !== 'enrolled') return;
    const lead = e.lead_id ? leadById[e.lead_id] : null;
    if (lead && lead.campaign_id) ensureCampaign(lead.campaign_id).enrolled += 1;
    if (e.client_id && e.created_at >= since) ensureClient(e.client_id).enrollments_30d += 1;
  });

  campaigns.forEach(c => {
    if (c.client_id && c.status === 'active') ensureClient(c.client_id).active_campaigns += 1;
  });

  // open escalations: ziro_messaging_escalations (the table the Escalations page treats
  // as truth) with no resolved_at, keyed by tenant_id (=== clients.id).
  escalations.forEach(e => {
    if (e.tenant_id && !e.resolved_at) ensureClient(e.tenant_id).open_escalations += 1;
  });

  return { byClient, byCampaign };
}

// One hook, called by every page that shows client/campaign counts. Composes the
// realtime source hooks with a distinct channel key so it never collides with a
// page's own subscriptions. Returns { byClient: {clientId: {...}}, byCampaign: {...} }.
const EMPTY_CLIENT_ROLLUP   = { leads_30d: 0, trials_30d: 0, enrollments_30d: 0, active_campaigns: 0, open_escalations: 0 };
const EMPTY_CAMPAIGN_ROLLUP = { leads: 0, trials: 0, enrolled: 0 };

function useRollups() {
  const leads       = _useTable('leads',                       'leads',       undefined, 'roll').data;
  const bookings    = _useTable('bookings',                    'bookings',    undefined, 'roll').data;
  const enrollments = _useTable('enrollments',                 'enrollments', undefined, 'roll').data;
  const campaigns   = _useTable('campaigns',                   'campaigns',   undefined, 'roll').data;
  const escalations = _useTable('ziro_messaging_escalations',  '__msgEsc',    undefined, 'roll').data;
  return React.useMemo(
    () => deriveRollups({ leads, bookings, enrollments, campaigns, escalations }, Date.now()),
    [leads, bookings, enrollments, campaigns, escalations]
  );
}

Object.assign(window, {
  useClients, useCampaigns, useLeads,
  useConversations, useEscalations, useBookings, useEnrollments,
  useOperatorTasks, useClientReports,
  useAutomationRules, useIntegrations,
  useRollups, deriveRollups, EMPTY_CLIENT_ROLLUP, EMPTY_CAMPAIGN_ROLLUP,
});
