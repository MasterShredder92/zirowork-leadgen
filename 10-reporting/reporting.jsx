// 10-reporting — Why should each client keep paying ZiroWork?
function ReportingView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const clients = useClients().data || [];
  const leads = useLeads().data || [];
  const enrollments = useEnrollments().data || [];

  const live = clients.filter(c => c.status === 'live');

  // ── Real metrics from Supabase ──────────────────────────────
  // msgLog: all ziro_message_log rows needed for response time + rate
  // keyed as { phones: Set<string> of inbound phones, outboundByPhone: Map<phone, earliest sent_at> }
  const [msgMetrics, setMsgMetrics] = React.useState(null);
  const [msgLoading, setMsgLoading] = React.useState(true);

  React.useEffect(() => {
    if (!window.sb) {
      setMsgLoading(false);
      return;
    }
    // Fetch all message log rows in one shot (small dataset in Phase 1)
    window.sb
      .from('ziro_message_log')
      .select('direction, recipient_phone, sent_at, created_at')
      .then(({ data: rows }) => {
        if (!rows) { setMsgLoading(false); return; }
        // inbound: track distinct phones that replied
        const inboundPhones = new Set();
        // outbound: earliest sent_at per phone (first outbound message)
        const firstOutboundByPhone = {};
        rows.forEach(r => {
          const phone = r.recipient_phone;
          if (!phone) return;
          if (r.direction === 'inbound') {
            inboundPhones.add(phone);
          } else if (r.direction === 'outbound') {
            const ts = r.sent_at || r.created_at;
            if (ts && (!firstOutboundByPhone[phone] || ts < firstOutboundByPhone[phone])) {
              firstOutboundByPhone[phone] = ts;
            }
          }
        });
        setMsgMetrics({ inboundPhones, firstOutboundByPhone });
        setMsgLoading(false);
      })
      .catch(() => setMsgLoading(false)); // never leave per-client metrics stuck on '…'
  }, []);

  // ── Month boundary (JS, no date_trunc needed) ───────────────
  const monthStart = React.useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const green = T.isDark ? '#4ADE80' : '#15803D';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Reporting</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>Why should each client keep paying ZiroWork?</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {live.map(client => {
          const mrr = client.mrr_cents ? '$' + (client.mrr_cents / 100).toFixed(0) + '/mo' : '—';

          // Leads this month (from already-fetched leads array)
          const clientLeads = leads.filter(l =>
            l.client_id === client.id && l.created_at >= monthStart
          ).length;

          // Enrollments this month
          const enrolled = enrollments.filter(e =>
            e.client_id === client.id &&
            e.outcome === 'enrolled' &&
            e.created_at >= monthStart
          ).length;

          // Revenue estimate: SUM(weekly_rate_cents * 4) for all active enrolled
          const activeEnrolled = enrollments.filter(e =>
            e.client_id === client.id && e.outcome === 'enrolled' && e.weekly_rate_cents
          );
          const revenueCents = activeEnrolled.reduce((sum, e) => sum + (e.weekly_rate_cents * 4), 0);
          const revenueStr = revenueCents > 0 ? '$' + (revenueCents / 100).toFixed(0) : null;

          // ROI multiple
          const roiMultiple = client.mrr_cents && revenueCents
            ? (revenueCents / client.mrr_cents).toFixed(1) + 'x'
            : (client.mrr_cents && enrolled
              ? ((enrolled * 12000) / client.mrr_cents).toFixed(1) + 'x'
              : '—');

          // Per-client metrics from message log
          let avgResp = msgLoading ? '…' : '—';
          let smsRespRate = msgLoading ? '…' : '—';

          if (!msgLoading && msgMetrics) {
            // phones for this client's leads
            const clientPhones = leads
              .filter(l => l.client_id === client.id && l.phone)
              .map(l => ({ phone: l.phone, created_at: l.created_at }));

            const totalLeads = clientPhones.length;

            // SMS response rate: inbound replies / total leads with phones
            if (totalLeads > 0) {
              const replied = clientPhones.filter(lp =>
                msgMetrics.inboundPhones.has(lp.phone)
              ).length;
              smsRespRate = Math.round((replied / totalLeads) * 100) + '%';
            }

            // Avg response time: avg(first_outbound_sent_at - lead.created_at) in seconds
            const responseTimes = clientPhones
              .filter(lp => msgMetrics.firstOutboundByPhone[lp.phone] && lp.created_at)
              .map(lp => {
                const diff = (new Date(msgMetrics.firstOutboundByPhone[lp.phone]) - new Date(lp.created_at)) / 1000;
                return diff;
              })
              .filter(diff => diff > 0);

            if (responseTimes.length > 0) {
              const avgSec = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
              avgResp = avgSec < 60 ? avgSec + 's' : Math.round(avgSec / 60) + 'm';
            }
          }

          return (
            <div key={client.id} style={{ paddingTop: 4, marginBottom: 32 }}>
              {/* Client heading — label over hairline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 8, borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: T.t4 }}>{client.city}</div>
                </div>
                {L.ExternalLink && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.t4, padding: 4 }}>
                    <L.ExternalLink size={14} strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {/* Inline stat band — no per-stat box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 28 }}>
                {[
                  { label: 'Leads (mo)', value: clientLeads },
                  { label: 'Avg Response', value: avgResp },
                  { label: 'Enrolled (mo)', value: enrolled },
                  { label: 'SMS Reply Rate', value: smsRespRate },
                  { label: 'Revenue / ROI', value: roiMultiple, sub: revenueStr ? revenueStr + ' est. monthly' : null, accent: true },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontSize: 29, fontWeight: 700, color: stat.accent ? green : T.t1, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                    {stat.sub && <div style={{ fontSize: 12, color: T.t4, marginTop: 3 }}>{stat.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ReportingView = ReportingView;
