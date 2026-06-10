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

  const cell = { padding: '11px 16px', fontSize: 13, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0 };
  const numCell = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Clients</h1>
          <div style={{ fontSize: 12, color: T.t3 }}>Which schools are live, onboarding, healthy, stuck, or at risk?</div>
        </div>
        <button onClick={() => { if (onNavigate) onNavigate('onboarding'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} strokeWidth={1.75} />} Add Client
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
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
              {[
                { label: 'Client', align: 'left' },
                { label: 'Status', align: 'left' },
                { label: 'Health', align: 'left' },
                { label: 'Leads 30d', align: 'right' },
                { label: 'Trials', align: 'right' },
                { label: 'Enrolled', align: 'right' },
                { label: 'MRR', align: 'right' },
                { label: 'Campaigns', align: 'right' },
              ].map((h, i, arr) => (
                <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(c => (
              <tr key={c.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                <td style={firstCell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.t4 }}>{c.city}, {c.state}</div>
                </td>
                <td style={cell}>
                  {pill(c.status === 'live' ? '#22C55E' : '#6B7280', c.status === 'live' ? 'Live' : 'Onboarding')}
                </td>
                <td style={cell}>
                  {c.health ? pill(healthColor(c.health), healthLabel(c.health)) : <span style={{ color: T.t4 }}>—</span>}
                </td>
                <td style={numCell}>{c.leads_30d != null ? c.leads_30d : <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={numCell}>{c.trials_30d != null ? c.trials_30d : <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={numCell}>{c.enrollments_30d != null ? c.enrollments_30d : <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={numCell}>{c.mrr_cents > 0 ? '$' + (c.mrr_cents / 100).toLocaleString() : <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={lastCell}>{c.active_campaigns != null ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.active_campaigns}</span> : <span style={{ color: T.t4 }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.ClientsView = ClientsView;
