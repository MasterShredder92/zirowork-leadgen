// 01-clients — Which schools are live, onboarding, healthy, stuck, or at risk?
function ClientsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState } = React;
  const clients = useClients().data || [];
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all',        label: 'All' },
    { id: 'live',       label: 'Live' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'at_risk',    label: 'At Risk' },
    { id: 'stuck',      label: 'Stuck' },
  ];

  const visible = filter === 'all' ? clients : clients.filter(c =>
    filter === 'at_risk' || filter === 'stuck' ? c.health === filter : c.status === filter
  );

  const healthColor = h => ({ healthy: '#22C55E', at_risk: '#EF4444', stuck: '#F59E0B' }[h] || '#6B7280');
  const healthLabel = h => ({ healthy: 'Healthy', at_risk: 'At Risk', stuck: 'Stuck' }[h] || 'Onboarding');

  const pill = (color, label) => (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: color + '1A', padding: '2px 8px', borderRadius: 20 }}>{label}</span>
  );

  const cell = { padding: '12px 14px', fontSize: 13, color: 'var(--text-2)', borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Clients</div>
          <div style={{ fontSize: 13, color: T.t3 }}>Which schools are live, onboarding, healthy, stuck, or at risk?</div>
        </div>
        <button onClick={() => { if (onNavigate) onNavigate('onboarding'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} />} Add Client
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 12px', borderRadius: 6, border: `1px solid ${filter === f.id ? T.accent : T.border}`,
            background: filter === f.id ? T.accent + '18' : 'transparent',
            color: filter === f.id ? T.accent : T.t3,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>{f.label}</button>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Client', 'Status', 'Health', 'Leads 30d', 'Trials', 'Enrolled', 'MRR', 'Campaigns'].map(h => (
              <th key={h} style={{ ...cell, color: T.t4, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(c => (
            <tr key={c.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
              <td style={cell}>
                <div style={{ fontWeight: 500, color: T.t1 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.t4 }}>{c.city}, {c.state}</div>
              </td>
              <td style={cell}>
                {pill(c.status === 'live' ? '#22C55E' : '#6B7280', c.status === 'live' ? 'Live' : 'Onboarding')}
              </td>
              <td style={cell}>
                {c.health ? pill(healthColor(c.health), healthLabel(c.health)) : <span style={{ color: T.t4 }}>—</span>}
              </td>
              <td style={cell}>{c.leads_30d != null ? c.leads_30d : <span style={{ color: T.t4 }}>—</span>}</td>
              <td style={cell}>{c.trials_30d != null ? c.trials_30d : <span style={{ color: T.t4 }}>—</span>}</td>
              <td style={cell}>{c.enrollments_30d != null ? c.enrollments_30d : <span style={{ color: T.t4 }}>—</span>}</td>
              <td style={cell}>{c.mrr_cents > 0 ? '$' + (c.mrr_cents / 100).toLocaleString() : <span style={{ color: T.t4 }}>—</span>}</td>
              <td style={cell}>{c.active_campaigns != null ? c.active_campaigns : <span style={{ color: T.t4 }}>—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

window.ClientsView = ClientsView;
