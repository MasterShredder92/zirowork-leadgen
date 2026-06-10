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

  const cell = { padding: '12px 14px', fontSize: 13, color: 'var(--text-2)', borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Campaigns</div>
          <div style={{ fontSize: 13, color: T.t3 }}>Which piano/guitar/voice/drum funnels are running and producing?</div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} />} New Campaign
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Client', 'Program', 'Page Status', 'Leads', 'Trials', 'Enrolled', 'Conv %'].map(h => (
              <th key={h} style={{ ...cell, color: T.t4, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
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
                <td style={cell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{c.client_name}</div>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: programColor(c.program), background: programColor(c.program) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {c.program}
                  </span>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: pageColor(c.landing_page), background: pageColor(c.landing_page) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {pageLabel(c.landing_page)}
                  </span>
                </td>
                <td style={cell}>{c.leads}</td>
                <td style={cell}>{c.trials}</td>
                <td style={cell}>{c.enrolled}</td>
                <td style={cell}>{conv}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

window.CampaignsView = CampaignsView;
