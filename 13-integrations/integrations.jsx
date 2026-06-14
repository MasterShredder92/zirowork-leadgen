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

  // ── Live timestamps for platform services ──────────────────────────────────
  const [timestamps, setTimestamps] = React.useState({ twilio: null, square: null, webhook: null });

  function relativeTime(isoStr) {
    if (!isoStr) return null;
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  }

  async function fetchTimestamps() {
    if (!window.sb) return;
    try {
      const [twilioRes, squareRes, webhookRes] = await Promise.all([
        window.sb.from('ziro_message_log').select('created_at').order('created_at', { ascending: false }).limit(1),
        window.sb.from('billing_events').select('created_at').eq('status', 'succeeded').order('created_at', { ascending: false }).limit(1),
        window.sb.from('leads').select('created_at').order('created_at', { ascending: false }).limit(1),
      ]);
      setTimestamps({
        twilio: twilioRes.data?.[0]?.created_at ?? null,
        square: squareRes.data?.[0]?.created_at ?? null,
        webhook: webhookRes.data?.[0]?.created_at ?? null,
      });
    } catch (_) {
      // network failure — keep previous values
    }
  }

  React.useEffect(() => {
    fetchTimestamps();
    window.addEventListener('focus', fetchTimestamps);
    return () => window.removeEventListener('focus', fetchTimestamps);
  }, []);

  // Returns a subtitle string for a given timestamp value.
  function activityLabel(ts, prefix) {
    if (!ts) return null;
    const diffHr = (Date.now() - new Date(ts).getTime()) / 3600000;
    if (diffHr > 24) return 'No recent activity';
    return `${prefix}: ${relativeTime(ts)}`;
  }

  // ── Status helpers ─────────────────────────────────────────────────────────
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

  // Platform services with live timestamps
  const twilioActivity = activityLabel(timestamps.twilio, 'Last reply');
  const squareActivity = activityLabel(timestamps.square, 'Last charge');
  const webhookActivity = activityLabel(timestamps.webhook, 'Last lead');

  const platformServices = [
    {
      name: 'Twilio SMS',
      detail: 'Active (platform-managed)',
      activity: twilioActivity,
    },
    {
      name: 'Square Billing',
      detail: 'Platform-managed',
      activity: squareActivity,
    },
    {
      name: 'Lead Webhook',
      detail: 'Platform-managed',
      activity: webhookActivity,
    },
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

        {/* Platform Services — live timestamps from Supabase */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.t4, marginBottom: 10 }}>Platform Services</div>
          {platformServices.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.t1 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.activity && (
                  <span style={{
                    fontSize: 12,
                    color: s.activity === 'No recent activity' ? T.t4 : T.t3,
                    fontStyle: s.activity === 'No recent activity' ? 'italic' : 'normal',
                  }}>
                    {s.activity}
                  </span>
                )}
                <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>{s.detail}</span>
              </div>
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
