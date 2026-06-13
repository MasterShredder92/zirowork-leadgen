// 00-command-center — What needs attention right now across all clients?
function CommandCenterView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const clients      = useClients().data      || [];
  const bookings     = useBookings().data     || [];
  const leads        = useLeads().data        || [];
  const enrollments  = useEnrollments().data  || [];
  const rollups      = window.useRollups ? window.useRollups().byClient : {};

  const totalLeads       = leads.length;
  const totalTrials      = bookings.filter(b => b.status === 'completed' || b.status === 'scheduled').length;
  const totalEnrollments = enrollments.filter(e => e.outcome === 'enrolled').length;
  const totalMRR         = (clients.reduce((s, c) => s + (c.mrr_cents || 0), 0) / 100).toFixed(0);
  const openEscalations  = Object.values(rollups).reduce((s, r) => s + (r.open_escalations || 0), 0);
  const atRiskClients    = clients.filter(c => c.health === 'at_risk' || c.health === 'stuck').length;
  const pendingBookings  = bookings.filter(b => b.status === 'requested' || b.status === 'scheduled').length;

  const [kpiActiveLeads,      setKpiActiveLeads]      = React.useState('—');
  const [kpiEnrolledMonth,    setKpiEnrolledMonth]    = React.useState('—');
  const [kpiOpenEscalations,  setKpiOpenEscalations]  = React.useState('—');
  const [kpiResponseRate,     setKpiResponseRate]     = React.useState('—');

  React.useEffect(() => {
    if (!window.sb) return;
    const sb = window.sb;

    // Active leads: stage not enrolled or lost
    sb.from('leads').select('id', { count: 'exact', head: true })
      .not('stage', 'in', '("enrolled","lost")')
      .then(({ count }) => { if (count != null) setKpiActiveLeads(count); });

    // Enrollments this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    sb.from('enrollments').select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart)
      .then(({ count }) => { if (count != null) setKpiEnrolledMonth(count); });

    // Open escalations
    sb.from('ziro_messaging_escalations').select('id', { count: 'exact', head: true })
      .is('resolved_at', null)
      .then(({ count }) => { if (count != null) setKpiOpenEscalations(count); });

    // Response rate: leads with at least one inbound message / total leads
    Promise.all([
      sb.from('leads').select('id', { count: 'exact', head: true }),
      sb.from('ziro_message_log').select('recipient_phone').eq('direction', 'inbound'),
    ]).then(([leadsRes, msgRes]) => {
      const total = leadsRes.count || 0;
      if (total === 0) { setKpiResponseRate('0%'); return; }
      const replied = new Set((msgRes.data || []).map(r => r.recipient_phone).filter(Boolean)).size;
      setKpiResponseRate(Math.round((replied / total) * 100) + '%');
    });
  }, []);

  const kpis = [
    { label: 'Active Leads',      value: kpiActiveLeads,      icon: 'Inbox',        nav: 'leads' },
    { label: 'Enrolled (mo)',     value: kpiEnrolledMonth,    icon: 'UserCheck',    nav: 'enrollments' },
    { label: 'Open Escalations',  value: kpiOpenEscalations,  icon: 'AlertTriangle', nav: 'escalations' },
    { label: 'Response Rate',     value: kpiResponseRate,     icon: 'MessageSquare', nav: 'conversations' },
  ];

  const attention = [
    openEscalations  > 0 && { icon: 'AlertTriangle', color: '#EF4444', label: `${openEscalations} open escalation${openEscalations > 1 ? 's' : ''} need human review`, nav: 'escalations' },
    atRiskClients    > 0 && { icon: 'Building2',     color: '#F59E0B', label: `${atRiskClients} client${atRiskClients > 1 ? 's' : ''} at risk or stuck`,                nav: 'clients' },
    pendingBookings  > 0 && { icon: 'CalendarCheck', color: '#3B82F6', label: `${pendingBookings} trial${pendingBookings > 1 ? 's' : ''} requested or scheduled`,        nav: 'bookings' },
  ].filter(Boolean);

  const healthColor = h => ({ healthy: '#22C55E', at_risk: '#EF4444', stuck: '#F59E0B' }[h] || '#6B7280');
  const healthLabel = h => ({ healthy: 'Healthy', at_risk: 'At Risk', stuck: 'Stuck', onboarding: 'Onboarding' }[h] || '—');

  // Flush-left table cells: first column hugs the left margin, last hugs the right (Attio table look)
  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0 };
  const numCell = { ...cell, textAlign: 'right', color: T.t2, fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Command Center</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>What needs attention right now across all clients</div>
      </div>

      {/* KPI band — inline stats, no boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {kpis.map(k => {
          const Icon = L[k.icon];
          return (
            <div key={k.label} onClick={() => onNavigate && onNavigate(k.nav)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => { const v = e.currentTarget.querySelector('[data-kpi-value]'); if (v) v.style.color = T.accent; }}
              onMouseLeave={e => { const v = e.currentTarget.querySelector('[data-kpi-value]'); if (v) v.style.color = T.t1; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {Icon && <Icon size={12} color={T.t4} strokeWidth={1.75} />}
                <span style={{ fontSize: 11, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{k.label}</span>
              </div>
              <div data-kpi-value style={{ fontSize: 29, fontWeight: 700, color: T.t1, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums', transition: 'color 0.15s' }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Needs Attention — flat rows, hairline separated */}
        {attention.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 8, borderBottom: `1px solid ${T.border}`, marginBottom: 2 }}>Needs Attention</div>
            {attention.map((a, i) => {
              const Icon = L[a.icon];
              return (
                <div key={i} onClick={() => onNavigate && onNavigate(a.nav)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', margin: '0 -8px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {Icon && <Icon size={15} color={a.color} strokeWidth={1.8} />}
                  <span style={{ fontSize: 14, color: T.t1 }}>{a.label}</span>
                  {L.ArrowRight && <L.ArrowRight size={13} color={T.t4} style={{ marginLeft: 'auto' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Client Overview — borderless table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: `1px solid ${T.border}`, marginBottom: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Overview</div>
            <button onClick={() => onNavigate && onNavigate('clients')}
              style={{ fontSize: 13, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              View all →
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Client', align: 'left' },
                  { label: 'Status', align: 'left' },
                  { label: 'Leads 30d', align: 'right' },
                  { label: 'Trials 30d', align: 'right' },
                  { label: 'Enrolled 30d', align: 'right' },
                  { label: 'Escalations', align: 'right' },
                ].map((h, i, arr) => (
                  <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const r = rollups[c.id] || window.EMPTY_CLIENT_ROLLUP || {};
                return (
                <tr key={c.id} onClick={() => onNavigate && onNavigate('clients')}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                  onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                  <td style={firstCell}>
                    <div style={{ fontWeight: 500, color: T.t1 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: T.t4 }}>{c.city}, {c.state}</div>
                  </td>
                  <td style={cell}>
                    {c.health ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: healthColor(c.health), background: healthColor(c.health) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                        {healthLabel(c.health)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'rgba(107,114,128,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                        Onboarding
                      </span>
                    )}
                  </td>
                  <td style={numCell}>{r.leads_30d}</td>
                  <td style={numCell}>{r.trials_30d}</td>
                  <td style={numCell}>{r.enrollments_30d}</td>
                  <td style={lastCell}>
                    {r.open_escalations > 0
                      ? <span style={{ color: '#EF4444', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.open_escalations}</span>
                      : <span style={{ color: T.t4 }}>—</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.CommandCenterView = CommandCenterView;
