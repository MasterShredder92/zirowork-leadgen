// 13-integrations — Which forms, phone numbers, SMS, payment links, calendars, and email routes are connected or broken?
function IntegrationsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const { data: rawData } = window.useIntegrations ? window.useIntegrations() : { data: [] };
  const [integrations, setIntegrations] = React.useState([]);
  React.useEffect(() => { if (rawData) setIntegrations(rawData); }, [rawData]);

  const statusColor = s => ({ connected: '#22C55E', broken: '#EF4444', not_connected: '#F59E0B' }[s] || '#6B7280');
  const statusLabel = s => ({ connected: 'Connected', broken: 'Broken', not_connected: 'Not Connected' }[s] || s);

  const broken = integrations.filter(i => i.status === 'broken').length;
  const missing = integrations.filter(i => i.status === 'not_connected').length;

  const cell = { padding: '12px 0', fontSize: 13, color: T.t2, borderBottom: `1px solid ${T.border}` };

  async function markConnected(id) {
    if (!window.sb) return;
    const { error } = await window.sb.from('integrations').update({ status: 'connected' }).eq('id', id);
    if (!error) setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'connected' } : i));
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Integrations</h1>
        <div style={{ fontSize: 12, color: T.t3 }}>Which forms, phone numbers, SMS, payment links, calendars, and email routes are connected or broken?</div>
      </div>

      {/* Summary band — inline stats, no boxes */}
      {(broken > 0 || missing > 0) && (
        <div style={{ display: 'flex', gap: 40, padding: '16px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {broken > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t3, marginBottom: 4 }}>Broken</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{broken}</div>
            </div>
          )}
          {missing > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t3, marginBottom: 4 }}>Not Connected</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>{missing}</div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Client', 'Type', 'Detail', 'Status', ''].map(h => (
              <th key={h} style={{ ...cell, color: T.t4, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {integrations.map(int => (
            <tr key={int.id}
              onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
              <td style={cell}><div style={{ fontWeight: 500, color: T.t1 }}>{int.client_name}</div></td>
              <td style={cell}><span style={{ fontSize: 12, color: T.t3 }}>{int.type}</span></td>
              <td style={cell}>{int.detail}</td>
              <td style={cell}>
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(int.status), background: statusColor(int.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                  {statusLabel(int.status)}
                </span>
              </td>
              <td style={cell}>
                {int.status !== 'connected' && (
                  <button onClick={() => markConnected(int.id)} style={{ padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'none', fontSize: 11, color: T.t3, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Fix
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

window.IntegrationsView = IntegrationsView;
