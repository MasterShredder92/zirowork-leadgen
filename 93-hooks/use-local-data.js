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
  agent_tenants: [],
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

// agent_tenants — like _useTable but with an EXPLICIT safe column select that
// NEVER pulls supabase_service_key / supabase_url (secrets must not reach the
// browser). _useTable hardcodes select('*'), so this is its own small hook.
const TENANT_SAFE_COLS = 'id, tenant_id, name, plan_tier, status, config, square_customer_id, square_card_id, per_enrollment_fee_cents, intake_api_key, integrations_enabled';

function useAgentTenants() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!window.sb) {
      setData(window.SEED_DATA.agent_tenants || []);
      setLoading(false);
      return;
    }
    window.sb.from('agent_tenants').select(TENANT_SAFE_COLS).then(({ data: rows, error: err }) => {
      setData(rows || []);
      setError(err);
      setLoading(false);
    });
  }, [tick]);

  React.useEffect(() => {
    if (!window.sb) return;
    const channel = window.sb
      .channel('rt-agent_tenants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tenants' }, () => {
        setTick(t => t + 1);
      })
      .subscribe();
    return () => { window.sb.removeChannel(channel); };
  }, []);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}

// deriveIntegrations — HONEST per-client integration status, derived from real
// client + agent_tenant data. No stored "connected" flag; each row reflects what
// is actually configured. Match tenant by tenant.tenant_id === client.id.
function deriveIntegrations(clients, tenants) {
  const tenantByClient = {};
  (tenants || []).forEach(t => { if (t.tenant_id) tenantByClient[t.tenant_id] = t; });
  const rows = [];

  (clients || []).forEach(c => {
    const t = tenantByClient[c.id] || {};
    const name = c.name || c.school_name || '—';

    // OpenPhone / SMS
    const phoneId = t.config && t.config.openphone_number_id;
    const phoneOk = typeof phoneId === 'string' && phoneId.length > 0;
    rows.push({
      client_id: c.id, client_name: name, service: 'openphone', label: 'OpenPhone / SMS',
      status: phoneOk ? 'connected' : 'missing',
      detail: phoneOk ? 'Number set' : 'No OpenPhone number set',
    });

    // Square / Billing
    const hasCustomer = !!t.square_customer_id;
    const hasCard = !!t.square_card_id;
    const fee = t.per_enrollment_fee_cents;
    const hasFee = typeof fee === 'number' && fee > 0;
    let sqStatus, sqDetail;
    if (hasCustomer && hasCard && hasFee) {
      sqStatus = 'connected';
      sqDetail = `Card on file · $${(fee / 100).toFixed(2)}/enrollment`;
    } else if (hasCustomer) {
      sqStatus = 'incomplete';
      sqDetail = !hasCard ? 'Customer created, no card on file' : 'No enrollment fee set';
    } else {
      sqStatus = 'missing';
      sqDetail = 'No Square customer';
    }
    rows.push({
      client_id: c.id, client_name: name, service: 'square', label: 'Square / Billing',
      status: sqStatus, detail: sqDetail,
    });

    // Lead Webhook
    const hasWebhook = typeof c.lead_form_webhook === 'string' && c.lead_form_webhook.length > 0;
    const hasKey = typeof t.intake_api_key === 'string' && t.intake_api_key.length > 0;
    let lwStatus, lwDetail;
    if (hasWebhook && hasKey) {
      lwStatus = 'connected';
      lwDetail = 'Webhook + API key set';
    } else if (hasWebhook) {
      lwStatus = 'incomplete';
      lwDetail = 'Webhook set, no intake API key';
    } else {
      lwStatus = 'missing';
      lwDetail = 'No lead webhook set';
    }
    rows.push({
      client_id: c.id, client_name: name, service: 'lead_webhook', label: 'Lead Webhook',
      status: lwStatus, detail: lwDetail,
    });
  });

  return rows;
}

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

// ─── PAGE FUNNEL: per-landing-page views → clicks → leads → trials → enrolled ─
// Same SSOT discipline as deriveRollups: counts are DERIVED from source rows
// (page_events + leads/bookings/enrollments), never read from a stored column.
// A "page" = one client_pages row (slug + instrument). Views/clicks come from
// page_events; leads/trials/enrolled attribute back through lead.page_url, which
// carries the slug + ?instrument the visitor came through. See data-ssot.md.
const INST_LABEL = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drums' };

function parseLeadPage(url) {
  if (!url) return null;
  try {
    const u = new URL(url, 'https://x');
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.indexOf('schools');
    const slug = i >= 0 ? parts[i + 1] : null;
    const instrument = u.searchParams.get('instrument');
    if (!slug || !instrument) return null;
    return { slug, instrument: instrument.toLowerCase() };
  } catch { return null; }
}

// sinceMs: optional lower bound (ms epoch). When set, every metric counts only
// rows whose own created_at is within the window — same discipline as useRollups'
// trailing-30d. The lead→page attribution map is built from ALL leads regardless
// of window, so an in-window booking/enrollment still resolves to its page even
// if the lead itself predates the window.
function derivePageFunnel({ pageEvents, clientPages, leads, bookings, enrollments }, sinceMs) {
  const keyOf = (slug, inst) => `${slug}|${(inst || '').toLowerCase()}`;
  const since = sinceMs ? new Date(sinceMs).toISOString() : null;
  const inWin = ts => !since || (ts && ts >= since);

  const ev = {};
  const ensureEv = k => (ev[k] = ev[k] || { views: 0, clicks: 0 });
  pageEvents.forEach(e => {
    if (!inWin(e.created_at)) return;
    const k = keyOf(e.slug, e.instrument);
    if (e.type === 'view') ensureEv(k).views += 1;
    else if (e.type === 'signup_view') ensureEv(k).clicks += 1;
  });

  const fn = {};
  const ensureFn = k => (fn[k] = fn[k] || { leads: 0, trials: 0, enrolled: 0 });
  const leadPageKey = {};
  leads.forEach(l => {
    const p = parseLeadPage(l.page_url);
    if (!p) return;
    const k = keyOf(p.slug, p.instrument);
    leadPageKey[l.id] = k;            // attribution map: ALL leads, unwindowed
    if (inWin(l.created_at)) ensureFn(k).leads += 1;
  });
  bookings.forEach(b => {
    if (!inWin(b.created_at)) return;
    const k = b.lead_id ? leadPageKey[b.lead_id] : null;
    if (k) ensureFn(k).trials += 1;
  });
  enrollments.forEach(e => {
    if (e.outcome !== 'enrolled' || !inWin(e.created_at)) return;
    const k = e.lead_id ? leadPageKey[e.lead_id] : null;
    if (k) ensureFn(k).enrolled += 1;
  });

  return clientPages.map(p => {
    const k = keyOf(p.slug, p.instrument);
    const e = ev[k] || { views: 0, clicks: 0 };
    const f = fn[k] || { leads: 0, trials: 0, enrolled: 0 };
    return {
      id: p.id,
      client_id: p.client_id,
      client_name: p.school_name || '—',
      instrument: INST_LABEL[p.instrument] || p.instrument,
      rawSlug: p.slug,
      rawInstrument: p.instrument,
      status: p.status || (p.is_active ? 'live' : 'draft'),
      slug: `${p.slug}/${p.instrument}`,
      views: e.views, clicks: e.clicks,
      leads: f.leads, trials: f.trials, enrolled: f.enrolled,
    };
  });
}

function usePageFunnel(sinceMs) {
  const pageEvents  = _useTable('page_events',  'page_events',  undefined, 'fnl').data;
  const clientPages = _useTable('client_pages', 'client_pages', undefined, 'fnl').data;
  const leads       = _useTable('leads',        'leads',        undefined, 'fnl').data;
  const bookings    = _useTable('bookings',     'bookings',     undefined, 'fnl').data;
  const enrollments = _useTable('enrollments',  'enrollments',  undefined, 'fnl').data;
  return React.useMemo(
    () => derivePageFunnel({ pageEvents, clientPages, leads, bookings, enrollments }, sinceMs),
    [pageEvents, clientPages, leads, bookings, enrollments, sinceMs]
  );
}

Object.assign(window, {
  useClients, useCampaigns, useLeads,
  useConversations, useEscalations, useBookings, useEnrollments,
  useOperatorTasks, useClientReports,
  useAutomationRules, useIntegrations,
  useAgentTenants, deriveIntegrations,
  useRollups, deriveRollups, EMPTY_CLIENT_ROLLUP, EMPTY_CAMPAIGN_ROLLUP,
  usePageFunnel, derivePageFunnel,
});
