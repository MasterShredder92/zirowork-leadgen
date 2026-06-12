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
  assets: [],
  integrations: [],
};

// ─── Supabase async hooks ────────────────────────────────────────────────────
// Falls back to seed data if window.sb is not available (dev without credentials).

function applyFilters(data, filters) {
  if (!filters) return data;
  return data.filter(row => Object.entries(filters).every(([k, v]) => row[k] === v));
}

function _useTable(table, seedKey, filters) {
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
      .channel('rt-' + table + (filterKey ? '-' + filterKey : ''))
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
function useAssets(f)          { return _useTable('assets',           'assets',           f); }
function useIntegrations(f)    { return _useTable('integrations',     'integrations',     f); }

Object.assign(window, {
  useClients, useCampaigns, useLeads,
  useConversations, useEscalations, useBookings, useEnrollments,
  useOperatorTasks, useClientReports,
  useAutomationRules, useAssets, useIntegrations,
});
