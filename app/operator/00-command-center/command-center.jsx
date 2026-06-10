// 00-command-center — What needs attention right now across all clients?
function CommandCenterView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const clients      = useClients().data      || [];
  const escalations  = useEscalations().data  || [];
  const bookings     = useBookings().data     || [];
  const leads        = useLeads().data        || [];
  const enrollments  = useEnrollments().data  || [];

  const totalLeads       = leads.length;
  const totalTrials      = bookings.filter(b => b.status === 'completed' || b.status === 'scheduled').length;
  const totalEnrollments = enrollments.filter(e => e.outcome === 'enrolled').length;
  const totalMRR         = (clients.reduce((s, c) => s + (c.mrr_cents || 0), 0) / 100).toFixed(0);
  const openEscalations  = escalations.filter(e => e.status === 'open').length;
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

  const cell = { padding: '10px 14px', fontSize: 13, color: T.t2, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Command Center</div>
        <div style={{ fontSize: 13, color: T.t3 }}>What needs attention right now across all clients?</div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => {
          const Icon = L[k.icon];
          return (
            <div key={k.label} onClick={() => onNavigate && onNavigate(k.nav)}
              style={{ padding: '18px 20px', background: T.cardBg || 'var(--surface)', border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {Icon && <Icon size={14} color={T.t3} strokeWidth={1.7} />}
                <span style={{ fontSize: 11, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: '-0.5px' }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Attention Items */}
      {attention.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Needs Attention</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attention.map((a, i) => {
              const Icon = L[a.icon];
              return (
                <div key={i} onClick={() => onNavigate && onNavigate(a.nav)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.cardBg || 'var(--surface)', border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.hover}
                  onMouseLeave={e => e.currentTarget.style.background = T.cardBg || 'var(--surface)'}>
                  {Icon && <Icon size={15} color={a.color} strokeWidth={1.8} />}
                  <span style={{ fontSize: 13, color: T.t1 }}>{a.label}</span>
                  {L.ArrowRight && <L.ArrowRight size={13} color={T.t4} style={{ marginLeft: 'auto' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Client Health Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Overview</div>
          <button onClick={() => onNavigate && onNavigate('clients')}
            style={{ fontSize: 12, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            View all →
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Status', 'Leads 30d', 'Trials 30d', 'Enrolled 30d', 'Escalations'].map(h => (
                <th key={h} style={{ ...cell, color: T.t4, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} onClick={() => onNavigate && onNavigate('clients')}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                <td style={cell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.t4 }}>{c.city}, {c.state}</div>
                </td>
                <td style={cell}>
                  {c.health ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: healthColor(c.health), background: healthColor(c.health) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                      {healthLabel(c.health)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: 'rgba(107,114,128,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                      Onboarding
                    </span>
                  )}
                </td>
                <td style={cell}>{c.leads_30d ?? leads.filter(l => l.client_id === c.id).length}</td>
                <td style={cell}>{c.trials_30d ?? bookings.filter(b => b.client_id === c.id).length}</td>
                <td style={cell}>{c.enrollments_30d ?? enrollments.filter(e => e.client_id === c.id && e.outcome === 'enrolled').length}</td>
                <td style={cell}>
                  {c.open_escalations > 0
                    ? <span style={{ color: '#EF4444', fontWeight: 600 }}>{c.open_escalations}</span>
                    : <span style={{ color: T.t4 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.CommandCenterView = CommandCenterView;
