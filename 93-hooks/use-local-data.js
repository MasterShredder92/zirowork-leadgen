window.SEED_DATA = {
  clients: [
    {
      id: 'demo-001',
      slug: 'demo-music',
      name: 'Demo Music Academy',
      email: 'demo@demomusic.com',
      studio_phone: '(555) 123-4567',
      city: 'Portland',
      state: 'OR',
      logo_url: null,
      accent_color: '#E04D27',
      tagline: 'Learn music from world-class teachers',
      offer: 'First lesson free',
      created_at: '2026-01-01T00:00:00Z',
      program_prices: {
        Piano: { price: '65' },
        Guitar: { price: '65' },
        Vocals: { price: '60' },
        Drums: { price: '65' },
      },
    }
  ],
  leads: [
    {
      id: 'lead-001',
      client_id: 'demo-001',
      client_name: 'Demo Music Academy',
      student_name: 'Sarah Chen',
      parent_name: 'Michael Chen',
      program: 'Piano',
      email: 'sarah.chen@demo.com',
      phone: '(555) 987-6543',
      age: 8,
      stage: 'new',
      created_at: '2026-06-01T10:00:00Z',
    }
  ],
  bookings: [
    {
      id: 'booking-001',
      lead_id: 'lead-001',
      client_id: 'demo-001',
      student_name: 'Sarah Chen',
      parent_name: 'Michael Chen',
      program: 'Piano',
      scheduled_date: '2026-06-15',
      scheduled_time: '3:30 PM',
      confirmation_token: 'demo-token-12345',
      status: 'pending',
      created_at: '2026-06-01T12:00:00Z',
    }
  ],
  enrollments: [
    {
      id: 'enrollment-001',
      booking_id: 'booking-001',
      lead_id: 'lead-001',
      client_id: 'demo-001',
      client_name: 'Demo Music Academy',
      student_name: 'Sarah Chen',
      parent_name: 'Michael Chen',
      program: 'Piano',
      outcome: 'enrolled',
      enrolled_at: '2026-06-01',
      handed_off_at: '2026-06-01T14:00:00Z',
      weekly_rate_cents: 6500,
    }
  ],
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
