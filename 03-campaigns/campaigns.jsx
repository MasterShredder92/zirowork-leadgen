// 03-campaigns — Which piano/guitar/voice/drum funnels are running and producing?
function CampaignsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState } = React;
  const [clientId, setClientId] = useState(null);
  const campaigns = useCampaigns(clientId ? { client_id: clientId } : undefined).data || [];

  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');
  const pageColor    = s => ({ live: '#22C55E', draft: '#F59E0B', broken: '#EF4444' }[s] || '#6B7280');
  const pageLabel    = s => ({ live: 'Live', draft: 'Draft', broken: 'Broken' }[s] || s);

  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0 };
  const numCell = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Campaigns</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>Which piano/guitar/voice/drum funnels are running and producing?</div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} strokeWidth={1.75} />} New Campaign
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Client', align: 'left' },
                { label: 'Program', align: 'left' },
                { label: 'Page Status', align: 'left' },
                { label: 'Leads', align: 'right' },
                { label: 'Trials', align: 'right' },
                { label: 'Enrolled', align: 'right' },
                { label: 'Conv %', align: 'right' },
              ].map((h, i, arr) => (
                <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const conv = c.leads > 0 ? ((c.enrolled / c.leads) * 100).toFixed(0) + '%' : '—';
              return (
                <tr key={c.id}
                  onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                  onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                  <td style={firstCell}>
                    <div style={{ fontWeight: 500, color: T.t1 }}>{c.client_name}</div>
                  </td>
                  <td style={cell}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: programColor(c.program), background: programColor(c.program) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                      {c.program}
                    </span>
                  </td>
                  <td style={cell}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pageColor(c.landing_page), background: pageColor(c.landing_page) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                      {pageLabel(c.landing_page)}
                    </span>
                  </td>
                  <td style={numCell}>{c.leads}</td>
                  <td style={numCell}>{c.trials}</td>
                  <td style={numCell}>{c.enrolled}</td>
                  <td style={lastCell}>{conv}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.CampaignsView = CampaignsView;
