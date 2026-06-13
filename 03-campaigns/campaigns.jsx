// 03-campaigns — Per landing-page funnel: views → clicks → leads → trials → enrolled.
function CampaignsView({ onNavigate }) {
  const T = window.T || {};
  const pages = window.usePageFunnel ? window.usePageFunnel() : [];

  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');
  const statusColor  = s => ({ live: '#22C55E', active: '#22C55E', paused: '#F59E0B', draft: '#6B7280', ended: '#6B7280' }[s] || '#6B7280');
  const statusLabel  = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  const pct = (num, den) => den > 0 ? Math.round((num / den) * 100) + '%' : '—';

  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const numCell = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Campaigns</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>Every landing page, from traffic to enrolled — which ones are producing?</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Client', align: 'left' },
                { label: 'Program', align: 'left' },
                { label: 'Status', align: 'left' },
                { label: 'Views', align: 'right' },
                { label: 'Clicks', align: 'right' },
                { label: 'CTR', align: 'right' },
                { label: 'Leads', align: 'right' },
                { label: 'Trials', align: 'right' },
                { label: 'Enrolled', align: 'right' },
                { label: 'Conv', align: 'right' },
              ].map((h, i, arr) => (
                <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.id}
                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                <td style={firstCell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{p.client_name}</div>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: programColor(p.instrument), background: programColor(p.instrument) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {p.instrument}
                  </span>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(p.status), background: statusColor(p.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td style={numCell}>{p.views}</td>
                <td style={numCell}>{p.clicks}</td>
                <td style={numCell}>{pct(p.clicks, p.views)}</td>
                <td style={numCell}>{p.leads}</td>
                <td style={numCell}>{p.trials}</td>
                <td style={numCell}>{p.enrolled}</td>
                <td style={lastCell}>{pct(p.enrolled, p.leads)}</td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: T.t4, fontSize: 14 }}>No landing pages yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.CampaignsView = CampaignsView;
