// 13-integrations — HONEST, derived integration status. No fake toggle: each row
// reflects what is actually configured (OpenPhone number, Square billing, lead webhook),
// derived from real clients + agent_tenants data. Platform services are read-only.
function IntegrationsView({ onNavigate }) {
  const T = window.T || {};

  const clients = window.useClients ? window.useClients().data : [];
  const tenants = window.useAgentTenants ? window.useAgentTenants().data : [];
  const rows = React.useMemo(
    () => (window.deriveIntegrations ? window.deriveIntegrations(clients, tenants) : []),
    [clients, tenants]
  );

  const [copiedId, setCopiedId] = React.useState(null);

  const statusColor = s => ({ connected: '#22C55E', incomplete: '#F97316', missing: '#F59E0B' }[s] || '#6B7280');
  const statusLabel = s => ({ connected: 'Connected', incomplete: 'Incomplete', missing: 'Missing' }[s] || s);

  const incomplete = rows.filter(r => r.status === 'incomplete').length;
  const missing = rows.filter(r => r.status === 'missing').length;

  // group derived rows by client, preserving client order
  const byClient = [];
  const idx = {};
  rows.forEach(r => {
    if (idx[r.client_id] == null) { idx[r.client_id] = byClient.length; byClient.push({ client_id: r.client_id, client_name: r.client_name, items: [] }); }
    byClient[idx[r.client_id]].items.push(r);
  });

  function copyWebhook(r) {
    const url = `https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/on-new-lead/${r.client_id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(r.client_id + ':' + r.service);
    setTimeout(() => setCopiedId(c => (c === r.client_id + ':' + r.service ? null : c)), 2000);
  }

  const btnStyle = { padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'none', fontSize: 12, color: T.t3, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" };

  function actionFor(r) {
    if (r.status === 'connected') return null;
    if (r.service === 'openphone') {
      return <button onClick={() => onNavigate && onNavigate('clients')} style={btnStyle}>Set number</button>;
    }
    if (r.service === 'square') {
      return <button onClick={() => window.open('https://squareup.com/dashboard', '_blank')} style={btnStyle}>Set up billing</button>;
    }
    if (r.service === 'lead_webhook') {
      const copied = copiedId === r.client_id + ':' + r.service;
      return <button onClick={() => copyWebhook(r)} style={btnStyle}>{copied ? 'Copied' : 'Copy webhook URL'}</button>;
    }
    return null;
  }

  const cell = { padding: '12px 0', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}` };

  const platformServices = [
    { name: 'Claude / Anthropic', detail: 'Active (platform-managed)' },
    { name: 'OpenPhone API', detail: 'Platform-managed' },
    { name: 'Square', detail: 'Platform-managed' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Integrations</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>Which forms, phone numbers, SMS, payment links, calendars, and email routes are connected or broken?</div>
      </div>

      {/* Summary band — inline stats, no boxes */}
      {(incomplete > 0 || missing > 0) && (
        <div style={{ display: 'flex', gap: 40, padding: '16px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {incomplete > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t3, marginBottom: 4 }}>Incomplete</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#F97316', fontVariantNumeric: 'tabular-nums' }}>{incomplete}</div>
            </div>
          )}
          {missing > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t3, marginBottom: 4 }}>Missing</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>{missing}</div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Platform Services — static, read-only */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t4, marginBottom: 10 }}>Platform Services</div>
          {platformServices.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.t1 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>{s.detail}</div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: T.t4, marginTop: 8 }}>Managed via Supabase Edge Function secrets.</div>
        </div>

        {/* Per-client integrations — derived rows grouped by client */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t4, marginBottom: 10 }}>Per-client integrations</div>
        {byClient.map(group => (
          <div key={group.client_id} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 4 }}>{group.client_name}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {group.items.map(r => (
                  <tr key={r.service}
                    onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                    onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                    <td style={{ ...cell, width: '22%' }}><span style={{ fontSize: 13, color: T.t2 }}>{r.label}</span></td>
                    <td style={cell}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(r.status), background: statusColor(r.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td style={cell}><span style={{ fontSize: 13, color: T.t3 }}>{r.detail}</span></td>
                    <td style={{ ...cell, textAlign: 'right' }}>{actionFor(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

window.IntegrationsView = IntegrationsView;
